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

export function resolveTemplateDir(env = process.env) {
  const custom = String(env.AGENTSSWARM_TEMPLATE_DIR || '').trim()
  return custom ? path.resolve(custom) : path.join(resolveDataDir(env), 'templates')
}

export function resolveTemplateFilePath(templateName, env = process.env) {
  return path.join(resolveTemplateDir(env), String(templateName || '').trim())
}

export function resolveSkillDir(env = process.env) {
  const custom = String(env.AGENTSSWARM_SKILL_DIR || '').trim()
  return custom ? path.resolve(custom) : path.join(resolveDataDir(env), 'skills')
}

export function resolveStateFilePath(env = process.env) {
  const custom = String(env.AGENTSSWARM_STATE_FILE || '').trim()
  return custom ? path.resolve(custom) : path.join(resolveDataDir(env), 'bridge-state.json')
}

export function resolveSettingsFilePath(env = process.env) {
  const custom = String(env.AGENTSSWARM_SETTINGS_FILE || '').trim()
  return custom ? path.resolve(custom) : path.join(resolveDataDir(env), 'runtime-settings.json')
}

export function resolveStandaloneTaskFilePath(env = process.env) {
  const custom = String(env.AGENTSSWARM_STANDALONE_TASK_FILE || '').trim()
  return custom ? path.resolve(custom) : path.join(resolveDataDir(env), 'standalone-tasks.json')
}

export function resolveStandaloneApprovalFilePath(env = process.env) {
  const custom = String(env.AGENTSSWARM_STANDALONE_APPROVAL_FILE || '').trim()
  return custom ? path.resolve(custom) : path.join(resolveDataDir(env), 'standalone-approvals.json')
}

export function resolveStandaloneTaskRunDir(env = process.env) {
  const custom = String(env.AGENTSSWARM_STANDALONE_TASK_RUN_DIR || '').trim()
  return custom ? path.resolve(custom) : path.join(resolveDataDir(env), 'standalone-task-runs')
}

export function resolveScheduleFilePath(env = process.env) {
  const custom = String(env.AGENTSSWARM_SCHEDULE_FILE || '').trim()
  return custom ? path.resolve(custom) : path.join(resolveDataDir(env), 'schedules.json')
}
