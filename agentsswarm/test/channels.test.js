import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildConnectorMessagePayload,
  normalizeChannelEnvelope,
  summarizeConnectorInventory,
  toChannelRouteKey,
} from '../src/channels.js'

test('channel envelope normalizes platform, account, and route key', () => {
  const channel = normalizeChannelEnvelope(
    {
      platform: 'Discord',
      accountId: '',
      channelId: 'eng-room',
      threadId: 'release-thread',
      connectorId: 'connector-1',
    },
    {
      defaultPlatform: 'telegram',
      defaultAccountId: 'primary',
    },
  )

  assert.equal(channel.platform, 'discord')
  assert.equal(channel.accountId, 'primary')
  assert.equal(channel.key, 'discord|primary|eng-room|release-thread')
  assert.equal(toChannelRouteKey(channel), 'discord|primary|eng-room|release-thread')
})

test('connector message payload carries optional account and thread fields', () => {
  assert.deepEqual(
    buildConnectorMessagePayload(
      {
        platform: 'telegram',
        accountId: 'founder',
        channelId: 'ceo-room',
        threadId: 'focus',
      },
      'hello',
    ),
    {
      channelId: 'ceo-room',
      text: 'hello',
      threadId: 'focus',
      accountId: 'founder',
      platform: 'telegram',
    },
  )
})

test('connector inventory summarizes platforms and bridge wiring', () => {
  const summary = summarizeConnectorInventory({
    a: { type: 'telegram-connector', config: { bridgeEndpoint: 'http://127.0.0.1:7799' } },
    b: { platform: 'discord', config: {} },
    c: { name: 'whatsapp-biz', config: { bridgeEndpoint: 'http://127.0.0.1:7799' } },
  })

  assert.deepEqual(summary, {
    total: 3,
    bridgeWired: 2,
    byPlatform: {
      telegram: 1,
      discord: 1,
      whatsapp: 1,
    },
  })
})
