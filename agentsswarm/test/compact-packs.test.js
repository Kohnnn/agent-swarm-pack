import assert from 'node:assert/strict'
import test from 'node:test'
import { listCompactPacks, resolveCompactPack } from '../src/compact-packs.js'

test('compact packs stay within the 8-agent limit', () => {
  const packs = listCompactPacks({})
  assert.ok(packs.length >= 4)
  assert.ok(packs.every((pack) => pack.maxAgents <= 8))
  assert.ok(packs.every((pack) => pack.roles.length <= 8))
})

test('compact pack resolution uses the configured default pack', () => {
  const pack = resolveCompactPack({ defaultCompactPackKey: 'ops-5' })
  assert.equal(pack.key, 'ops-5')
  assert.equal(pack.roles.length, 5)
})
