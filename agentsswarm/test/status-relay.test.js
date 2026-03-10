import assert from 'node:assert/strict'
import test from 'node:test'
import { createStatusRelay } from '../src/status-relay.js'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

test('status relay only sends updates when task status changes', async () => {
  const lastStatus = new Map()
  const sent = []

  const relay = createStatusRelay({
    config: {
      statusRelayEnabled: true,
      statusRelayIntervalMs: 25,
    },
    resolveRouteForTask: () => ({
      connectorId: 'connector-1',
      channelId: 'channel-1',
    }),
    shouldRelayTask: () => true,
    getLastStatus: (taskId) => lastStatus.get(taskId),
    setLastStatus: (taskId, status) => {
      lastStatus.set(taskId, status)
    },
    listTasks: async () => [
      {
        id: 'task-12345678',
        status: 'in_progress',
        title: 'Ship release',
        project_path: 'C:/workspace/project',
      },
    ],
    sendUpdate: async (_config, route, text) => {
      sent.push({ route, text })
    },
  })

  await relay.tick()
  await relay.tick()

  assert.deepEqual(sent, [
    {
      route: {
        connectorId: 'connector-1',
        channelId: 'channel-1',
      },
      text: '[Building] Ship release (task-123)',
    },
  ])
})

test('status relay skips upstream polling when managed-only mode has no managed tasks', async () => {
  let listCalls = 0

  const relay = createStatusRelay({
    config: {
      statusRelayEnabled: true,
      statusRelayManagedOnly: true,
      statusRelayIntervalMs: 25,
    },
    resolveRouteForTask: () => null,
    shouldRelayTask: () => true,
    getLastStatus: () => null,
    setLastStatus: () => {},
    hasManagedTasks: () => false,
    listTasks: async () => {
      listCalls += 1
      return []
    },
  })

  await relay.tick()

  assert.equal(listCalls, 0)
})

test('status relay prevents overlapping polls', async () => {
  let listCalls = 0

  const relay = createStatusRelay({
    config: {
      statusRelayEnabled: true,
      statusRelayManagedOnly: false,
      statusRelayIntervalMs: 5,
    },
    resolveRouteForTask: () => null,
    shouldRelayTask: () => true,
    getLastStatus: () => null,
    setLastStatus: () => {},
    listTasks: async () => {
      listCalls += 1
      await sleep(20)
      return []
    },
  })

  const tickA = relay.tick()
  const tickB = relay.tick()

  assert.strictEqual(tickA, tickB)
  await Promise.all([tickA, tickB])
  assert.equal(listCalls, 1)
})

test('status relay passes managed task ids to targeted polling', async () => {
  let receivedOptions = null

  const relay = createStatusRelay({
    config: {
      statusRelayEnabled: true,
      statusRelayManagedOnly: true,
      statusRelayIntervalMs: 25,
    },
    resolveRouteForTask: () => null,
    shouldRelayTask: () => false,
    getLastStatus: () => null,
    setLastStatus: () => {},
    hasManagedTasks: () => true,
    getManagedTaskIds: () => ['task-alpha', 'task-beta'],
    listTasks: async (_config, options) => {
      receivedOptions = options
      return []
    },
  })

  await relay.tick()

  assert.deepEqual(receivedOptions, {
    taskIds: ['task-alpha', 'task-beta'],
  })
})
