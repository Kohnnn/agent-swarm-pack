import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const bridgeDir = path.resolve(scriptDir, "..")
const repoRoot = path.resolve(bridgeDir, "..")

const envPath = path.join(bridgeDir, ".env")
const envExamplePath = path.join(bridgeDir, ".env.example")
const swarmclawEnvPath = path.join(repoRoot, "swarmclaw", ".env.local")
const apiEnvCandidates = [
  path.join(repoRoot, "agentsswarm-api", ".env"),
  path.join(repoRoot, "claw-empire", ".env"),
]

const strict = process.argv.includes("--strict")
const quiet = process.argv.includes("--quiet")
const resyncEnv = process.argv.includes("--resync-env")

function log(message) {
  if (!quiet) process.stdout.write(`${message}\n`)
}

function warn(message) {
  process.stderr.write(`${message}\n`)
}

function isMissingValue(value) {
  const normalized = String(value || "").trim()
  return !normalized || normalized === "__CHANGE_ME__"
}

function parseEnvText(text) {
  const result = {}
  for (const line of String(text || "").split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const idx = trimmed.indexOf("=")
    if (idx <= 0) continue
    const key = trimmed.slice(0, idx).trim()
    const rawValue = trimmed.slice(idx + 1).trim()
    const value = rawValue.replace(/^['"]|['"]$/g, "")
    if (!key) continue
    result[key] = value
  }
  return result
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  return parseEnvText(fs.readFileSync(filePath, "utf8"))
}

function resolveApiEnvPath() {
  return apiEnvCandidates.find((candidate) => fs.existsSync(candidate)) || apiEnvCandidates[apiEnvCandidates.length - 1]
}

function setEnvLine(lines, key, nextValue, options = {}) {
  if (isMissingValue(nextValue)) return false
  const matcher = new RegExp(`^\\s*${key}\\s*=`)
  const index = lines.findIndex((line) => matcher.test(line))
  const force = options.force === true

  if (index >= 0) {
    const currentLine = lines[index]
    const currentRaw = currentLine.slice(currentLine.indexOf("=") + 1).trim()
    const current = currentRaw.replace(/^['"]|['"]$/g, "")
    if (!force && !isMissingValue(current)) return false
    if (current === nextValue) return false
    lines[index] = `${key}=${nextValue}`
    return true
  }

  lines.push(`${key}=${nextValue}`)
  return true
}

function ensureEnvFile() {
  if (fs.existsSync(envPath)) return false
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath)
  } else {
    fs.writeFileSync(envPath, "", "utf8")
  }
  return true
}

const created = ensureEnvFile()
if (created) log("[agentsswarm] created .env from template")

const apiEnvPath = resolveApiEnvPath()
const bridgeEnv = readEnvFile(envPath)
const swarmEnv = readEnvFile(swarmclawEnvPath)
const apiEnv = readEnvFile(apiEnvPath)
const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/)

const desired = {
  BRIDGE_PORT: bridgeEnv.BRIDGE_PORT || "7799",
  SWARMCLAW_URL: bridgeEnv.SWARMCLAW_URL || "http://127.0.0.1:3456",
  AGENTSSWARM_API_URL: bridgeEnv.AGENTSSWARM_API_URL || bridgeEnv.CLAW_EMPIRE_URL || "http://127.0.0.1:8790",
  DEFAULT_PROJECT_PATH: bridgeEnv.DEFAULT_PROJECT_PATH || repoRoot,
  DEFAULT_PLATFORM: bridgeEnv.DEFAULT_PLATFORM || "telegram",
  DEFAULT_ACCOUNT_ID: bridgeEnv.DEFAULT_ACCOUNT_ID || "primary",
  STATUS_RELAY_ENABLED: bridgeEnv.STATUS_RELAY_ENABLED || "true",
  STATUS_RELAY_MANAGED_ONLY: bridgeEnv.STATUS_RELAY_MANAGED_ONLY || "true",
  STATUS_RELAY_INTERVAL_MS: bridgeEnv.STATUS_RELAY_INTERVAL_MS || "6000",
  DIRECTIVE_SKIP_PLANNED_MEETING: bridgeEnv.DIRECTIVE_SKIP_PLANNED_MEETING || "true",
  TASK_COMMAND_MODE: bridgeEnv.TASK_COMMAND_MODE || "hybrid",
  COMPACT_AGENT_LIMIT: bridgeEnv.COMPACT_AGENT_LIMIT || "8",
  ENFORCE_COMPACT_PROJECT_SCOPE: bridgeEnv.ENFORCE_COMPACT_PROJECT_SCOPE || "true",
  DEFAULT_COMPACT_PACK: bridgeEnv.DEFAULT_COMPACT_PACK || "software-6",
  DEFAULT_PROVIDER_PROFILE: bridgeEnv.DEFAULT_PROVIDER_PROFILE || "codex-main",
  AGENTSSWARM_SUPPORTED_PLATFORMS: bridgeEnv.AGENTSSWARM_SUPPORTED_PLATFORMS || "telegram,discord,whatsapp,cli",
  AGENTSSWARM_REQUIRED_CLI_TOOLS: bridgeEnv.AGENTSSWARM_REQUIRED_CLI_TOOLS || "openclaw,codex",
  SWARMCLAW_ACCESS_KEY: bridgeEnv.SWARMCLAW_ACCESS_KEY || swarmEnv.ACCESS_KEY || "",
  INBOX_WEBHOOK_SECRET: bridgeEnv.INBOX_WEBHOOK_SECRET || apiEnv.INBOX_WEBHOOK_SECRET || "",
  AGENTSSWARM_AUTH_TOKEN:
    bridgeEnv.AGENTSSWARM_AUTH_TOKEN || bridgeEnv.CLAW_EMPIRE_AUTH_TOKEN || apiEnv.API_AUTH_TOKEN || "",
}

const updatedKeys = []
for (const [key, value] of Object.entries(desired)) {
  if (setEnvLine(lines, key, value, { force: resyncEnv })) {
    updatedKeys.push(key)
  }
}

const optionalKeys = [
  "AGENTSSWARM_PROVIDER_PROFILES_JSON",
  "AGENTSSWARM_PACKS_JSON",
  "CHANNEL_ROUTE_MAP_JSON",
  "PROJECT_ROUTE_MAP_JSON",
]
for (const key of optionalKeys) {
  if (setEnvLine(lines, key, bridgeEnv[key] || "", { force: false })) {
    updatedKeys.push(key)
  }
}

if (updatedKeys.length > 0) {
  const normalized = `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd()}\n`
  fs.writeFileSync(envPath, normalized, "utf8")
  log(`[agentsswarm] synced .env keys: ${updatedKeys.join(", ")}`)
} else {
  log(`[agentsswarm] .env already synchronized${resyncEnv ? " (resync mode)" : ""}`)
}

const finalEnv = readEnvFile(envPath)
const requiredKeys = ["SWARMCLAW_ACCESS_KEY", "INBOX_WEBHOOK_SECRET"]
const missingRequired = requiredKeys.filter((key) => isMissingValue(finalEnv[key]))

if (missingRequired.length > 0) {
  const message = `[agentsswarm] missing required env keys: ${missingRequired.join(", ")}`
  if (strict) {
    warn(message)
    process.exit(1)
  }
  warn(`${message} (agentsswarm may fail until configured)`)
}

if (!quiet) {
  log(`[agentsswarm] api env source: ${path.relative(repoRoot, apiEnvPath)}`)
}
