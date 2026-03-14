import crypto from "node:crypto"

function trimText(value, maxLength = 160) {
  const text = typeof value === "string" ? value.trim() : ""
  if (!text) return ""
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 3)}...`
}

function sanitizeValue(value) {
  if (value == null) return undefined
  if (typeof value === "string") return trimText(value, 240)
  if (typeof value === "number" || typeof value === "boolean") return value
  if (Array.isArray(value)) {
    const out = value.map((entry) => sanitizeValue(entry)).filter((entry) => entry !== undefined)
    return out.length > 0 ? out : undefined
  }
  if (typeof value === "object") {
    const out = {}
    for (const [key, entry] of Object.entries(value)) {
      const sanitized = sanitizeValue(entry)
      if (sanitized !== undefined) out[key] = sanitized
    }
    return Object.keys(out).length > 0 ? out : undefined
  }
  return String(value)
}

function emit(level, event, data = {}) {
  const payload = sanitizeValue({
    ts: new Date().toISOString(),
    level,
    event,
    ...data,
  })
  const line = `[agentsswarm] ${JSON.stringify(payload)}`
  if (level === "error") {
    console.error(line)
    return
  }
  if (level === "warn") {
    console.warn(line)
    return
  }
  console.log(line)
}

export function createRequestId(seed) {
  const value = typeof seed === "string" ? seed.trim() : ""
  return value || crypto.randomUUID()
}

export function createTextPreview(text, maxLength = 96) {
  return trimText(text, maxLength)
}

export function logInfo(event, data) {
  emit("info", event, data)
}

export function logWarn(event, data) {
  emit("warn", event, data)
}

export function logError(event, data) {
  emit("error", event, data)
}
