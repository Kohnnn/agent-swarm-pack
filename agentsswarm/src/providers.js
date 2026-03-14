import { spawnSync } from "node:child_process"

const DEFAULT_REQUIRED_TOOL_IDS = ["openclaw", "codex"]
const COMMAND_CACHE_TTL_MS = 60 * 1000

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

const commandAvailabilityCache = new Map()

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
  return {
    id,
    label: normalizeText(raw.label) || id,
    provider,
    transport: normalizeTransport(raw.transport),
    commandId,
    model: normalizeText(raw.model),
    accountLabel: normalizeText(raw.accountLabel),
    capabilities: normalizeStringArray(raw.capabilities),
    priority: Number.isFinite(Number(raw.priority)) ? Number(raw.priority) : 0,
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
  const availability = resolveProfileAvailability(profile, options)
  return {
    ...profile,
    available: availability.available,
    availabilityReason: availability.reason,
    requiredCommandId: availability.requiredCommandId,
  }
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

  const profileSummaries = profiles.map((profile) => {
    return attachAvailability(profile, options)
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
  }
}
