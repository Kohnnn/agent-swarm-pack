import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC_DIR = path.dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = path.resolve(SRC_DIR, '..')

export function getPackageRoot() {
  return PACKAGE_ROOT
}

export function resolvePackagePath(...segments) {
  return path.join(PACKAGE_ROOT, ...segments)
}

export function resolveEnvFilePath(env = process.env) {
  const custom = String(env.AGENTSSWARM_ENV_FILE || '').trim()
  return custom ? path.resolve(custom) : resolvePackagePath('.env')
}

export function resolveDataDir(env = process.env) {
  const custom = String(env.AGENTSSWARM_DATA_DIR || '').trim()
  return custom ? path.resolve(custom) : resolvePackagePath('data')
}

export function resolveStateFilePath(env = process.env) {
  const custom = String(env.AGENTSSWARM_STATE_FILE || '').trim()
  return custom ? path.resolve(custom) : path.join(resolveDataDir(env), 'bridge-state.json')
}
