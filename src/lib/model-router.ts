export type TaskType =
  | 'seed_chat'
  | 'compose'
  | 'session_question'
  | 'session_resolve'
  | 'consultation'
  | 'generate_specialist'
  | 'generate_persona'
  | 'generate_custom_advisor'
  | 'edit_document'
  | 'file_extract'
  | 'system_prompt_generation'

const MODEL_MAP: Record<string, Record<TaskType, string | null>> = {
  free: {
    seed_chat: 'claude-haiku-4-5-20251001',
    compose: 'claude-haiku-4-5-20251001',
    session_question: 'claude-haiku-4-5-20251001',
    session_resolve: 'claude-haiku-4-5-20251001',
    consultation: null,
    generate_specialist: 'claude-haiku-4-5-20251001',
    generate_persona: 'claude-haiku-4-5-20251001',
    generate_custom_advisor: null,
    edit_document: null,
    file_extract: 'claude-haiku-4-5-20251001',
    system_prompt_generation: 'claude-haiku-4-5-20251001',
  },
  core: {
    seed_chat: 'claude-sonnet-4-20250514',
    compose: 'claude-sonnet-4-20250514',
    session_question: 'claude-sonnet-4-20250514',
    session_resolve: 'claude-sonnet-4-20250514',
    consultation: 'claude-haiku-4-5-20251001',
    generate_specialist: 'claude-haiku-4-5-20251001',
    generate_persona: 'claude-haiku-4-5-20251001',
    generate_custom_advisor: 'claude-sonnet-4-20250514',
    edit_document: 'claude-haiku-4-5-20251001',
    file_extract: 'claude-haiku-4-5-20251001',
    system_prompt_generation: 'claude-haiku-4-5-20251001',
  },
  pro: {
    seed_chat: 'claude-sonnet-4-20250514',
    compose: 'claude-sonnet-4-20250514',
    session_question: 'claude-sonnet-4-20250514',
    session_resolve: 'claude-sonnet-4-20250514',
    consultation: 'claude-sonnet-4-20250514',
    generate_specialist: 'claude-sonnet-4-20250514',
    generate_persona: 'claude-sonnet-4-20250514',
    generate_custom_advisor: 'claude-sonnet-4-20250514',
    edit_document: 'claude-sonnet-4-20250514',
    file_extract: 'claude-sonnet-4-20250514',
    system_prompt_generation: 'claude-haiku-4-5-20251001',
  },
  enterprise: {
    seed_chat: 'claude-sonnet-4-20250514',
    compose: 'claude-opus-4-6',
    session_question: 'claude-opus-4-6',
    session_resolve: 'claude-opus-4-6',
    consultation: 'claude-sonnet-4-20250514',
    generate_specialist: 'claude-sonnet-4-20250514',
    generate_persona: 'claude-sonnet-4-20250514',
    generate_custom_advisor: 'claude-sonnet-4-20250514',
    edit_document: 'claude-sonnet-4-20250514',
    file_extract: 'claude-sonnet-4-20250514',
    system_prompt_generation: 'claude-haiku-4-5-20251001',
  },
}

export function getModel(plan: string, task: TaskType): string | null {
  return MODEL_MAP[plan]?.[task] ?? MODEL_MAP['free'][task]
}

export function isFeatureBlocked(plan: string, task: TaskType): boolean {
  return getModel(plan, task) === null
}
