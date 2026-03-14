import { normalizeChannelEnvelope } from "./channels.js"
import { resolveCompactPack } from "./compact-packs.js"
import { resolveProviderProfile } from "./providers.js"

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : ""
}

function resolveCapabilityHints(commandType) {
  if (commandType === "directive") return ["orchestration"]
  return ["coding", "support", "ops", "research", "review"]
}

export function createExecutionContext(config, payload = {}) {
  const commandType = normalizeText(payload.commandType) || "task"
  const compactPack = resolveCompactPack(config, payload.compactPackKey)
  const fallbackProfileId = commandType === "directive"
    ? compactPack?.roles?.[0]?.providerProfileId || compactPack?.defaultProviderProfileId
    : compactPack?.defaultProviderProfileId
  const providerProfile = resolveProviderProfile(config, payload.providerProfileId, fallbackProfileId, {
    preferAvailable: true,
    capabilityHints: resolveCapabilityHints(commandType),
  })
  const channel = normalizeChannelEnvelope(payload, {
    defaultPlatform: config.defaultPlatform,
    defaultAccountId: config.defaultAccountId,
  })

  return {
    commandType,
    compactPack,
    providerProfile,
    channel,
    projectPath: normalizeText(payload.projectPath) || normalizeText(config.defaultProjectPath),
    hybridMode: config.taskCommandMode === "board_only" ? "board_only" : "hybrid",
  }
}

export function buildExecutionMetadata(context, extras = {}) {
  return {
    source: "agentsswarm",
    hybrid_mode: context.hybridMode,
    compact_pack_key: context.compactPack?.key || "",
    compact_pack_label: context.compactPack?.label || "",
    provider_profile_id: context.providerProfile?.id || "",
    provider: context.providerProfile?.provider || "",
    provider_transport: context.providerProfile?.transport || "",
    provider_model: context.providerProfile?.model || "",
    provider_available: context.providerProfile?.available !== false,
    channel: {
      platform: context.channel.platform,
      account_id: context.channel.accountId,
      channel_id: context.channel.channelId,
      thread_id: context.channel.threadId,
      connector_id: context.channel.connectorId,
      label: context.channel.label,
      key: context.channel.key,
    },
    ...extras,
  }
}

export function buildDirectiveRequestBody(config, context, projectBinding, payload) {
  return {
    source: context.channel.platform,
    chat: context.channel.channelId || null,
    thread_id: context.channel.threadId || null,
    account_id: context.channel.accountId || null,
    author: context.channel.senderName || context.channel.senderId || "manager",
    text: normalizeText(payload.text),
    skipPlannedMeeting: config.directiveSkipPlannedMeeting,
    project_id: projectBinding.projectId,
    project_path: projectBinding.projectPath,
    project_context: projectBinding.projectContext,
    compact_pack_key: context.compactPack?.key || null,
    provider_profile_id: context.providerProfile?.id || null,
    workflow_meta_json: buildExecutionMetadata(context, {
      command_type: "directive",
    }),
  }
}

export function buildTaskCreateRequest(context, taskText) {
  const cleanText = normalizeText(taskText)
  return {
    description: cleanText,
    status: "inbox",
    task_type: "general",
    project_path: context.projectPath || null,
    workflow_meta_json: buildExecutionMetadata(context, {
      command_type: "task",
      command_text: cleanText,
    }),
  }
}

export function buildTaskRunRequest(context) {
  return buildExecutionMetadata(context, {
    command_type: "task_run",
  })
}
