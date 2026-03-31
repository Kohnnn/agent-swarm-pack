import { normalizeChannelEnvelope } from "./channels.js"
import { buildAgentContextFiles, mergeIdentityIntoPrompt, normalizeAgentSoul } from "./agent-soul.js"
import { normalizeWorkMode, resolveCompactPack } from "./compact-packs.js"
import { buildFailoverChain, resolveProviderProfile } from "./providers.js"

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return []
  return Array.from(new Set(value.map((entry) => normalizeText(entry)).filter(Boolean)))
}

function normalizeIdentity(value = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      name: "",
      persona: "",
      objective: "",
      voice: "",
      guardrails: "",
      soulText: "",
      identityText: "",
      systemPrompt: "",
      tags: [],
    }
  }
  return {
    name: normalizeText(value.name),
    persona: normalizeText(value.persona),
    objective: normalizeText(value.objective),
    voice: normalizeText(value.voice),
    guardrails: normalizeText(value.guardrails),
    soulText: normalizeText(value.soulText),
    identityText: normalizeText(value.identityText),
    systemPrompt: normalizeText(value.systemPrompt),
    tags: normalizeStringArray(value.tags),
  }
}

function normalizeEvaluateLoop(value = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      enabled: false,
      maxTurns: 10,
      timeoutMs: 300000,
      approvalGate: false,
    }
  }
  return {
    enabled: value.enabled === true,
    maxTurns: Math.min(Math.max(Number(value.maxTurns || 10), 1), 20),
    timeoutMs: Math.min(Math.max(Number(value.timeoutMs || 300000), 1000), 900000),
    approvalGate: value.approvalGate === true,
  }
}

function resolveCapabilityHints(commandType) {
  if (commandType === "directive") return ["orchestration"]
  return ["coding", "support", "ops", "research", "review"]
}

export function createExecutionContext(config, payload = {}) {
  const commandType = normalizeText(payload.commandType) || "task"
  const compactPack = resolveCompactPack(config, payload.compactPackKey)
  const requestedFallbackIds = normalizeStringArray(payload.fallbackProviderProfileIds)
  const requestedFallbackId = normalizeText(payload.fallbackProviderProfileId)
  const fallbackProfileId = commandType === "directive"
    ? requestedFallbackId
      || requestedFallbackIds[0]
      || compactPack?.roles?.[0]?.providerProfileId
      || compactPack?.defaultProviderProfileId
    : requestedFallbackId
      || requestedFallbackIds[0]
      || compactPack?.defaultProviderProfileId
  const modelOverridesByProvider = {
    ...(payload.modelOverridesByProvider && typeof payload.modelOverridesByProvider === "object" ? payload.modelOverridesByProvider : {}),
  }
  const requestedProviderProfileId = normalizeText(payload.providerProfileId)
  const requestedProviderModel = normalizeText(payload.providerModel)
  if (requestedProviderProfileId && requestedProviderModel) {
    modelOverridesByProvider[requestedProviderProfileId] = requestedProviderModel
  }
  const failoverChain = buildFailoverChain(config, payload.providerProfileId, {
    preferAvailable: true,
    capabilityHints: resolveCapabilityHints(commandType),
    fallbackProviderProfileId: requestedFallbackId || fallbackProfileId,
    fallbackProviderProfileIds: requestedFallbackIds,
    modelOverridesByProvider,
  })
  const providerProfile = failoverChain[0] || resolveProviderProfile(config, payload.providerProfileId, fallbackProfileId, {
    preferAvailable: true,
    capabilityHints: resolveCapabilityHints(commandType),
    modelOverridesByProvider,
  })
  const channel = normalizeChannelEnvelope(payload, {
    defaultPlatform: config.defaultPlatform,
    defaultAccountId: config.defaultAccountId,
  })
  const activePackRoles = normalizeStringArray(payload.activePackRoles)
  const selectedRoleKey = normalizeText(payload.roleKey) || activePackRoles[0] || ""
  const roleIdentityMap = payload.roleIdentityMap && typeof payload.roleIdentityMap === "object" && !Array.isArray(payload.roleIdentityMap)
    ? payload.roleIdentityMap
    : {}
  const baseIdentity = normalizeIdentity(payload.agentIdentity)
  const roleIdentity = normalizeIdentity(roleIdentityMap[selectedRoleKey])
  const soul = normalizeAgentSoul({
    ...baseIdentity,
    soulText: roleIdentity.soulText || compactPack?.roles?.find((role) => role.key === selectedRoleKey)?.soul || baseIdentity.soulText,
    identityText: roleIdentity.identityText || compactPack?.roles?.find((role) => role.key === selectedRoleKey)?.identity || baseIdentity.identityText,
    systemPrompt: roleIdentity.systemPrompt || baseIdentity.systemPrompt,
    persona: roleIdentity.persona || baseIdentity.persona,
    voice: roleIdentity.voice || baseIdentity.voice,
    guardrails: roleIdentity.guardrails || baseIdentity.guardrails,
    tags: roleIdentity.tags.length > 0 ? roleIdentity.tags : baseIdentity.tags,
  })
  const identityPrompt = mergeIdentityIntoPrompt(soul, {
    ...baseIdentity,
    ...roleIdentity,
    systemPrompt: roleIdentity.systemPrompt || baseIdentity.systemPrompt,
  })
  const workMode = normalizeWorkMode(payload.workMode || compactPack?.workMode)
  const evaluateLoop = normalizeEvaluateLoop(payload.evaluateLoop)

  return {
    commandType,
    compactPack,
    providerProfile,
    providerModel: requestedProviderModel || providerProfile?.model || "",
    fallbackProviderProfileId: requestedFallbackId || requestedFallbackIds[0] || fallbackProfileId || "",
    fallbackProviderProfileIds: requestedFallbackIds,
    failoverChain,
    rolePresetId: normalizeText(payload.rolePresetId),
    activePackRoles,
    selectedRoleKey,
    agentIdentity: baseIdentity,
    roleIdentity,
    workMode,
    skillIds: normalizeStringArray(payload.skillIds),
    evaluateLoop,
    soul,
    identityPrompt,
    contextFiles: buildAgentContextFiles(soul),
    priority: normalizeText(payload.priority),
    approvalRequired: payload.requiresApproval === true,
    approvalStatus: normalizeText(payload.approvalStatus),
    channel,
    projectPath: normalizeText(payload.projectPath) || normalizeText(config.defaultProjectPath),
    hybridMode: normalizeText(payload.taskCommandMode) === "board_only"
      ? "board_only"
      : config.taskCommandMode === "board_only"
        ? "board_only"
        : "hybrid",
  }
}

export function buildExecutionMetadata(context, extras = {}) {
  return {
    source: "agentsswarm",
    hybrid_mode: context.hybridMode,
    compact_pack_key: context.compactPack?.key || "",
    compact_pack_label: context.compactPack?.label || "",
    work_mode: context.workMode || "solo",
    provider_profile_id: context.providerProfile?.id || "",
    provider: context.providerProfile?.provider || "",
    provider_transport: context.providerProfile?.transport || "",
    provider_model: context.providerModel || context.providerProfile?.model || "",
    fallback_provider_profile_id: context.fallbackProviderProfileId || "",
    fallback_provider_profile_ids: context.fallbackProviderProfileIds || [],
    failover_chain: (context.failoverChain || []).map((profile) => ({
      id: profile.id,
      provider: profile.provider,
      model: profile.model,
      failover_rank: profile.failoverRank,
      available: profile.available !== false,
    })),
    role_preset_id: context.rolePresetId || "",
    selected_role_key: context.selectedRoleKey || "",
    agent_identity: context.agentIdentity || {},
    role_identity: context.roleIdentity || {},
    identity_prompt: context.identityPrompt || "",
    soul: context.soul || {},
    context_files: context.contextFiles || [],
    active_pack_roles: context.activePackRoles || [],
    skill_ids: context.skillIds || [],
    evaluate_loop: context.evaluateLoop || {},
    task_priority: context.priority || "",
    approval_required: context.approvalRequired === true,
    approval_status: context.approvalStatus || "",
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
    provider_model: context.providerModel || context.providerProfile?.model || null,
    fallback_provider_profile_id: context.fallbackProviderProfileId || null,
    fallback_provider_profile_ids: context.fallbackProviderProfileIds || [],
    role_preset_id: context.rolePresetId || null,
    workflow_meta_json: buildExecutionMetadata(context, {
      command_type: "directive",
    }),
  }
}

export function buildTeamDelegationPlan(context, taskText) {
  const cleanText = normalizeText(taskText)
  const packRoles = Array.isArray(context.compactPack?.roles) ? context.compactPack.roles : []
  const activeRoles = packRoles.filter((role) => {
    if (!Array.isArray(context.activePackRoles) || context.activePackRoles.length <= 0) return true
    return context.activePackRoles.includes(role.key)
  })
  const preferredOrder = ["orchestrator", "lead", "builder", "reviewer"]
  const ordered = [
    ...preferredOrder
      .map((roleKey) => activeRoles.find((role) => role.key === roleKey))
      .filter(Boolean),
    ...activeRoles.filter((role) => !preferredOrder.includes(role.key)),
  ]

  return ordered.map((role, index) => ({
    roleKey: role.key,
    providerProfileId: role.providerProfileId || context.providerProfile?.id || "",
    taskText: index === 0
      ? cleanText
      : `${cleanText}\n\nDelegation step ${index + 1}: continue from ${ordered[index - 1]?.label || "previous step"}.`,
    delegationIndex: index,
  }))
}

export function buildParallelTaskSet(context, taskText) {
  const cleanText = normalizeText(taskText)
  const packRoles = Array.isArray(context.compactPack?.roles) ? context.compactPack.roles : []
  const activeRoles = packRoles.filter((role) => {
    if (!Array.isArray(context.activePackRoles) || context.activePackRoles.length <= 0) return true
    return context.activePackRoles.includes(role.key)
  })
  return activeRoles.map((role, index) => ({
    roleKey: role.key,
    providerProfileId: role.providerProfileId || context.providerProfile?.id || "",
    taskText: cleanText,
    delegationIndex: index,
  }))
}

export function buildLoopConfig(context) {
  return normalizeEvaluateLoop(context.evaluateLoop)
}

export function buildTaskCreateRequest(context, taskText, options = {}) {
  const cleanText = normalizeText(taskText)
  return {
    description: cleanText,
    status: "inbox",
    task_type: "general",
    project_path: context.projectPath || null,
    parent_task_id: normalizeText(options.parentTaskId) || null,
    provider_profile_id: context.providerProfile?.id || null,
    provider_model: context.providerModel || context.providerProfile?.model || null,
    fallback_provider_profile_id: context.fallbackProviderProfileId || null,
    fallback_provider_profile_ids: context.fallbackProviderProfileIds || [],
    role_preset_id: context.rolePresetId || null,
    workflow_meta_json: buildExecutionMetadata(context, {
      command_type: "task",
      command_text: cleanText,
      parent_task_id: normalizeText(options.parentTaskId),
      child_task_ids: options.childTaskIds || [],
      delegation_index: Number.isFinite(Number(options.delegationIndex)) ? Number(options.delegationIndex) : -1,
    }),
  }
}

export function buildTaskRunRequest(context) {
  return buildExecutionMetadata(context, {
    command_type: "task_run",
  })
}
