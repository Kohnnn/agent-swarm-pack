import assert from 'node:assert/strict'
import test from 'node:test'
import { createBridgeServer } from '../src/index.js'
import { createStatusRelay } from '../src/status-relay.js'

function createConfig(overrides = {}) {
  return {
    port: 0,
    bridgeSecret: 'bridge-secret',
    swarmclawUrl: 'http://127.0.0.1:3456',
    swarmclawAccessKey: 'swarm-key',
    agentsswarmApiUrl: 'http://127.0.0.1:8790',
    agentsswarmAuthToken: '',
    inboxWebhookSecret: 'inbox-secret',
    defaultPlatform: 'telegram',
    defaultAccountId: 'primary',
    defaultProjectPath: 'C:/workspace/project',
    defaultRoute: {
      connectorId: '',
      channelId: '',
      platform: 'telegram',
      accountId: 'primary',
      threadId: '',
    },
    routeMap: {},
    channelRouteMap: {},
    statusRelayEnabled: false,
    statusRelayManagedOnly: true,
    statusRelayIntervalMs: 25,
    directiveSkipPlannedMeeting: true,
    taskCommandMode: 'hybrid',
    defaultCompactPackKey: 'software-6',
    defaultProviderProfileId: 'codex-main',
    requiredCliToolIds: ['openclaw', 'codex'],
    supportedPlatforms: ['telegram', 'discord', 'whatsapp', 'cli'],
    compactAgentLimit: 8,
    enforceCompactProjectScope: true,
    allowUnsecuredBridge: false,
    maxIngestBodyBytes: 64 * 1024,
    ingestMessageIdTtlMs: 5 * 60 * 1000,
    channelRouteTtlMs: 7 * 24 * 60 * 60 * 1000,
    projectRouteTtlMs: 7 * 24 * 60 * 60 * 1000,
    taskRouteTtlMs: 3 * 24 * 60 * 60 * 1000,
    projectPathCacheTtlMs: 5 * 60 * 1000,
    httpRetryMaxAttempts: 2,
    httpRetryBaseDelayMs: 5,
    configIssues: [],
    ...overrides,
  }
}

function createRelayStub() {
  return {
    start() {},
    stop() {},
    async tick() {},
  }
}

async function postJson(url, body, headers = {}) {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body,
  })
}

test('POST /ingest returns 400 for invalid JSON', async (t) => {
  const bridge = createBridgeServer({
    config: createConfig(),
    bridgeState: {},
    relayFactory: () => createRelayStub(),
    saveState: () => {},
  })
  await bridge.start({ port: 0 })
  t.after(async () => {
    await bridge.stop()
  })

  const response = await postJson(`${bridge.getListenUrl()}/ingest`, '{', {
    'x-bridge-secret': 'bridge-secret',
  })

  assert.equal(response.status, 400)
  const body = await response.json()
  assert.equal(body.error, 'invalid_json')
  assert.equal(typeof body.requestId, 'string')
})

test('POST /ingest validates required route fields', async (t) => {
  const bridge = createBridgeServer({
    config: createConfig(),
    bridgeState: {},
    relayFactory: () => createRelayStub(),
    saveState: () => {},
  })
  await bridge.start({ port: 0 })
  t.after(async () => {
    await bridge.stop()
  })

  const response = await postJson(
    `${bridge.getListenUrl()}/ingest`,
    JSON.stringify({
      text: '#Ship release',
      channelId: 'channel-1',
    }),
    { 'x-bridge-secret': 'bridge-secret' },
  )

  assert.equal(response.status, 400)
  const body = await response.json()
  assert.equal(body.error, 'connector_id_required')
  assert.equal(typeof body.requestId, 'string')
})

test('POST /ingest requires a project path for directives when no default exists', async (t) => {
  const bridge = createBridgeServer({
    config: createConfig({ defaultProjectPath: '' }),
    bridgeState: {},
    relayFactory: () => createRelayStub(),
    saveState: () => {},
  })
  await bridge.start({ port: 0 })
  t.after(async () => {
    await bridge.stop()
  })

  const response = await postJson(
    `${bridge.getListenUrl()}/ingest`,
    JSON.stringify({
      text: '$sync roadmap',
      connectorId: 'connector-1',
      channelId: 'channel-1',
    }),
    { 'x-bridge-secret': 'bridge-secret' },
  )

  assert.equal(response.status, 400)
  const body = await response.json()
  assert.equal(body.error, 'project_path_required')
  assert.equal(typeof body.requestId, 'string')
})

test('POST /ingest registers task routes for successful task commands', async (t) => {
  let receivedPayload = null

  const bridge = createBridgeServer({
    config: createConfig(),
    bridgeState: {},
    relayFactory: () => createRelayStub(),
    saveState: () => {},
    createTaskAndRun: async (_config, payload) => {
      receivedPayload = payload
      return {
        taskId: 'task-12345678',
        title: 'Ship release',
        projectPath: 'C:/workspace/project',
        ackText: 'Task registered and started (task-1234).',
      }
    },
  })
  await bridge.start({ port: 0 })
  t.after(async () => {
    await bridge.stop()
  })

  const response = await postJson(
    `${bridge.getListenUrl()}/ingest`,
    JSON.stringify({
      text: '#Ship release',
      connectorId: 'connector-1',
      channelId: 'channel-9',
    }),
    { 'x-bridge-secret': 'bridge-secret' },
  )

  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.deduplicated, false)
  assert.equal(typeof body.requestId, 'string')
  assert.deepEqual(receivedPayload, {
    text: '#Ship release',
    platform: 'telegram',
    accountId: 'primary',
    channelId: 'channel-9',
    threadId: '',
    connectorId: 'connector-1',
    senderId: '',
    senderName: '',
    providerProfileId: '',
    compactPackKey: '',
    projectPath: 'C:/workspace/project',
  })

  const routesResponse = await fetch(`${bridge.getListenUrl()}/routes`)
  const routes = await routesResponse.json()
  assert.equal(routes.channelRoutes['telegram|primary|channel-9|-'].connectorId, 'connector-1')
  assert.equal(routes.projectRoutes['C:/workspace/project'].connectorId, 'connector-1')
  assert.equal(routes.taskRoutes['task-12345678'].channelId, 'channel-9')
  assert.deepEqual(routes.managedTaskIds, ['task-12345678'])
})

test('summary endpoints expose providers, packs, and channels', async (t) => {
  const bridge = createBridgeServer({
    config: createConfig(),
    bridgeState: {},
    relayFactory: () => createRelayStub(),
    saveState: () => {},
  })
  await bridge.start({ port: 0 })
  t.after(async () => {
    await bridge.stop()
  })

  const packsResponse = await fetch(`${bridge.getListenUrl()}/packs`)
  const packs = await packsResponse.json()
  assert.equal(packs.ok, true)
  assert.equal(packs.defaultCompactPackKey, 'software-6')
  assert.ok(Array.isArray(packs.packs))

  const providersResponse = await fetch(`${bridge.getListenUrl()}/providers`)
  const providers = await providersResponse.json()
  assert.equal(providers.ok, true)
  assert.equal(providers.defaultProviderProfileId, 'codex-main')
  assert.ok(Array.isArray(providers.profiles))

  const channelsResponse = await fetch(`${bridge.getListenUrl()}/channels`)
  const channels = await channelsResponse.json()
  assert.equal(channels.ok, true)
  assert.deepEqual(channels.supportedPlatforms, ['telegram', 'discord', 'whatsapp', 'cli'])
})

test('terminal relay updates prune managed task state after final notification', async (t) => {
  const bridge = createBridgeServer({
    config: createConfig(),
    bridgeState: {
      channelRoutes: {},
      projectRoutes: {
        'C:/workspace/project': {
          connectorId: 'connector-1',
          channelId: 'channel-1',
        },
      },
      taskRoutes: {
        'task-12345678': {
          connectorId: 'connector-1',
          channelId: 'channel-1',
          projectPath: 'C:/workspace/project',
          title: 'Ship release',
          createdAt: 1,
        },
      },
      managedTasks: {
        'task-12345678': {
          createdAt: 1,
          title: 'Ship release',
          projectPath: 'C:/workspace/project',
        },
      },
      lastStatusByTask: {},
    },
    saveState: () => {},
    relayFactory: (params) => createStatusRelay({
      ...params,
      listTasks: async () => [
        {
          id: 'task-12345678',
          status: 'done',
          title: 'Ship release',
          project_path: 'C:/workspace/project',
        },
      ],
      sendUpdate: async () => {},
    }),
  })
  t.after(async () => {
    await bridge.stop()
  })

  await bridge.statusRelay.tick()

  const snapshot = bridge.getStateSnapshot()
  assert.deepEqual(snapshot.channelRoutes, {})
  assert.deepEqual(snapshot.taskRoutes, {})
  assert.deepEqual(snapshot.managedTasks, {})
  assert.deepEqual(snapshot.lastStatusByTask, {})
})

test('POST /ingest rejects oversized payloads', async (t) => {
  const bridge = createBridgeServer({
    config: createConfig({ maxIngestBodyBytes: 32 }),
    bridgeState: {},
    relayFactory: () => createRelayStub(),
    saveState: () => {},
  })
  await bridge.start({ port: 0 })
  t.after(async () => {
    await bridge.stop()
  })

  const response = await postJson(
    `${bridge.getListenUrl()}/ingest`,
    JSON.stringify({
      text: '#Ship release with a body that is intentionally too large',
      connectorId: 'connector-1',
      channelId: 'channel-1',
    }),
    { 'x-bridge-secret': 'bridge-secret' },
  )

  assert.equal(response.status, 413)
  const body = await response.json()
  assert.equal(body.error, 'request_body_too_large')
})

test('POST /ingest deduplicates repeated message ids', async (t) => {
  let callCount = 0

  const bridge = createBridgeServer({
    config: createConfig(),
    bridgeState: {},
    relayFactory: () => createRelayStub(),
    saveState: () => {},
    createTaskAndRun: async () => {
      callCount += 1
      return {
        taskId: 'task-dedupe-1',
        title: 'Ship release',
        projectPath: 'C:/workspace/project',
        ackText: 'Task registered and started (task-dedu).',
      }
    },
  })
  await bridge.start({ port: 0 })
  t.after(async () => {
    await bridge.stop()
  })

  const payload = JSON.stringify({
    text: '#Ship release',
    connectorId: 'connector-1',
    channelId: 'channel-9',
    messageId: 'discord-msg-1',
  })

  const first = await postJson(`${bridge.getListenUrl()}/ingest`, payload, {
    'x-bridge-secret': 'bridge-secret',
  })
  const second = await postJson(`${bridge.getListenUrl()}/ingest`, payload, {
    'x-bridge-secret': 'bridge-secret',
  })

  assert.equal(callCount, 1)
  assert.equal(first.status, 200)
  assert.equal(second.status, 200)
  assert.equal((await first.json()).deduplicated, false)
  assert.equal((await second.json()).deduplicated, true)
})

test('POST /maintenance/prune removes expired routes', async (t) => {
  const now = Date.now()
  const bridge = createBridgeServer({
    config: createConfig({
      channelRouteTtlMs: 20,
      projectRouteTtlMs: 20,
      taskRouteTtlMs: 20,
    }),
    bridgeState: {
      channelRoutes: {
        'telegram|primary|channel-1|-': {
          connectorId: 'connector-1',
          channelId: 'channel-1',
          updatedAt: now,
        },
      },
      projectRoutes: {
        'C:/workspace/project': {
          connectorId: 'connector-1',
          channelId: 'channel-1',
          updatedAt: now,
        },
      },
      taskRoutes: {
        'task-1': {
          connectorId: 'connector-1',
          channelId: 'channel-1',
          projectPath: 'C:/workspace/project',
          title: 'Ship release',
          createdAt: now,
          updatedAt: now,
        },
      },
      managedTasks: {
        'task-1': {
          createdAt: now,
          title: 'Ship release',
          projectPath: 'C:/workspace/project',
        },
      },
      lastStatusByTask: {
        'task-1': 'done',
      },
    },
    relayFactory: () => createRelayStub(),
    saveState: () => {},
  })
  await bridge.start({ port: 0 })
  t.after(async () => {
    await bridge.stop()
  })

  await new Promise((resolve) => setTimeout(resolve, 30))

  const response = await postJson(
    `${bridge.getListenUrl()}/maintenance/prune`,
    JSON.stringify({ dryRun: false }),
    { 'x-bridge-secret': 'bridge-secret' },
  )

  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.channelRoutesPruned, 1)
  assert.equal(body.projectRoutesPruned, 1)
  assert.equal(body.taskRoutesPruned, 1)
  assert.equal(body.managedTasksPruned, 1)
  assert.equal(body.statusEntriesPruned, 1)
})
