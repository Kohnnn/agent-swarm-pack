import assert from 'node:assert/strict'
import test from 'node:test'
import { buildProviderSummary, loadProviderProfiles, resolveProviderProfile } from '../src/providers.js'

test('provider profiles expose multi-provider defaults including multi-copilot support', () => {
  const profiles = loadProviderProfiles({})
  const ids = profiles.map((profile) => profile.id)
  assert.ok(ids.includes('codex-main'))
  assert.ok(ids.includes('copilot-review'))
  assert.ok(ids.includes('claude-cli'))
})

test('provider summary marks required cli tools and missing installs', () => {
  const summary = buildProviderSummary(
    {
      requiredCliToolIds: ['openclaw', 'codex'],
    },
    {
      runner: (_command, args) => ({ status: args[0] === 'codex' ? 0 : 1 }),
    },
  )

  const required = summary.cliTools.filter((tool) => tool.required)
  assert.deepEqual(required.map((tool) => tool.id), ['openclaw', 'codex'])
  assert.deepEqual(summary.missingRequiredCliTools, ['openclaw'])
})

test('provider resolution honors explicit profile ids', () => {
  const profile = resolveProviderProfile({}, 'copilot-review')
  assert.equal(profile.id, 'copilot-review')
  assert.equal(profile.transport, 'oauth')
})

test('provider resolution falls back to an available profile when preferred cli is missing', () => {
  const profile = resolveProviderProfile(
    {},
    'claude-cli',
    undefined,
    {
      preferAvailable: true,
      runner: (_command, args) => ({ status: args[0] === 'codex' ? 0 : 1 }),
      capabilityHints: ['orchestration'],
    },
  )

  assert.equal(profile.id, 'codex-main')
  assert.equal(profile.available, true)
})
