import http from 'node:http'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { listSupportedPlatforms, normalizeChannelEnvelope, sanitizeRoute, toChannelRouteKey } from './channels.js'
import { listCompactPacks } from './compact-packs.js'
import { loadConfig } from './config.js'
import { createAndRunTaskInAgentsswarm, forwardDirectiveToAgentsswarm } from './forwarder.js'
import { createRequestId, createTextPreview, logError, logInfo, logWarn } from './logger.js'
import { buildProviderSummary } from './providers.js'
import { createStatusRelay } from './status-relay.js'
import { loadBridgeState, saveBridgeState } from './state-store.js'

const MAX_TEXT_LENGTH = 4_000
const MAX_ROUTE_VALUE_LENGTH = 256
const MAX_ID_LENGTH = 160
const MAX_PROJECT_PATH_LENGTH = 1_024

function json(res, statusCode, payload, headers = {}) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    ...headers,
  })
  res.end(JSON.stringify(payload))
}

function createHttpError(statusCode, code) {
  const error = new Error(code)
  error.statusCode = statusCode
  error.code = code
  return error
}

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function normalize(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function validateMaxLength(value, maxLength, code) {
  if (value && value.length > maxLength) {
    throw createHttpError(400, code)
  }
}

function validateAbsolutePath(projectPath) {
  if (!projectPath) return
  if (!path.isAbsolute(projectPath)) {
    throw createHttpError(400, 'project_path_must_be_absolute')
  }
}

function resolveDedupeKey(parsed) {
  if (!parsed.messageId) return ''
  return [parsed.commandType, parsed.route.key, parsed.messageId].join('|')
}

function hasExpired(timestamp, ttlMs, now) {
  if (!Number.isFinite(ttlMs) || ttlMs <= 0) return false
  if (!Number.isFinite(timestamp) || timestamp <= 0) return false
  return now - timestamp >= ttlMs
}

export async function readBody(req, options = {}) {
  const chunks = []
  const maxBytes = Number(options.maxBytes || 64 * 1024)
  let totalBytes = 0
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk)
    totalBytes += buffer.length
    if (totalBytes > maxBytes) {
      throw createHttpError(413, 'request_body_too_large')
    }
    chunks.push(buffer)
  }
  const text = Buffer.concat(chunks).toString('utf8').trim()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    throw createHttpError(400, 'invalid_json')
  }
}

export function detectCommandType(text, explicitType) {
  if (explicitType === 'directive' || explicitType === 'task') return explicitType
  const raw = String(text || '').trimStart()
  if (raw.startsWith('$')) return 'directive'
  if (raw.startsWith('#')) return 'task'
  return null
}

export function validateIngestBody(body, config) {
  if (!isPlainObject(body)) {
    throw createHttpError(400, 'invalid_body')
  }

  const text = normalize(body.text)
  if (!text) {
    throw createHttpError(400, 'command_text_required')
  }
  validateMaxLength(text, MAX_TEXT_LENGTH, 'command_text_too_long')

  const explicitCommandType = normalize(body.commandType)
  if (explicitCommandType && !['directive', 'task'].includes(explicitCommandType)) {
    throw createHttpError(400, 'invalid_command_type')
  }

  const commandType = detectCommandType(text, explicitCommandType)
  if (!commandType) {
    throw createHttpError(400, 'command_type_required')
  }

  const messageId = normalize(body.messageId)
  validateMaxLength(messageId, MAX_ID_LENGTH, 'message_id_too_long')

  const route = normalizeChannelEnvelope(body, {
    defaultPlatform: config.defaultPlatform,
    defaultAccountId: config.defaultAccountId,
  })

  if (!config.supportedPlatforms.includes(route.platform)) {
    throw createHttpError(400, 'unsupported_platform')
  }
  if (!route.connectorId) {
    throw createHttpError(400, 'connector_id_required')
  }
  if (!route.channelId) {
    throw createHttpError(400, 'channel_id_required')
  }

  validateMaxLength(route.connectorId, MAX_ROUTE_VALUE_LENGTH, 'connector_id_too_long')
  validateMaxLength(route.channelId, MAX_ROUTE_VALUE_LENGTH, 'channel_id_too_long')
  validateMaxLength(route.threadId, MAX_ROUTE_VALUE_LENGTH, 'thread_id_too_long')
  validateMaxLength(route.accountId, MAX_ROUTE_VALUE_LENGTH, 'account_id_too_long')
  validateMaxLength(route.senderId, MAX_ID_LENGTH, 'sender_id_too_long')
  validateMaxLength(route.senderName, MAX_ID_LENGTH, 'sender_name_too_long')

  const projectPath = normalize(body.projectPath) || config.defaultProjectPath
  validateMaxLength(projectPath, MAX_PROJECT_PATH_LENGTH, 'project_path_too_long')
  validateAbsolutePath(projectPath)
  if (commandType === 'directive' && !projectPath) {
    throw createHttpError(400, 'project_path_required')
  }

  const providerProfileId = normalize(body.providerProfileId)
  const compactPackKey = normalize(body.compactPackKey)
  validateMaxLength(providerProfileId, MAX_ID_LENGTH, 'provider_profile_id_too_long')
  validateMaxLength(compactPackKey, MAX_ID_LENGTH, 'compact_pack_key_too_long')

  return {
    text,
    commandType,
    route,
    projectPath,
    senderId: normalize(body.senderId),
    senderName: normalize(body.senderName),
    providerProfileId,
    compactPackKey,
    messageId,
  }
}

export function createBridgeServer(options = {}) {
  const config = options.config || loadConfig()
  const bridgeState = options.bridgeState || loadBridgeState()
  const saveState = options.saveState || saveBridgeState
  const forwardDirective = options.forwardDirective || forwardDirectiveToAgentsswarm
  const createTaskAndRun = options.createTaskAndRun || createAndRunTaskInAgentsswarm
  const relayFactory = options.relayFactory || createStatusRelay

  const runtimeChannelRouteMap = new Map(
    Object.entries(bridgeState.channelRoutes || {}).map(([key, route]) => [key, normalizeStoredRoute(route)]),
  )
  const runtimeProjectRouteMap = new Map(
    Object.entries(bridgeState.projectRoutes || {}).map(([key, route]) => [key, normalizeStoredRoute(route)]),
  )
  const runtimeTaskRouteMap = new Map(
    Object.entries(bridgeState.taskRoutes || {}).map(([key, route]) => [key, normalizeStoredRoute(route)]),
  )
  const managedTaskSet = new Set(Object.keys(bridgeState.managedTasks || {}))
  const lastStatusByTask = new Map(Object.entries(bridgeState.lastStatusByTask || {}))
  const recentMessageMap = new Map()

  let persistInFlight = null
  let queuedSnapshot = null

  function normalizeStoredRoute(route) {
    return sanitizeRoute(route, {
      defaultPlatform: config.defaultPlatform,
      defaultAccountId: config.defaultAccountId,
    })
  }

  function snapshotState() {
    const channelRoutes = Object.fromEntries(runtimeChannelRouteMap.entries())
    const projectRoutes = Object.fromEntries(runtimeProjectRouteMap.entries())
    const taskRoutes = Object.fromEntries(runtimeTaskRouteMap.entries())
    const managedTasks = {}
    for (const taskId of managedTaskSet.values()) {
      const taskRoute = runtimeTaskRouteMap.get(taskId)
      managedTasks[taskId] = {
        createdAt: taskRoute?.createdAt || Date.now(),
        title: taskRoute?.title || taskId,
        projectPath: taskRoute?.projectPath || '',
      }
    }
    const statusSnapshot = Object.fromEntries(lastStatusByTask.entries())
    return { channelRoutes, projectRoutes, taskRoutes, managedTasks, lastStatusByTask: statusSnapshot }
  }

  function startPersistLoop() {
    if (persistInFlight) return persistInFlight
    persistInFlight = (async () => {
      while (queuedSnapshot) {
        const nextSnapshot = queuedSnapshot
        queuedSnapshot = null
        await Promise.resolve(saveState(nextSnapshot))
      }
    })().catch((err) => {
      logWarn('state_persist_failed', {
        error: err instanceof Error ? err.message : String(err),
      })
    }).finally(() => {
      persistInFlight = null
      if (queuedSnapshot) {
        void startPersistLoop()
      }
    })
    return persistInFlight
  }

  function persistBridgeState() {
    queuedSnapshot = snapshotState()
    return startPersistLoop()
  }

  async function flushBridgeState() {
    const pending = persistBridgeState()
    await pending
    if (persistInFlight) {
      await persistInFlight
    }
  }

  function requireSecret(req) {
    if (!config.bridgeSecret) return true
    const provided = String(req.headers['x-bridge-secret'] || '').trim()
    return provided && provided === config.bridgeSecret
  }

  function registerChannelRoute(route, projectPath) {
    if (!route?.connectorId || !route?.channelId) return
    const key = toChannelRouteKey(route, {
      defaultPlatform: config.defaultPlatform,
      defaultAccountId: config.defaultAccountId,
    })
    runtimeChannelRouteMap.set(key, {
      ...normalizeStoredRoute(route),
      projectPath: normalize(projectPath),
      updatedAt: Date.now(),
    })
    void persistBridgeState()
  }

  function registerProjectRoute(projectPath, route) {
    const key = normalize(projectPath)
    if (!key) return
    runtimeProjectRouteMap.set(key, {
      ...normalizeStoredRoute(route),
      updatedAt: Date.now(),
    })
    void persistBridgeState()
  }

  function resolveRoute(projectPath, channel) {
    const channelKey = channel
      ? toChannelRouteKey(channel, {
          defaultPlatform: config.defaultPlatform,
          defaultAccountId: config.defaultAccountId,
        })
      : ''
    if (channelKey && runtimeChannelRouteMap.has(channelKey)) {
      return runtimeChannelRouteMap.get(channelKey)
    }
    if (channelKey && config.channelRouteMap[channelKey]) {
      return normalizeStoredRoute(config.channelRouteMap[channelKey])
    }

    const key = normalize(projectPath)
    if (key && runtimeProjectRouteMap.has(key)) {
      return runtimeProjectRouteMap.get(key)
    }
    if (key && config.routeMap[key]) {
      const mapRow = normalizeStoredRoute(config.routeMap[key])
      if (mapRow?.connectorId && mapRow?.channelId) return mapRow
    }
    if (config.defaultRoute.connectorId && config.defaultRoute.channelId) {
      return normalizeStoredRoute(config.defaultRoute)
    }
    return null
  }

  function registerTaskRoute(taskId, route, projectPath, title) {
    if (!taskId) return
    const now = Date.now()
    runtimeTaskRouteMap.set(taskId, {
      ...normalizeStoredRoute(route),
      projectPath: normalize(projectPath),
      title: normalize(title),
      createdAt: now,
      updatedAt: now,
    })
    managedTaskSet.add(taskId)
    void persistBridgeState()
  }

  function resolveRouteForTask(projectPath, taskId) {
    if (taskId && runtimeTaskRouteMap.has(taskId)) {
      return runtimeTaskRouteMap.get(taskId)
    }
    return resolveRoute(projectPath)
  }

  function shouldRelayTask(task) {
    if (!config.statusRelayManagedOnly) return true
    const taskId = typeof task?.id === 'string' ? task.id : ''
    return !!taskId && managedTaskSet.has(taskId)
  }

  function getLastStatus(taskId) {
    return lastStatusByTask.get(taskId)
  }

  function setLastStatus(taskId, status) {
    lastStatusByTask.set(taskId, status)
    void persistBridgeState()
  }

  function hasManagedTasks() {
    return managedTaskSet.size > 0
  }

  function getManagedTaskIds() {
    return Array.from(managedTaskSet.values())
  }

  function pruneTaskState(taskId) {
    if (!taskId) return
    runtimeTaskRouteMap.delete(taskId)
    managedTaskSet.delete(taskId)
    lastStatusByTask.delete(taskId)
    void persistBridgeState()
  }

  function pruneRecentMessages(now = Date.now()) {
    for (const [key, entry] of recentMessageMap.entries()) {
      const completedAt = Number(entry?.completedAt || 0)
      const startedAt = Number(entry?.startedAt || 0)
      const timestamp = completedAt || startedAt
      if (hasExpired(timestamp, config.ingestMessageIdTtlMs, now)) {
        recentMessageMap.delete(key)
      }
    }
  }

  function pruneExpiredState(options = {}) {
    const now = Number(options.now || Date.now())
    const dryRun = options.dryRun === true
    const result = {
      dryRun,
      channelRoutesPruned: 0,
      projectRoutesPruned: 0,
      taskRoutesPruned: 0,
      managedTasksPruned: 0,
      statusEntriesPruned: 0,
    }

    const expiredTaskIds = new Set()

    for (const [key, route] of runtimeChannelRouteMap.entries()) {
      if (!hasExpired(Number(route?.updatedAt), config.channelRouteTtlMs, now)) continue
      result.channelRoutesPruned += 1
      if (!dryRun) runtimeChannelRouteMap.delete(key)
    }

    for (const [key, route] of runtimeProjectRouteMap.entries()) {
      if (!hasExpired(Number(route?.updatedAt), config.projectRouteTtlMs, now)) continue
      result.projectRoutesPruned += 1
      if (!dryRun) runtimeProjectRouteMap.delete(key)
    }

    for (const [taskId, route] of runtimeTaskRouteMap.entries()) {
      const taskTimestamp = Number(route?.updatedAt || route?.createdAt)
      if (!hasExpired(taskTimestamp, config.taskRouteTtlMs, now)) continue
      result.taskRoutesPruned += 1
      expiredTaskIds.add(taskId)
      if (!dryRun) runtimeTaskRouteMap.delete(taskId)
    }

    for (const taskId of managedTaskSet.values()) {
      if (!expiredTaskIds.has(taskId)) continue
      result.managedTasksPruned += 1
      if (!dryRun) managedTaskSet.delete(taskId)
    }

    for (const taskId of lastStatusByTask.keys()) {
      if (!expiredTaskIds.has(taskId)) continue
      result.statusEntriesPruned += 1
      if (!dryRun) lastStatusByTask.delete(taskId)
    }

    if (!dryRun && Object.values(result).some((value) => typeof value === 'number' && value > 0)) {
      void persistBridgeState()
      logInfo('state_pruned', result)
    }

    return result
  }

  const statusRelay = relayFactory({
    config,
    resolveRouteForTask,
    shouldRelayTask,
    getLastStatus,
    setLastStatus,
    hasManagedTasks,
    getManagedTaskIds,
    onTerminalTask: async (task) => {
      const taskId = typeof task?.id === 'string' ? task.id : ''
      pruneTaskState(taskId)
    },
  })

  pruneExpiredState({ now: Date.now() })

  async function executeIngest(parsed, requestId) {
    registerChannelRoute(parsed.route, parsed.projectPath)
    registerProjectRoute(parsed.projectPath, parsed.route)

    logInfo('ingest_received', {
      requestId,
      commandType: parsed.commandType,
      messageId: parsed.messageId,
      routeKey: parsed.route.key,
      projectPath: parsed.projectPath || null,
      textPreview: createTextPreview(parsed.text),
    })

    if (parsed.commandType === 'directive') {
      const result = await forwardDirective(config, {
        text: parsed.text,
        platform: parsed.route.platform,
        accountId: parsed.route.accountId,
        channelId: parsed.route.channelId,
        threadId: parsed.route.threadId,
        connectorId: parsed.route.connectorId,
        senderId: parsed.senderId,
        senderName: parsed.senderName,
        projectPath: parsed.projectPath,
        providerProfileId: parsed.providerProfileId,
        compactPackKey: parsed.compactPackKey,
      })
      return {
        ok: true,
        commandType: parsed.commandType,
        compactPackKey: parsed.compactPackKey || config.defaultCompactPackKey,
        providerProfileId: parsed.providerProfileId || config.defaultProviderProfileId,
        ackText: result.ackText,
      }
    }

    const taskResult = await createTaskAndRun(config, {
      text: parsed.text,
      projectPath: parsed.projectPath,
      platform: parsed.route.platform,
      accountId: parsed.route.accountId,
      channelId: parsed.route.channelId,
      threadId: parsed.route.threadId,
      connectorId: parsed.route.connectorId,
      senderId: parsed.senderId,
      senderName: parsed.senderName,
      providerProfileId: parsed.providerProfileId,
      compactPackKey: parsed.compactPackKey,
    })
    registerTaskRoute(
      taskResult.taskId,
      parsed.route,
      taskResult.projectPath || parsed.projectPath,
      taskResult.title,
    )
    return {
      ok: true,
      commandType: parsed.commandType,
      taskId: taskResult.taskId,
      compactPackKey: parsed.compactPackKey || config.defaultCompactPackKey,
      providerProfileId: parsed.providerProfileId || config.defaultProviderProfileId,
      ackText: taskResult.ackText,
    }
  }

  async function executeIngestWithDedupe(parsed, requestId) {
    pruneRecentMessages()
    const dedupeKey = resolveDedupeKey(parsed)
    if (!dedupeKey) {
      return {
        ...(await executeIngest(parsed, requestId)),
        deduplicated: false,
      }
    }

    const cached = recentMessageMap.get(dedupeKey)
    if (cached?.response) {
      logInfo('ingest_deduplicated', {
        requestId,
        dedupeKey,
      })
      return {
        ...cached.response,
        deduplicated: true,
      }
    }
    if (cached?.promise) {
      const response = await cached.promise
      logInfo('ingest_deduplicated', {
        requestId,
        dedupeKey,
        source: 'in_flight',
      })
      return {
        ...response,
        deduplicated: true,
      }
    }

    const promise = executeIngest(parsed, requestId)
    recentMessageMap.set(dedupeKey, {
      startedAt: Date.now(),
      promise,
    })

    try {
      const response = await promise
      recentMessageMap.set(dedupeKey, {
        completedAt: Date.now(),
        response,
      })
      return {
        ...response,
        deduplicated: false,
      }
    } catch (err) {
      recentMessageMap.delete(dedupeKey)
      throw err
    }
  }

  const server = http.createServer(async (req, res) => {
    const requestId = createRequestId(req.headers['x-request-id'])
    const responseHeaders = { 'x-request-id': requestId }
    try {
      if (req.method === 'GET' && req.url === '/health') {
        const providerSummary = buildProviderSummary(config)
        const compactPacks = listCompactPacks(config)
        return json(res, 200, {
          ok: true,
          app: 'agentsswarm',
          mode: config.taskCommandMode,
          bridge_secret_configured: Boolean(config.bridgeSecret),
          allow_unsecured_bridge: config.allowUnsecuredBridge,
          compact_agent_limit: config.compactAgentLimit,
          enforce_compact_project_scope: config.enforceCompactProjectScope,
          status_relay_enabled: config.statusRelayEnabled,
          status_relay_managed_only: config.statusRelayManagedOnly,
          default_platform: config.defaultPlatform,
          default_account_id: config.defaultAccountId,
          default_compact_pack: config.defaultCompactPackKey,
          default_provider_profile: providerSummary.defaultProviderProfileId,
          provider_profiles: providerSummary.profiles.length,
          compact_packs: compactPacks.length,
          supported_platforms: config.supportedPlatforms,
          config_issues: config.configIssues,
        }, responseHeaders)
      }

      const requestUrl = new URL(req.url || '/', 'http://127.0.0.1')
      const pathname = requestUrl.pathname

      if (req.method === 'GET' && pathname === '/routes') {
        return json(res, 200, {
          ok: true,
          channelRoutes: Object.fromEntries(runtimeChannelRouteMap.entries()),
          projectRoutes: Object.fromEntries(runtimeProjectRouteMap.entries()),
          taskRoutes: Object.fromEntries(runtimeTaskRouteMap.entries()),
          managedTaskIds: Array.from(managedTaskSet.values()),
          lastStatusByTask: Object.fromEntries(lastStatusByTask.entries()),
        }, responseHeaders)
      }

      if (req.method === 'GET' && pathname === '/channels') {
        return json(res, 200, {
          ok: true,
          supportedPlatforms: listSupportedPlatforms(),
          configuredPlatforms: config.supportedPlatforms,
          defaultPlatform: config.defaultPlatform,
          defaultAccountId: config.defaultAccountId,
          channelRoutes: Object.fromEntries(runtimeChannelRouteMap.entries()),
          staticChannelRoutes: config.channelRouteMap,
        }, responseHeaders)
      }

      if (req.method === 'GET' && pathname === '/providers') {
        const providerSummary = buildProviderSummary(config)
        return json(res, 200, {
          ok: true,
          defaultProviderProfileId: providerSummary.defaultProviderProfileId,
          profiles: providerSummary.profiles,
          cliTools: providerSummary.cliTools,
          countsByTransport: providerSummary.countsByTransport,
          missingRequiredCliTools: providerSummary.missingRequiredCliTools,
          unavailableProfileIds: providerSummary.unavailableProfileIds,
          configIssues: config.configIssues,
        }, responseHeaders)
      }

      if (req.method === 'GET' && pathname === '/packs') {
        return json(res, 200, {
          ok: true,
          defaultCompactPackKey: config.defaultCompactPackKey,
          packs: listCompactPacks(config),
          configIssues: config.configIssues,
        }, responseHeaders)
      }

      if (req.method === 'GET' && pathname === '/summary') {
        const providerSummary = buildProviderSummary(config)
        const compactPacks = listCompactPacks(config)
        return json(res, 200, {
          ok: true,
          routes: {
            channels: runtimeChannelRouteMap.size,
            projects: runtimeProjectRouteMap.size,
            tasks: runtimeTaskRouteMap.size,
          },
          managedTasks: managedTaskSet.size,
          providers: {
            defaultProviderProfileId: providerSummary.defaultProviderProfileId,
            profiles: providerSummary.profiles.length,
            missingRequiredCliTools: providerSummary.missingRequiredCliTools,
            unavailableProfileIds: providerSummary.unavailableProfileIds,
          },
          compactPacks: {
            defaultCompactPackKey: config.defaultCompactPackKey,
            count: compactPacks.length,
          },
          channels: {
            defaultPlatform: config.defaultPlatform,
            defaultAccountId: config.defaultAccountId,
            supportedPlatforms: config.supportedPlatforms,
          },
          configIssues: config.configIssues,
        }, responseHeaders)
      }

      if (req.method === 'POST' && pathname === '/maintenance/prune') {
        if (!requireSecret(req)) {
          return json(res, 401, { error: 'unauthorized' }, responseHeaders)
        }
        const body = await readBody(req, { maxBytes: config.maxIngestBodyBytes })
        const result = pruneExpiredState({
          dryRun: body?.dryRun === true,
          now: Date.now(),
        })
        return json(res, 200, {
          ok: true,
          ...result,
          remaining: {
            channelRoutes: runtimeChannelRouteMap.size,
            projectRoutes: runtimeProjectRouteMap.size,
            taskRoutes: runtimeTaskRouteMap.size,
            managedTasks: managedTaskSet.size,
          },
        }, responseHeaders)
      }

      if (req.method === 'POST' && pathname === '/ingest') {
        if (!requireSecret(req)) {
          return json(res, 401, { error: 'unauthorized' }, responseHeaders)
        }

        const parsed = validateIngestBody(await readBody(req, { maxBytes: config.maxIngestBodyBytes }), config)
        const result = await executeIngestWithDedupe(parsed, requestId)
        return json(res, 200, {
          ...result,
          requestId,
        }, responseHeaders)
      }

      return json(res, 404, { error: 'not_found' }, responseHeaders)
    } catch (err) {
      const statusCode = Number.isInteger(err?.statusCode) ? err.statusCode : 500
      const message = err?.code || (err instanceof Error ? err.message : String(err))
      if (statusCode >= 500) {
        logError('request_failed', {
          requestId,
          method: req.method,
          url: req.url,
          error: message,
        })
      } else {
        logWarn('request_rejected', {
          requestId,
          method: req.method,
          url: req.url,
          error: message,
        })
      }
      return json(res, statusCode, { error: message, requestId }, responseHeaders)
    }
  })

  let listenHost = '127.0.0.1'

  async function start(options = {}) {
    if (server.listening) return server.address()
    listenHost = options.host || '127.0.0.1'
    await new Promise((resolve, reject) => {
      const onError = (err) => {
        server.off('listening', onListening)
        reject(err)
      }
      const onListening = () => {
        server.off('error', onError)
        resolve()
      }
      server.once('error', onError)
      server.once('listening', onListening)
      server.listen(options.port ?? config.port, listenHost)
    })
    statusRelay.start()
    logInfo('bridge_started', {
      url: getListenUrl(),
      mode: config.taskCommandMode,
      configIssues: config.configIssues,
    })
    return server.address()
  }

  async function stop() {
    statusRelay.stop()
    await flushBridgeState()
    if (!server.listening) return
    await new Promise((resolve) => {
      server.close(() => resolve())
    })
  }

  function getListenUrl() {
    const address = server.address()
    const port = typeof address === 'object' && address ? address.port : config.port
    return `http://${listenHost}:${port}`
  }

  return {
    config,
    server,
    statusRelay,
    start,
    stop,
    getListenUrl,
    getStateSnapshot: snapshotState,
    pruneExpiredState,
  }
}

function isDirectExecution() {
  const entry = process.argv[1]
  return !!entry && import.meta.url === pathToFileURL(entry).href
}

async function main() {
  const bridge = createBridgeServer()
  await bridge.start()
  console.log(`[agentsswarm] bridge listening on ${bridge.getListenUrl()}`)

  let shuttingDown = false
  const shutdown = () => {
    if (shuttingDown) return
    shuttingDown = true
    void bridge.stop().finally(() => process.exit(0))
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

if (isDirectExecution()) {
  main().catch((err) => {
    const message = err instanceof Error ? err.message : String(err)
    process.stderr.write(`[agentsswarm] bridge failed: ${message}\n`)
    process.exit(1)
  })
}
