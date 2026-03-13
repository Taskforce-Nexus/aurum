export type Organization = {
  id: string
  name: string
  slug: string
  owner_id: string
  created_at: string
  updated_at: string
}

export type OrganizationMember = {
  id: string
  organization_id: string
  user_id: string
  role: 'owner' | 'cofounder' | 'advisor' | 'member'
  created_at: string
}

export type Project = {
  id: string
  name: string
  user_id: string
  organization_id: string
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
  github_repo: string | null
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

export type DocumentSpec = {
  id: string
  name: string
  icp: string
  strategic_decision: string | null
  sections: { nombre: string; descripcion: string }[]
  required_data: string[]
  key_advisors: string[]
  quality_criteria: string | null
  is_custom: boolean
  created_at: string
}

export type Advisor = {
  id: string
  name: string
  specialty: string | null
  category: string | null
  level: 'lidera' | 'apoya' | 'observa'
  element: 'fuego' | 'agua' | 'tierra' | 'aire' | null
  communication_style: string | null
  hats: string[]
  bio: string | null
  language: string | null
  is_native: boolean
  advisor_type: string | null
  created_at: string
}

export type Cofounder = {
  id: string
  name: string
  role: 'constructivo' | 'critico'
  specialty: string | null
  element: 'fuego' | 'agua' | 'tierra' | 'aire' | null
  communication_style: string | null
  hats: string[]
  bio: string | null
  language: string | null
  is_native: boolean
  created_at: string
}
