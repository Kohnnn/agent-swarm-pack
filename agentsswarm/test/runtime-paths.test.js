import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import { getPackageRoot, resolveDataDir, resolveEnvFilePath, resolveStateFilePath } from '../src/runtime-paths.js'

test('runtime paths resolve from the package root by default', () => {
  const packageRoot = getPackageRoot()

  assert.equal(resolveEnvFilePath({}), path.join(packageRoot, '.env'))
  assert.equal(resolveDataDir({}), path.join(packageRoot, 'data'))
  assert.equal(resolveStateFilePath({}), path.join(packageRoot, 'data', 'bridge-state.json'))
})

test('runtime path helpers honor explicit overrides', () => {
  assert.equal(
    resolveEnvFilePath({ AGENTSSWARM_ENV_FILE: './tmp/bridge.env' }),
    path.resolve('./tmp/bridge.env'),
  )
  assert.equal(
    resolveDataDir({ AGENTSSWARM_DATA_DIR: './tmp/bridge-data' }),
    path.resolve('./tmp/bridge-data'),
  )
  assert.equal(
    resolveStateFilePath({ AGENTSSWARM_STATE_FILE: './tmp/state.json' }),
    path.resolve('./tmp/state.json'),
  )
})
