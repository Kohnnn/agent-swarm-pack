import fs from 'node:fs'
import path from 'node:path'
import { resolveStateFilePath } from './runtime-paths.js'

function emptyState() {
  return {
    channelRoutes: {},
    projectRoutes: {},
    taskRoutes: {},
    managedTasks: {},
    lastStatusByTask: {},
  }
}

function resolveStorePaths(options = {}) {
  const env = options.env || process.env
  const stateFile = options.stateFile ? path.resolve(options.stateFile) : resolveStateFilePath(env)
  return {
    dataDir: path.dirname(stateFile),
    stateFile,
  }
}

export function loadBridgeState(options = {}) {
  const { stateFile } = resolveStorePaths(options)
  try {
    if (!fs.existsSync(stateFile)) return emptyState()
    const parsed = JSON.parse(fs.readFileSync(stateFile, 'utf8'))
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return emptyState()
    return {
      channelRoutes: parsed.channelRoutes && typeof parsed.channelRoutes === 'object' ? parsed.channelRoutes : {},
      projectRoutes: parsed.projectRoutes && typeof parsed.projectRoutes === 'object' ? parsed.projectRoutes : {},
      taskRoutes: parsed.taskRoutes && typeof parsed.taskRoutes === 'object' ? parsed.taskRoutes : {},
      managedTasks: parsed.managedTasks && typeof parsed.managedTasks === 'object' ? parsed.managedTasks : {},
      lastStatusByTask: parsed.lastStatusByTask && typeof parsed.lastStatusByTask === 'object'
        ? parsed.lastStatusByTask
        : {},
    }
  } catch {
    return emptyState()
  }
}

async function replaceFile(tempFile, stateFile) {
  try {
    await fs.promises.rename(tempFile, stateFile)
  } catch (err) {
    if (err && (err.code === 'EEXIST' || err.code === 'EPERM')) {
      await fs.promises.rm(stateFile, { force: true })
      await fs.promises.rename(tempFile, stateFile)
      return
    }
    throw err
  }
}

export async function saveBridgeState(state, options = {}) {
  const { dataDir, stateFile } = resolveStorePaths(options)
  const tempFile = `${stateFile}.${process.pid}.${Date.now()}.tmp`
  await fs.promises.mkdir(dataDir, { recursive: true })
  await fs.promises.writeFile(tempFile, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
  await replaceFile(tempFile, stateFile)
}
