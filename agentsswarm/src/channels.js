const SUPPORTED_PLATFORMS = ["telegram", "discord", "whatsapp", "slack", "cli"]

export const platformConfigSchema = {
  discord: {
    required: ["token", "guildId", "channelId"],
  },
  telegram: {
    required: ["botToken", "chatId"],
  },
  whatsapp: {
    required: ["phoneNumberId", "accessToken", "webhookVerifyToken"],
  },
  slack: {
    required: ["botToken", "channelId"],
  },
  cli: {
    required: ["projectPath"],
  },
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : ""
}

export function normalizePlatform(value, fallback = "telegram") {
  const candidate = normalizeText(value).toLowerCase()
  if (SUPPORTED_PLATFORMS.includes(candidate)) return candidate
  const normalizedFallback = normalizeText(fallback).toLowerCase()
  return SUPPORTED_PLATFORMS.includes(normalizedFallback) ? normalizedFallback : "telegram"
}

export function normalizeAccountId(value, fallback = "primary") {
  return normalizeText(value) || normalizeText(fallback) || "primary"
}

export function toChannelRouteKey(route = {}, defaults = {}) {
  const platform = normalizePlatform(route.platform, defaults.platform || defaults.defaultPlatform)
  const accountId = normalizeAccountId(route.accountId, defaults.accountId || defaults.defaultAccountId)
  const channelId = normalizeText(route.channelId)
  const threadId = normalizeText(route.threadId)
  return [platform, accountId, channelId || "-", threadId || "-"].join("|")
}

export function formatChannelLabel(route = {}, defaults = {}) {
  const platform = normalizePlatform(route.platform, defaults.platform || defaults.defaultPlatform)
  const accountId = normalizeAccountId(route.accountId, defaults.accountId || defaults.defaultAccountId)
  const channelId = normalizeText(route.channelId) || "unknown-channel"
  const threadId = normalizeText(route.threadId)
  return threadId
    ? `${platform}/${accountId}/${channelId}#${threadId}`
    : `${platform}/${accountId}/${channelId}`
}

export function sanitizeRoute(route = {}, defaults = {}) {
  const connectorId = normalizeText(route.connectorId)
  const channelId = normalizeText(route.channelId)
  return {
    connectorId,
    channelId,
    platform: normalizePlatform(route.platform, defaults.platform || defaults.defaultPlatform),
    accountId: normalizeAccountId(route.accountId, defaults.accountId || defaults.defaultAccountId),
    threadId: normalizeText(route.threadId),
    updatedAt: Number.isFinite(Number(route.updatedAt)) ? Number(route.updatedAt) : undefined,
    projectPath: normalizeText(route.projectPath),
    title: normalizeText(route.title),
    createdAt: Number.isFinite(Number(route.createdAt)) ? Number(route.createdAt) : undefined,
  }
}

export function normalizeChannelEnvelope(payload = {}, defaults = {}) {
  const route = sanitizeRoute(payload, defaults)
  return {
    ...route,
    senderId: normalizeText(payload.senderId),
    senderName: normalizeText(payload.senderName),
    projectPath: normalizeText(payload.projectPath) || route.projectPath,
    key: toChannelRouteKey(route, defaults),
    label: formatChannelLabel(route, defaults),
  }
}

export function normalizeChannelRouteMap(raw, defaults = {}) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
  const out = {}
  for (const [key, value] of Object.entries(raw)) {
    const route = sanitizeRoute(value, defaults)
    if (!route.connectorId || !route.channelId) continue
    out[key] = route
  }
  return out
}

export function buildConnectorMessagePayload(route, text) {
  const payload = {
    channelId: normalizeText(route?.channelId),
    text: String(text || ""),
  }
  const threadId = normalizeText(route?.threadId)
  const accountId = normalizeText(route?.accountId)
  const platform = normalizeText(route?.platform)
  if (threadId) payload.threadId = threadId
  if (accountId) payload.accountId = accountId
  if (platform) payload.platform = platform
  return payload
}

export function validatePlatformConfig(platform, config = {}) {
  const normalizedPlatform = normalizePlatform(platform)
  const schema = platformConfigSchema[normalizedPlatform] || { required: [] }
  const missingFields = schema.required.filter((field) => !normalizeText(config[field]))
  return {
    platform: normalizedPlatform,
    valid: missingFields.length === 0,
    missingFields,
  }
}

function firstNonEmpty(values) {
  for (const value of values) {
    const normalized = normalizeText(value)
    if (normalized) return normalized
  }
  return ""
}

export function inferConnectorPlatform(row) {
  const config = row && typeof row === "object" && !Array.isArray(row) ? row.config : null
  const source = firstNonEmpty([
    row?.platform,
    row?.channel,
    row?.channelType,
    row?.type,
    row?.name,
    config?.platform,
    config?.channel,
    config?.channelType,
    config?.messenger,
  ]).toLowerCase()
  for (const platform of SUPPORTED_PLATFORMS) {
    if (source.includes(platform)) return platform
  }
  return "unknown"
}

export function summarizeConnectorInventory(connectors) {
  const entries = connectors && typeof connectors === "object" && !Array.isArray(connectors)
    ? Object.entries(connectors)
    : []

  const platforms = {}
  let bridgeWired = 0
  for (const [, row] of entries) {
    const platform = inferConnectorPlatform(row)
    platforms[platform] = (platforms[platform] || 0) + 1
    const cfg = row && typeof row === "object" && !Array.isArray(row) ? row.config : null
    if (cfg && typeof cfg.bridgeEndpoint === "string" && cfg.bridgeEndpoint.trim()) {
      bridgeWired += 1
    }
  }

  return {
    total: entries.length,
    bridgeWired,
    byPlatform: platforms,
  }
}

export function listSupportedPlatforms() {
  return [...SUPPORTED_PLATFORMS]
}
