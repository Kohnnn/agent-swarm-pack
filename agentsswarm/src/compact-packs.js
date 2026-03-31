const DEFAULT_PACKS = [
  {
    key: "software-6",
    label: "Software Delivery 6",
    description: "Compact hybrid software crew for build, review, and deployment loops.",
    defaultProviderProfileId: "codex-main",
    workMode: "solo",
    maxAgents: 6,
    roles: [
      { key: "orchestrator", label: "Orchestrator", providerProfileId: "codex-main", soul: "strategic planner", identity: "Keeps the full delivery sequence coherent." },
      { key: "lead", label: "Implementation Lead", providerProfileId: "claude-cli", soul: "sequencing lead", identity: "Translates goals into scoped implementation steps." },
      { key: "builder", label: "Implementation Worker", providerProfileId: "codex-main", soul: "hands-on implementer", identity: "Ships the concrete code changes." },
      { key: "reviewer", label: "Reviewer", providerProfileId: "copilot-review", soul: "quality gate", identity: "Checks behavior, regressions, and release safety." },
      { key: "ops", label: "Ops and Integrations", providerProfileId: "gemini-cli", soul: "systems operator", identity: "Handles runtime, deployment, and integration edges." },
      { key: "support", label: "Research and Support", providerProfileId: "opencode-cli", soul: "research wing", identity: "Fills knowledge gaps and supporting detail." },
    ],
  },
  {
    key: "ops-5",
    label: "Ops 5",
    description: "Compact operations crew for incidents, infra, and automation wiring.",
    defaultProviderProfileId: "gemini-cli",
    workMode: "solo",
    maxAgents: 5,
    roles: [
      { key: "orchestrator", label: "Ops Lead", providerProfileId: "claude-cli", soul: "incident coordinator" },
      { key: "integrations", label: "Integrations", providerProfileId: "opencode-cli", soul: "bridge builder" },
      { key: "automation", label: "Automation", providerProfileId: "codex-main", soul: "automation operator" },
      { key: "reviewer", label: "Reviewer", providerProfileId: "copilot-review", soul: "safety reviewer" },
      { key: "research", label: "Research", providerProfileId: "gemini-cli", soul: "evidence scout" },
    ],
  },
  {
    key: "research-5",
    label: "Research 5",
    description: "Compact analysis crew for research, synthesis, and decision support.",
    defaultProviderProfileId: "gemini-cli",
    workMode: "solo",
    maxAgents: 5,
    roles: [
      { key: "orchestrator", label: "Research Lead", providerProfileId: "claude-cli", soul: "synthesis lead" },
      { key: "analyst", label: "Analyst", providerProfileId: "gemini-cli", soul: "pattern finder" },
      { key: "writer", label: "Writer", providerProfileId: "codex-main", soul: "explainer" },
      { key: "reviewer", label: "Reviewer", providerProfileId: "copilot-review", soul: "fact checker" },
      { key: "publisher", label: "Publisher", providerProfileId: "opencode-cli", soul: "packager" },
    ],
  },
  {
    key: "support-5",
    label: "Support 5",
    description: "Compact customer and channel support crew for triage and follow-through.",
    defaultProviderProfileId: "opencode-cli",
    workMode: "solo",
    maxAgents: 5,
    roles: [
      { key: "orchestrator", label: "Support Lead", providerProfileId: "claude-cli", soul: "response coordinator" },
      { key: "triage", label: "Triage", providerProfileId: "opencode-cli", soul: "frontline triage" },
      { key: "resolver", label: "Resolver", providerProfileId: "codex-main", soul: "issue resolver" },
      { key: "reviewer", label: "QA", providerProfileId: "copilot-review", soul: "quality check" },
      { key: "knowledge", label: "Knowledge Base", providerProfileId: "gemini-cli", soul: "documentation steward" },
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

export function normalizeWorkMode(value) {
  const normalized = normalizeText(value).toLowerCase()
  if (["solo", "team", "parallel"].includes(normalized)) return normalized
  return "solo"
}

function normalizeRole(raw, index = 0) {
  if (!isPlainObject(raw)) return null
  const key = normalizeText(raw.key) || `role-${index + 1}`
  return {
    key,
    label: normalizeText(raw.label) || key,
    providerProfileId: normalizeText(raw.providerProfileId),
    soul: normalizeText(raw.soul),
    identity: normalizeText(raw.identity),
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
    workMode: normalizeWorkMode(raw.workMode),
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
