export type Project = {
  id: string
  name: string
  user_id: string
  status: string
  incubation_mode: string | null
  founder_brief: string | null
  entry_level: 'raw_idea' | 'has_prd' | 'has_partial'
  current_phase: string | null
  last_active_at: string | null
  aurum_value_proposition: string | null
  aurum_business_model: string | null
  aurum_branding: string | null
  aurum_customer_journey: string | null
  aurum_business_plan: string | null
  created_at: string
  updated_at: string
}

export type Conversation = {
  id: string
  project_id: string
  phase: string
  messages: Message[]
  extracted_docs: Record<string, string> | null
  progress: Record<string, number> | null
  created_at: string
  updated_at: string
}

export type Message = {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
  author?: string
}
