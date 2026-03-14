const DEFAULT_PACKS = [
  {
    key: "software-6",
    label: "Software Delivery 6",
    description: "Compact hybrid software crew for build, review, and deployment loops.",
    defaultProviderProfileId: "codex-main",
    maxAgents: 6,
    roles: [
      { key: "orchestrator", label: "Orchestrator", providerProfileId: "codex-main" },
      { key: "lead", label: "Implementation Lead", providerProfileId: "claude-cli" },
      { key: "builder", label: "Implementation Worker", providerProfileId: "codex-main" },
      { key: "reviewer", label: "Reviewer", providerProfileId: "copilot-review" },
      { key: "ops", label: "Ops and Integrations", providerProfileId: "gemini-cli" },
      { key: "support", label: "Research and Support", providerProfileId: "opencode-cli" },
    ],
  },
  {
    key: "ops-5",
    label: "Ops 5",
    description: "Compact operations crew for incidents, infra, and automation wiring.",
    defaultProviderProfileId: "gemini-cli",
    maxAgents: 5,
    roles: [
      { key: "orchestrator", label: "Ops Lead", providerProfileId: "claude-cli" },
      { key: "integrations", label: "Integrations", providerProfileId: "opencode-cli" },
      { key: "automation", label: "Automation", providerProfileId: "codex-main" },
      { key: "reviewer", label: "Reviewer", providerProfileId: "copilot-review" },
      { key: "research", label: "Research", providerProfileId: "gemini-cli" },
    ],
  },
  {
    key: "research-5",
    label: "Research 5",
    description: "Compact analysis crew for research, synthesis, and decision support.",
    defaultProviderProfileId: "gemini-cli",
    maxAgents: 5,
    roles: [
      { key: "orchestrator", label: "Research Lead", providerProfileId: "claude-cli" },
      { key: "analyst", label: "Analyst", providerProfileId: "gemini-cli" },
      { key: "writer", label: "Writer", providerProfileId: "codex-main" },
      { key: "reviewer", label: "Reviewer", providerProfileId: "copilot-review" },
      { key: "publisher", label: "Publisher", providerProfileId: "opencode-cli" },
    ],
  },
  {
    key: "support-5",
    label: "Support 5",
    description: "Compact customer and channel support crew for triage and follow-through.",
    defaultProviderProfileId: "opencode-cli",
    maxAgents: 5,
    roles: [
      { key: "orchestrator", label: "Support Lead", providerProfileId: "claude-cli" },
      { key: "triage", label: "Triage", providerProfileId: "opencode-cli" },
      { key: "resolver", label: "Resolver", providerProfileId: "codex-main" },
      { key: "reviewer", label: "QA", providerProfileId: "copilot-review" },
      { key: "knowledge", label: "Knowledge Base", providerProfileId: "gemini-cli" },
    ],
  },
]

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : ""
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

function normalizeRole(raw, index = 0) {
  if (!isPlainObject(raw)) return null
  const key = normalizeText(raw.key) || `role-${index + 1}`
  return {
    key,
    label: normalizeText(raw.label) || key,
    providerProfileId: normalizeText(raw.providerProfileId),
  }
}

function normalizePack(raw, index = 0) {
  if (!isPlainObject(raw)) return null
  const key = normalizeText(raw.key) || `pack-${index + 1}`
  const roles = Array.isArray(raw.roles)
    ? raw.roles.map((role, roleIndex) => normalizeRole(role, roleIndex)).filter(Boolean).slice(0, 8)
    : []
  const maxAgents = Math.min(Math.max(Number(raw.maxAgents || roles.length || 1), 1), 8)
  return {
    key,
    label: normalizeText(raw.label) || key,
    description: normalizeText(raw.description),
    defaultProviderProfileId: normalizeText(raw.defaultProviderProfileId),
    maxAgents,
    roles: roles.slice(0, maxAgents),
  }
}

function parsePackOverrides(raw) {
  const parsed = parseJson(raw)
  if (!parsed) return []
  if (Array.isArray(parsed)) {
    return parsed.map((pack, index) => normalizePack(pack, index)).filter(Boolean)
  }
  if (!isPlainObject(parsed)) return []
  return Object.entries(parsed).map(([key, pack], index) => normalizePack({ key, ...pack }, index)).filter(Boolean)
}

export function listCompactPacks(config = {}) {
  const overrides = parsePackOverrides(config.compactPacksRaw)
  const packs = overrides.length > 0 ? overrides : DEFAULT_PACKS
  return packs
    .map((pack, index) => normalizePack(pack, index))
    .filter(Boolean)
}

export function resolveCompactPack(config = {}, requestedKey) {
  const packs = listCompactPacks(config)
  const preferred = normalizeText(requestedKey) || normalizeText(config.defaultCompactPackKey)
  if (preferred) {
    const pack = packs.find((entry) => entry.key === preferred)
    if (pack) return pack
  }
  return packs[0] || null
}
