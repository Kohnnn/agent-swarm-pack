import { spawnSync } from "node:child_process"

const DEFAULT_REQUIRED_TOOL_IDS = ["openclaw", "codex"]
const COMMAND_CACHE_TTL_MS = 60 * 1000
const MODEL_DISCOVERY_CACHE_TTL_MS = 2 * 60 * 1000

const CLI_TOOL_CATALOG = {
  openclaw: {
    id: "openclaw",
    label: "OpenClaw CLI",
    command: "openclaw",
    installCommand: "npm install -g openclaw@latest",
  },
  claude: {
    id: "claude",
    label: "Claude Code",
    command: "claude",
    installCommand: "npm install -g @anthropic-ai/claude-code",
  },
  codex: {
    id: "codex",
    label: "Codex CLI",
    command: "codex",
    installCommand: "npm install -g @openai/codex",
  },
  gemini: {
    id: "gemini",
    label: "Gemini CLI",
    command: "gemini",
    installCommand: "npm install -g @google/gemini-cli",
  },
  opencode: {
    id: "opencode",
    label: "OpenCode CLI",
    command: "opencode",
    installCommand: "npm install -g opencode",
  },
}

const DEFAULT_PROVIDER_PROFILES = [
  {
    id: "codex-main",
    label: "GitHub Codex Main",
    provider: "copilot",
    transport: "oauth",
    commandId: "codex",
    model: "openai-codex/gpt-5.3-codex",
    accountLabel: "github-main",
    capabilities: ["coding", "orchestration"],
    priority: 100,
  },
  {
    id: "copilot-review",
    label: "GitHub Copilot Review",
    provider: "copilot",
    transport: "oauth",
    commandId: "codex",
    model: "github-copilot/claude-sonnet-4.6",
    accountLabel: "github-review",
    capabilities: ["review", "qa"],
    priority: 95,
  },
  {
    id: "claude-cli",
    label: "Claude CLI",
    provider: "claude",
    transport: "cli",
    commandId: "claude",
    model: "anthropic/claude-opus-4-6",
    accountLabel: "local-claude",
    capabilities: ["orchestration", "review"],
    priority: 90,
  },
  {
    id: "gemini-cli",
    label: "Gemini CLI",
    provider: "gemini",
    transport: "cli",
    commandId: "gemini",
    model: "google/gemini-2.5-pro",
    accountLabel: "local-gemini",
    capabilities: ["research", "ops"],
    priority: 80,
  },
  {
    id: "opencode-cli",
    label: "OpenCode CLI",
    provider: "opencode",
    transport: "cli",
    commandId: "opencode",
    model: "github-copilot/claude-sonnet-4.6",
    accountLabel: "local-opencode",
    capabilities: ["coding", "support"],
    priority: 75,
  },
  {
    id: "openrouter-fallback",
    label: "OpenRouter Fallback",
    provider: "openrouter",
    transport: "api",
    commandId: "",
    model: "openrouter/anthropic/claude-sonnet-4-5",
    accountLabel: "fallback",
    capabilities: ["fallback"],
    priority: 50,
  },
]

const MODEL_CATALOG_BY_PROVIDER = {
  copilot: [
    "openai-codex/gpt-5.3-codex",
    "github-copilot/claude-sonnet-4.6",
    "github-copilot/gpt-4o",
  ],
  claude: [
    "anthropic/claude-opus-4-6",
    "anthropic/claude-sonnet-4.6",
  ],
  gemini: [
    "google/gemini-2.5-pro",
    "google/gemini-2.5-flash",
  ],
  opencode: [
    "github-copilot/claude-sonnet-4.6",
    "openai/gpt-4.1",
  ],
  openrouter: [
    "openrouter/anthropic/claude-sonnet-4-5",
    "openrouter/openai/gpt-4.1",
  ],
}

const commandAvailabilityCache = new Map()
const modelDiscoveryCache = new Map()

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return []
  return Array.from(
    new Set(
      value
        .map((entry) => normalizeText(entry))
        .filter(Boolean),
    ),
  )
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function parseJson(raw) {
  const source = normalizeText(raw)
  if (!source) return null
  try {
    return JSON.parse(source)
  } catch {
    return null
  }
}

function normalizeTransport(value) {
  const transport = normalizeText(value).toLowerCase()
  if (["cli", "oauth", "api"].includes(transport)) return transport
  return "cli"
}

function normalizeProviderProfile(raw, index = 0) {
  if (!isPlainObject(raw)) return null
  const id = normalizeText(raw.id) || `profile-${index + 1}`
  const provider = normalizeText(raw.provider || raw.id || "custom").toLowerCase()
  const commandId = normalizeText(raw.commandId || raw.command || provider)
  const model = normalizeText(raw.model)
  const models = normalizeStringArray(raw.models)
  const mergedModels = Array.from(new Set([model, ...models].filter(Boolean)))
  return {
    id,
    label: normalizeText(raw.label) || id,
    provider,
    transport: normalizeTransport(raw.transport),
    commandId,
    model,
    models: mergedModels,
    accountLabel: normalizeText(raw.accountLabel),
    capabilities: normalizeStringArray(raw.capabilities),
    priority: Number.isFinite(Number(raw.priority)) ? Number(raw.priority) : 0,
  }
}

function mergeModelCatalog(profile) {
  if (!profile) return []
  const providerCatalog = MODEL_CATALOG_BY_PROVIDER[profile.provider] || []
  return Array.from(new Set([profile.model, ...(profile.models || []), ...providerCatalog].filter(Boolean)))
}

function normalizeModelOverrides(value) {
  if (!isPlainObject(value)) return {}
  const normalized = {}
  for (const [profileId, model] of Object.entries(value)) {
    const key = normalizeText(profileId)
    const modelName = normalizeText(model)
    if (!key || !modelName) continue
    normalized[key] = modelName
  }
  return normalized
}

function normalizeBoolean(value) {
  return value === true
}

function normalizeDiscoveredModelEntry(raw) {
  if (typeof raw === "string") {
    const id = normalizeText(raw)
    if (!id) return null
    return {
      id,
      label: id,
      reasoning: false,
      source: "cli_discovery",
    }
  }

  if (!isPlainObject(raw)) return null
  const id = normalizeText(raw.id || raw.model || raw.name)
  if (!id) return null
  const label = normalizeText(raw.label || raw.display || raw.displayName) || id
  return {
    id,
    label,
    reasoning: normalizeBoolean(raw.reasoning) || normalizeBoolean(raw.reasoning_capable) || normalizeBoolean(raw.thinking),
    source: "cli_discovery",
  }
}

function parseDiscoveredModelsOutput(stdout = "") {
  const text = normalizeText(stdout)
  if (!text) return []
  const parsed = parseJson(text)
  if (Array.isArray(parsed)) {
    return parsed.map((entry) => normalizeDiscoveredModelEntry(entry)).filter(Boolean)
  }
  if (isPlainObject(parsed)) {
    const nested = Array.isArray(parsed.models)
      ? parsed.models
      : Array.isArray(parsed.data)
        ? parsed.data
        : []
    if (nested.length > 0) {
      return nested.map((entry) => normalizeDiscoveredModelEntry(entry)).filter(Boolean)
    }
  }
  return text
    .split(/\r?\n/)
    .map((line) => normalizeText(line))
    .filter((line) => line && !line.startsWith("[") && !line.startsWith("{"))
    .map((line) => normalizeDiscoveredModelEntry(line))
    .filter(Boolean)
}

function staticModelDetailsForProfile(profile, options = {}) {
  const modelOverrides = normalizeModelOverrides(options.modelOverridesByProvider)
  const selectedModel = modelOverrides[profile.id] || profile.model || ""
  const ids = Array.from(new Set([selectedModel, ...mergeModelCatalog(profile)].filter(Boolean)))
  return ids.map((id) => ({
    id,
    label: id,
    reasoning: false,
    source: "static_catalog",
  }))
}

function runOpenCodeCommand(commandId, args, options = {}) {
  const runner = options.runner || spawnSync
  const tool = CLI_TOOL_CATALOG[commandId]
  const command = tool?.command || commandId || "opencode"
  const result = runner(command, args, {
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
    timeout: Number.isFinite(Number(options.timeoutMs)) ? Number(options.timeoutMs) : 8_000,
    cwd: options.cwd,
    env: options.env,
    encoding: "utf8",
  })
  return {
    command,
    args,
    status: Number.isFinite(Number(result?.status)) ? Number(result.status) : 1,
    stdout: normalizeText(result?.stdout),
    stderr: normalizeText(result?.stderr),
  }
}

export function runOpenCodeModelDiscovery(commandId, options = {}) {
  const attempts = [
    ["models", "--json"],
    ["models", "list", "--json"],
    ["models"],
  ]

  for (const args of attempts) {
    const result = runOpenCodeCommand(commandId, args, options)
    if (result.status !== 0 && !result.stdout) continue
    const models = parseDiscoveredModelsOutput(result.stdout)
    if (models.length > 0) {
      const configResult = runOpenCodeCommand(commandId, ["config", "--json"], options)
      return {
        ok: true,
        command: result.command,
        args: result.args,
        models,
        stderr: result.stderr,
        config: parseJson(configResult.stdout) || null,
      }
    }
  }

  return {
    ok: false,
    command: CLI_TOOL_CATALOG[commandId]?.command || commandId || "opencode",
    args: ["models", "--json"],
    models: [],
    stderr: "",
    config: null,
  }
}

function buildDiscoveryCacheKey(profile, options = {}) {
  const cwd = normalizeText(options.cwd || process.cwd())
  return `${profile.id}:${profile.provider}:${profile.commandId}:${cwd}`
}

function applyProviderModelOverride(profile, options = {}) {
  if (!profile) return null
  const modelOverrides = normalizeModelOverrides(options.modelOverridesByProvider)
  const overrideModel = modelOverrides[profile.id] || ""
  const catalog = mergeModelCatalog(profile)
  const resolvedModel = overrideModel || profile.model || catalog[0] || ""
  const models = Array.from(new Set([resolvedModel, ...catalog].filter(Boolean)))
  return {
    ...profile,
    model: resolvedModel,
    models,
  }
}

function parseProviderProfiles(raw) {
  const parsed = parseJson(raw)
  if (!parsed) return []
  if (Array.isArray(parsed)) {
    return parsed
      .map((profile, index) => normalizeProviderProfile(profile, index))
      .filter(Boolean)
  }
  if (!isPlainObject(parsed)) return []
  return Object.entries(parsed)
    .map(([id, profile], index) => normalizeProviderProfile({ id, ...profile }, index))
    .filter(Boolean)
}

function inferOptionalCliToolIds(profiles) {
  const toolIds = []
  for (const profile of profiles) {
    if (!["cli", "oauth"].includes(profile.transport)) continue
    const commandId = normalizeText(profile.commandId).toLowerCase()
    if (commandId && CLI_TOOL_CATALOG[commandId]) toolIds.push(commandId)
  }
  return Array.from(new Set(toolIds))
}

function capabilityScore(profile, capabilityHints = []) {
  if (!Array.isArray(capabilityHints) || capabilityHints.length <= 0) return 0
  let score = 0
  for (const hint of capabilityHints) {
    if (profile.capabilities.includes(hint)) score += 1
  }
  return score
}

function resolveProfileAvailability(profile, options = {}) {
  if (!profile) {
    return {
      available: false,
      reason: "profile_missing",
      requiredCommandId: "",
    }
  }

  if (profile.transport === "api") {
    return {
      available: true,
      reason: "api_transport",
      requiredCommandId: "",
    }
  }

  const commandId = normalizeText(profile.commandId).toLowerCase()
  if (!commandId) {
    return {
      available: false,
      reason: "command_missing",
      requiredCommandId: "",
    }
  }

  const tool = CLI_TOOL_CATALOG[commandId]
  const command = tool?.command || commandId
  const installed = checkCommandAvailability(command, options)
  return {
    available: installed,
    reason: installed ? "command_available" : `command_missing:${command}`,
    requiredCommandId: commandId,
  }
}

function attachAvailability(profile, options = {}) {
  if (!profile) return null
  const withModel = applyProviderModelOverride(profile, options)
  const availability = resolveProfileAvailability(withModel, options)
  return {
    ...withModel,
    available: availability.available,
    availabilityReason: availability.reason,
    requiredCommandId: availability.requiredCommandId,
    failoverRank: Number.isFinite(Number(options.failoverRank)) ? Number(options.failoverRank) : -1,
  }
}

function uniqueIds(values) {
  return Array.from(new Set(values.map((entry) => normalizeText(entry)).filter(Boolean)))
}

function rankProfiles(profiles, capabilityHints = []) {
  return [...profiles].sort((a, b) => {
    const scoreDiff = capabilityScore(b, capabilityHints) - capabilityScore(a, capabilityHints)
    if (scoreDiff !== 0) return scoreDiff
    return b.priority - a.priority || a.id.localeCompare(b.id)
  })
}

export function buildFailoverChain(config = {}, requestedId, options = {}) {
  const profiles = loadProviderProfiles(config)
  const lookup = new Map(profiles.map((profile) => [profile.id, profile]))
  const capabilityHints = normalizeStringArray(options.capabilityHints)
  const explicitFallbacks = uniqueIds([
    ...(Array.isArray(options.fallbackProviderProfileIds) ? options.fallbackProviderProfileIds : []),
    options.fallbackProviderProfileId,
  ])

  const preferred = uniqueIds([
    requestedId,
    ...explicitFallbacks,
    config.defaultProviderProfileId,
  ])

  const seeded = preferred
    .map((id) => lookup.get(id))
    .filter(Boolean)

  const ranked = rankProfiles(
    profiles.filter((profile) => !preferred.includes(profile.id)),
    capabilityHints,
  )

  const ordered = [...seeded, ...ranked]
  const attached = ordered
    .map((profile) => attachAvailability(profile, options))
    .filter(Boolean)

  const available = attached.filter((profile) => profile.available !== false)
  const chain = available.length > 0 ? available : attached.slice(0, 1)
  return chain.map((profile, index) => ({
    ...profile,
    failoverRank: index,
  }))
}

export function resolveFailoverProfile(chain = [], failedProfileId, options = {}) {
  const failedId = normalizeText(failedProfileId)
  const retryableStatuses = Array.isArray(options.retryableStatuses)
    ? new Set(options.retryableStatuses.map((entry) => Number(entry)))
    : null
  if (retryableStatuses && Number.isFinite(Number(options.status)) && !retryableStatuses.has(Number(options.status))) {
    return null
  }

  const ordered = Array.isArray(chain) ? chain : []
  if (ordered.length <= 0) return null

  const currentIndex = failedId ? ordered.findIndex((profile) => profile?.id === failedId) : -1
  const nextProfiles = ordered.slice(currentIndex + 1)
  return nextProfiles.find((profile) => profile && profile.available !== false) || null
}

export function loadProviderProfiles(config = {}) {
  const customProfiles = parseProviderProfiles(config.providerProfilesRaw)
  const source = customProfiles.length > 0 ? customProfiles : DEFAULT_PROVIDER_PROFILES
  return source
    .map((profile, index) => normalizeProviderProfile(profile, index))
    .filter(Boolean)
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))
}

export function listCliToolCatalog() {
  return Object.values(CLI_TOOL_CATALOG)
}

export function getRequiredCliToolIds(config = {}) {
  const configured = Array.isArray(config.requiredCliToolIds) && config.requiredCliToolIds.length > 0
    ? config.requiredCliToolIds
    : DEFAULT_REQUIRED_TOOL_IDS
  return Array.from(new Set(configured.map((entry) => normalizeText(entry).toLowerCase()).filter(Boolean)))
}

export function checkCommandAvailability(command, options = {}) {
  const runner = options.runner || spawnSync
  const normalizedCommand = normalizeText(command)
  if (!normalizedCommand) return false
  if (!options.runner && options.cache !== false) {
    const cached = commandAvailabilityCache.get(normalizedCommand)
    if (cached && Date.now() - cached.checkedAt < COMMAND_CACHE_TTL_MS) {
      return cached.installed
    }
  }
  const locator = process.platform === "win32" ? "where" : "which"
  const result = runner(locator, [normalizedCommand], {
    stdio: "ignore",
    shell: false,
  })
  const installed = result?.status === 0
  if (!options.runner && options.cache !== false) {
    commandAvailabilityCache.set(normalizedCommand, {
      installed,
      checkedAt: Date.now(),
    })
  }
  return installed
}

export function isProviderProfileAvailable(profile, options = {}) {
  return resolveProfileAvailability(profile, options).available
}

export function resolveProviderProfile(config = {}, requestedId, fallbackId, options = {}) {
  const profiles = loadProviderProfiles(config)
  const lookup = new Map(profiles.map((profile) => [profile.id, profile]))
  const preferredIds = [
    normalizeText(requestedId),
    normalizeText(fallbackId),
    normalizeText(config.defaultProviderProfileId),
  ].filter(Boolean)

  const preferAvailable = options.preferAvailable === true
  const capabilityHints = normalizeStringArray(options.capabilityHints)

  if (!preferAvailable) {
    for (const id of preferredIds) {
      if (lookup.has(id)) return attachAvailability(lookup.get(id), options)
    }
    return attachAvailability(profiles[0], options)
  }

  for (const id of preferredIds) {
    const profile = lookup.get(id)
    if (profile && isProviderProfileAvailable(profile, options)) {
      return attachAvailability(profile, options)
    }
  }

  const ranked = [...profiles].sort((a, b) => {
    const scoreDiff = capabilityScore(b, capabilityHints) - capabilityScore(a, capabilityHints)
    if (scoreDiff !== 0) return scoreDiff
    return b.priority - a.priority || a.id.localeCompare(b.id)
  })

  const fallback = ranked.find((profile) => isProviderProfileAvailable(profile, options))
  if (fallback) return attachAvailability(fallback, options)

  for (const id of preferredIds) {
    if (lookup.has(id)) return attachAvailability(lookup.get(id), options)
  }

  return attachAvailability(ranked[0], options)
}

export function buildProviderSummary(config = {}, options = {}) {
  const profiles = loadProviderProfiles(config)
  const requiredIds = new Set(getRequiredCliToolIds(config))
  const optionalIds = inferOptionalCliToolIds(profiles)
  const allIds = Array.from(new Set([...requiredIds, ...optionalIds]))

  const cliTools = allIds
    .map((id) => CLI_TOOL_CATALOG[id])
    .filter(Boolean)
    .map((tool) => ({
      ...tool,
      required: requiredIds.has(tool.id),
      installed: checkCommandAvailability(tool.command, options),
      profiles: profiles.filter((profile) => normalizeText(profile.commandId).toLowerCase() === tool.id).map((profile) => profile.id),
    }))

  const failoverChain = buildFailoverChain(config, options.requestedProfileId || config.defaultProviderProfileId, {
    ...options,
    fallbackProviderProfileIds: options.fallbackProviderProfileIds,
    fallbackProviderProfileId: options.fallbackProviderProfileId,
  })
  const failoverRankById = Object.fromEntries(failoverChain.map((profile) => [profile.id, profile.failoverRank]))

  const profileSummaries = profiles.map((profile) => {
    return attachAvailability(profile, {
      ...options,
      failoverRank: Object.prototype.hasOwnProperty.call(failoverRankById, profile.id) ? failoverRankById[profile.id] : -1,
    })
  })

  const missingRequiredCliTools = cliTools.filter((tool) => tool.required && !tool.installed).map((tool) => tool.id)
  const unavailableProfileIds = profileSummaries.filter((profile) => !profile.available).map((profile) => profile.id)
  const countsByTransport = {}
  for (const profile of profiles) {
    countsByTransport[profile.transport] = (countsByTransport[profile.transport] || 0) + 1
  }

  return {
    profiles: profileSummaries,
    cliTools,
    countsByTransport,
    defaultProviderProfileId: resolveProviderProfile(config, undefined, undefined, options)?.id || "",
    missingRequiredCliTools,
    unavailableProfileIds,
    failoverChain,
  }
}

export function listProviderModels(config = {}, profileId, options = {}) {
  const profile = loadProviderProfiles(config).find((entry) => entry.id === normalizeText(profileId))
  if (!profile) return []
  const discoveredByProfile = isPlainObject(options.discoveredModelsByProfile)
    ? options.discoveredModelsByProfile
    : {}
  const discoveredEntries = Array.isArray(discoveredByProfile[profile.id])
    ? discoveredByProfile[profile.id]
    : []
  const discoveredIds = discoveredEntries
    .map((entry) => (typeof entry === "string" ? normalizeText(entry) : normalizeText(entry?.id || entry?.model)))
    .filter(Boolean)
  const defaults = applyProviderModelOverride(profile, options)?.models || []
  return Array.from(new Set([...discoveredIds, ...defaults].filter(Boolean)))
}

export function discoverProviderModels(config = {}, profileId, options = {}) {
  const profile = loadProviderProfiles(config).find((entry) => entry.id === normalizeText(profileId))
  if (!profile) return null

  const staticModels = staticModelDetailsForProfile(profile, options)
  const cacheKey = buildDiscoveryCacheKey(profile, options)
  const now = Date.now()
  const cached = modelDiscoveryCache.get(cacheKey)
  const force = options.force === true
  if (!force && cached && now - cached.fetchedAt < MODEL_DISCOVERY_CACHE_TTL_MS) {
    return {
      ...cached,
      cached: true,
    }
  }

  if (profile.provider !== "opencode") {
    const result = {
      profileId: profile.id,
      provider: profile.provider,
      source: "static",
      cached: false,
      fetchedAt: now,
      models: staticModels,
      selectedModel: staticModels[0]?.id || "",
      diagnostics: {
        reason: "provider_static_only",
      },
    }
    modelDiscoveryCache.set(cacheKey, result)
    return result
  }

  const availability = resolveProfileAvailability(profile, options)
  if (!availability.available) {
    const result = {
      profileId: profile.id,
      provider: profile.provider,
      source: "static",
      cached: false,
      fetchedAt: now,
      models: staticModels,
      selectedModel: staticModels[0]?.id || "",
      diagnostics: {
        reason: availability.reason,
      },
    }
    modelDiscoveryCache.set(cacheKey, result)
    return result
  }

  const discovered = runOpenCodeModelDiscovery(profile.commandId, options)
  const discoveredModels = discovered.models
  const merged = Array.from(
    new Map(
      [...discoveredModels, ...staticModels]
        .map((entry) => normalizeDiscoveredModelEntry(entry))
        .filter(Boolean)
        .map((entry) => [entry.id, entry]),
    ).values(),
  )

  const result = {
    profileId: profile.id,
    provider: profile.provider,
    source: discovered.ok ? "cli_discovery" : "static",
    cached: false,
    fetchedAt: now,
    models: merged,
    selectedModel: merged[0]?.id || "",
    diagnostics: {
      reason: discovered.ok ? "cli_discovered" : "discovery_failed",
      command: discovered.command,
      args: discovered.args,
      stderr: discovered.stderr,
      config: discovered.config,
    },
  }
  modelDiscoveryCache.set(cacheKey, result)
  return result
}

export function getOpenCodeStatus(config = {}, options = {}) {
  const profile = loadProviderProfiles(config).find((entry) => entry.provider === "opencode" || entry.id === "opencode-cli")
  const commandId = profile?.commandId || "opencode"
  const availability = profile ? resolveProfileAvailability(profile, options) : {
    available: false,
    reason: "profile_missing",
  }

  const versionResult = runOpenCodeCommand(commandId, ["--version"], options)
  const statusResult = runOpenCodeCommand(commandId, ["status", "--json"], options)
  const configResult = runOpenCodeCommand(commandId, ["config", "--json"], options)
  const models = discoverProviderModels(config, profile?.id || "opencode-cli", options)

  return {
    profileId: profile?.id || "opencode-cli",
    available: availability.available === true,
    availabilityReason: availability.reason,
    version: versionResult.stdout || versionResult.stderr || "",
    session: parseJson(statusResult.stdout) || {
      raw: statusResult.stdout,
      statusCode: statusResult.status,
    },
    config: parseJson(configResult.stdout) || null,
    models: models?.models || [],
    diagnostics: {
      statusCommand: {
        command: statusResult.command,
        args: statusResult.args,
        status: statusResult.status,
        stderr: statusResult.stderr,
      },
      versionCommand: {
        command: versionResult.command,
        args: versionResult.args,
        status: versionResult.status,
        stderr: versionResult.stderr,
      },
    },
  }
}
