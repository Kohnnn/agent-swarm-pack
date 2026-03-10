import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createAndRunTaskInAgentsswarm,
  forwardDirectiveToAgentsswarm,
  listAgentsswarmTasks,
  resetForwarderCaches,
} from '../src/forwarder.js'

function createConfig(overrides = {}) {
  return {
    agentsswarmApiUrl: 'http://agentsswarm.local',
    agentsswarmAuthToken: '',
    inboxWebhookSecret: 'inbox-secret',
    defaultPlatform: 'telegram',
    defaultAccountId: 'primary',
    directiveSkipPlannedMeeting: true,
    taskCommandMode: 'hybrid',
    defaultCompactPackKey: 'software-6',
    defaultProviderProfileId: 'codex-main',
    requiredCliToolIds: ['openclaw', 'codex'],
    compactAgentLimit: 8,
    enforceCompactProjectScope: true,
    projectPathCacheTtlMs: 5 * 60 * 1000,
    httpRetryMaxAttempts: 2,
    httpRetryBaseDelayMs: 5,
    ...overrides,
  }
}

function jsonResponse(body, options = {}) {
  return new Response(JSON.stringify(body), {
    status: options.status || 200,
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  })
}

function headerValue(headers, name) {
  return new Headers(headers || undefined).get(name)
}

test('createAndRunTaskInAgentsswarm bootstraps auth and runs the task', async (t) => {
  resetForwarderCaches()
  const originalFetch = global.fetch
  const calls = []

  global.fetch = async (url, init = {}) => {
    calls.push({ url, init })

    if (url === 'http://agentsswarm.local/api/auth/session') {
      return jsonResponse(
        { ok: true },
        {
          headers: {
            'set-cookie': 'claw_session=session-token; Path=/; HttpOnly',
          },
        },
      )
    }

    if (url === 'http://agentsswarm.local/api/tasks') {
      assert.equal(headerValue(init.headers, 'authorization'), 'Bearer session-token')
      const body = JSON.parse(init.body)
      assert.equal(body.title, 'Ship the release')
      assert.equal(body.project_path, 'C:/workspace/project')
      assert.equal(body.workflow_meta_json.source, 'agentsswarm')
      assert.equal(body.workflow_meta_json.compact_pack_key, 'software-6')
      assert.equal(body.workflow_meta_json.provider_profile_id, 'codex-main')
      assert.equal(body.workflow_meta_json.channel.platform, 'telegram')
      return jsonResponse({ task: { id: 'task-12345678' } })
    }

    if (url === 'http://agentsswarm.local/api/tasks/task-12345678/run') {
      assert.equal(headerValue(init.headers, 'authorization'), 'Bearer session-token')
      const body = JSON.parse(init.body)
      assert.equal(body.provider_profile_id, 'codex-main')
      assert.equal(body.compact_pack_key, 'software-6')
      return jsonResponse({ ok: true })
    }

    throw new Error(`Unexpected fetch: ${url}`)
  }

  t.after(() => {
    global.fetch = originalFetch
    resetForwarderCaches()
  })

  const result = await createAndRunTaskInAgentsswarm(createConfig(), {
    text: '#Ship the release',
    projectPath: 'C:/workspace/project',
  })

  assert.equal(result.taskId, 'task-12345678')
  assert.equal(result.runStarted, true)
  assert.match(result.ackText, /software-6/)
  assert.equal(calls.length, 3)
})

test('forwardDirectiveToAgentsswarm reuses project binding and sends inbox secret', async (t) => {
  resetForwarderCaches()
  const originalFetch = global.fetch
  let inboxPayload = null

  global.fetch = async (url, init = {}) => {
    if (url === 'http://agentsswarm.local/api/auth/session') {
      return jsonResponse(
        { ok: true },
        {
          headers: {
            'set-cookie': 'claw_session=session-token; Path=/; HttpOnly',
          },
        },
      )
    }

    if (url.startsWith('http://agentsswarm.local/api/projects?search=')) {
      assert.equal(headerValue(init.headers, 'authorization'), 'Bearer session-token')
      return jsonResponse({
        projects: [
          {
            id: 'project-1',
            project_path: 'C:/workspace/project',
            core_goal: 'Existing core goal',
            assignment_mode: 'manual',
            assigned_agent_ids: ['agent-1'],
          },
        ],
      })
    }

    if (url === 'http://agentsswarm.local/api/inbox') {
      assert.equal(headerValue(init.headers, 'x-inbox-secret'), 'inbox-secret')
      inboxPayload = JSON.parse(init.body)
      return jsonResponse({ ok: true })
    }

    throw new Error(`Unexpected fetch: ${url}`)
  }

  t.after(() => {
    global.fetch = originalFetch
    resetForwarderCaches()
  })

  const result = await forwardDirectiveToAgentsswarm(createConfig(), {
    text: '$sync roadmap',
    platform: 'telegram',
    channelId: 'channel-1',
    senderId: 'ceo-1',
    senderName: 'CEO',
    projectPath: 'C:/workspace/project',
  })

  assert.equal(result.ackText, 'Directive sent to manager swarm.')
  assert.deepEqual(inboxPayload, {
    source: 'telegram',
    chat: 'channel-1',
    thread_id: null,
    account_id: 'primary',
    author: 'CEO',
    text: '$sync roadmap',
    skipPlannedMeeting: true,
    project_id: 'project-1',
    project_path: 'C:/workspace/project',
    project_context: 'Existing core goal',
    compact_pack_key: 'software-6',
    provider_profile_id: 'codex-main',
    workflow_meta_json: {
      source: 'agentsswarm',
      hybrid_mode: 'hybrid',
      compact_pack_key: 'software-6',
      compact_pack_label: 'Software Delivery 6',
      provider_profile_id: 'codex-main',
      provider: 'copilot',
      provider_transport: 'oauth',
      provider_model: 'openai-codex/gpt-5.3-codex',
      provider_available: true,
      channel: {
        platform: 'telegram',
        account_id: 'primary',
        channel_id: 'channel-1',
        thread_id: '',
        connector_id: '',
        label: 'telegram/primary/channel-1',
        key: 'telegram|primary|channel-1|-',
      },
      command_type: 'directive',
    },
  })
})

test('forwardDirectiveToAgentsswarm resolves exact project matches across paginated search results', async (t) => {
  resetForwarderCaches()
  const originalFetch = global.fetch
  const seenPages = []

  global.fetch = async (url, init = {}) => {
    if (url === 'http://agentsswarm.local/api/auth/session') {
      return jsonResponse(
        { ok: true },
        {
          headers: {
            'set-cookie': 'claw_session=session-token; Path=/; HttpOnly',
          },
        },
      )
    }

    if (url.includes('/api/projects?search=')) {
      seenPages.push(url)
      assert.equal(headerValue(init.headers, 'authorization'), 'Bearer session-token')

      if (url.includes('page=1')) {
        return jsonResponse({
          projects: [
            {
              id: 'project-other',
              project_path: 'C:/workspace/other',
              core_goal: 'Other project',
              assignment_mode: 'manual',
              assigned_agent_ids: ['agent-1'],
            },
          ],
          total_pages: 2,
        })
      }

      return jsonResponse({
        projects: [
          {
            id: 'project-2',
            project_path: 'C:/workspace/project',
            core_goal: 'Paged project goal',
            assignment_mode: 'manual',
            assigned_agent_ids: ['agent-2'],
          },
        ],
        total_pages: 2,
      })
    }

    if (url === 'http://agentsswarm.local/api/inbox') {
      return jsonResponse({ ok: true })
    }

    throw new Error(`Unexpected fetch: ${url}`)
  }

  t.after(() => {
    global.fetch = originalFetch
    resetForwarderCaches()
  })

  const result = await forwardDirectiveToAgentsswarm(createConfig(), {
    text: '$page through projects',
    platform: 'telegram',
    channelId: 'channel-1',
    senderId: 'ceo-1',
    senderName: 'CEO',
    projectPath: 'C:/workspace/project',
  })

  assert.equal(result.ackText, 'Directive sent to manager swarm.')
  assert.equal(seenPages.length, 2)
  assert.ok(seenPages[0].includes('page=1'))
  assert.ok(seenPages[1].includes('page=2'))
})

test('forwardDirectiveToAgentsswarm reuses cached project lookups for repeated paths', async (t) => {
  resetForwarderCaches()
  const originalFetch = global.fetch
  let searchCalls = 0

  global.fetch = async (url, init = {}) => {
    if (url === 'http://agentsswarm.local/api/auth/session') {
      return jsonResponse(
        { ok: true },
        {
          headers: {
            'set-cookie': 'claw_session=session-token; Path=/; HttpOnly',
          },
        },
      )
    }

    if (url.startsWith('http://agentsswarm.local/api/projects?search=')) {
      searchCalls += 1
      assert.equal(headerValue(init.headers, 'authorization'), 'Bearer session-token')
      return jsonResponse({
        projects: [
          {
            id: 'project-1',
            project_path: 'C:/workspace/project',
            core_goal: 'Existing core goal',
            assignment_mode: 'manual',
            assigned_agent_ids: ['agent-1'],
          },
        ],
      })
    }

    if (url === 'http://agentsswarm.local/api/inbox') {
      return jsonResponse({ ok: true })
    }

    throw new Error(`Unexpected fetch: ${url}`)
  }

  t.after(() => {
    global.fetch = originalFetch
    resetForwarderCaches()
  })

  const config = createConfig()
  await forwardDirectiveToAgentsswarm(config, {
    text: '$sync roadmap',
    channelId: 'channel-1',
    projectPath: 'C:/workspace/project',
  })
  await forwardDirectiveToAgentsswarm(config, {
    text: '$sync roadmap again',
    channelId: 'channel-1',
    projectPath: 'C:/workspace/project',
  })

  assert.equal(searchCalls, 1)
})

test('listAgentsswarmTasks retries transient GET failures', async (t) => {
  resetForwarderCaches()
  const originalFetch = global.fetch
  let taskCalls = 0

  global.fetch = async (url, init = {}) => {
    if (url === 'http://agentsswarm.local/api/auth/session') {
      return jsonResponse(
        { ok: true },
        {
          headers: {
            'set-cookie': 'claw_session=session-token; Path=/; HttpOnly',
          },
        },
      )
    }

    if (url === 'http://agentsswarm.local/api/tasks') {
      taskCalls += 1
      assert.equal(headerValue(init.headers, 'authorization'), 'Bearer session-token')
      if (taskCalls === 1) {
        return jsonResponse({ error: 'temporary' }, { status: 503 })
      }
      return jsonResponse({
        tasks: [
          { id: 'task-alpha', status: 'in_progress' },
        ],
      })
    }

    throw new Error(`Unexpected fetch: ${url}`)
  }

  t.after(() => {
    global.fetch = originalFetch
    resetForwarderCaches()
  })

  const tasks = await listAgentsswarmTasks(createConfig(), {})

  assert.equal(taskCalls, 2)
  assert.deepEqual(tasks, [{ id: 'task-alpha', status: 'in_progress' }])
})

test('listAgentsswarmTasks narrows polling to explicit task ids', async (t) => {
  resetForwarderCaches()
  const originalFetch = global.fetch

  global.fetch = async (url, init = {}) => {
    if (url === 'http://agentsswarm.local/api/auth/session') {
      return jsonResponse(
        { ok: true },
        {
          headers: {
            'set-cookie': 'claw_session=session-token; Path=/; HttpOnly',
          },
        },
      )
    }

    if (url === 'http://agentsswarm.local/api/tasks?ids=task-alpha%2Ctask-beta') {
      assert.equal(headerValue(init.headers, 'authorization'), 'Bearer session-token')
      return jsonResponse({
        tasks: [
          { id: 'task-alpha', status: 'in_progress' },
          { id: 'task-beta', status: 'done' },
        ],
      })
    }

    throw new Error(`Unexpected fetch: ${url}`)
  }

  t.after(() => {
    global.fetch = originalFetch
    resetForwarderCaches()
  })

  const tasks = await listAgentsswarmTasks(createConfig(), {
    taskIds: ['task-alpha', 'task-beta', 'task-alpha'],
  })

  assert.deepEqual(tasks, [
    { id: 'task-alpha', status: 'in_progress' },
    { id: 'task-beta', status: 'done' },
  ])
})
