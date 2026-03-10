import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { loadBridgeState, saveBridgeState } from '../src/state-store.js'

test('state store saves and reloads bridge state from a custom file', async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'agentsswarm-state-'))
  const stateFile = path.join(tempDir, 'bridge-state.json')
  const snapshot = {
    channelRoutes: {
      'telegram|primary|channel-1|-': { connectorId: 'connector-1', channelId: 'channel-1', platform: 'telegram' },
    },
    projectRoutes: {
      'C:/workspace/project': { connectorId: 'connector-1', channelId: 'channel-1' },
    },
    taskRoutes: {
      'task-1': { connectorId: 'connector-1', channelId: 'channel-1' },
    },
    managedTasks: {
      'task-1': { createdAt: 1, title: 'Build', projectPath: 'C:/workspace/project' },
    },
    lastStatusByTask: {
      'task-1': 'in_progress',
    },
  }

  await saveBridgeState(snapshot, { stateFile })

  assert.deepEqual(loadBridgeState({ stateFile }), snapshot)
})

test('state store falls back to an empty state for invalid JSON', async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'agentsswarm-state-'))
  const stateFile = path.join(tempDir, 'bridge-state.json')
  await fs.promises.writeFile(stateFile, '{invalid', 'utf8')

  assert.deepEqual(loadBridgeState({ stateFile }), {
    channelRoutes: {},
    projectRoutes: {},
    taskRoutes: {},
    managedTasks: {},
    lastStatusByTask: {},
  })
})
