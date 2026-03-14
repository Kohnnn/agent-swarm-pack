import assert from 'node:assert/strict'
import test from 'node:test'
import { loadConfig } from '../src/config.js'

function createEnv(overrides = {}) {
  return {
    SWARMCLAW_ACCESS_KEY: 'swarm-key',
    INBOX_WEBHOOK_SECRET: 'inbox-secret',
    BRIDGE_SECRET: 'bridge-secret',
    ...overrides,
  }
}

test('loadConfig requires BRIDGE_SECRET unless unsecured mode is explicit', () => {
  assert.throws(
    () => loadConfig(createEnv({ BRIDGE_SECRET: '' })),
    /BRIDGE_SECRET is required/,
  )

  const config = loadConfig(createEnv({ BRIDGE_SECRET: '', ALLOW_UNSECURED_BRIDGE: 'true' }))
  assert.equal(config.allowUnsecuredBridge, true)
  assert.ok(config.configIssues.includes('ALLOW_UNSECURED_BRIDGE is enabled; /ingest accepts unauthenticated requests.'))
})

test('loadConfig normalizes deprecated task mode to hybrid', () => {
  const config = loadConfig(createEnv({ TASK_COMMAND_MODE: 'direct_run' }))

  assert.equal(config.taskCommandMode, 'hybrid')
  assert.ok(config.configIssues.includes('TASK_COMMAND_MODE=direct_run is deprecated and now behaves as hybrid.'))
})

test('loadConfig records invalid override JSON issues', () => {
  const config = loadConfig(createEnv({
    PROJECT_ROUTE_MAP_JSON: '{',
    AGENTSSWARM_PROVIDER_PROFILES_JSON: '{',
    AGENTSSWARM_PACKS_JSON: '{',
  }))

  assert.ok(config.configIssues.includes('PROJECT_ROUTE_MAP_JSON contains invalid JSON.'))
  assert.ok(config.configIssues.includes('AGENTSSWARM_PROVIDER_PROFILES_JSON contains invalid JSON.'))
  assert.ok(config.configIssues.includes('AGENTSSWARM_PACKS_JSON contains invalid JSON.'))
})
