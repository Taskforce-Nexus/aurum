import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ConsultoriaView from '@/components/consultoria/ConsultoriaView'
import type { Project, Advisor, Cofounder } from '@/lib/types'

export default async function ConsultoriaPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!project) notFound()

  // Fetch council, advisors, cofounders, documents, consultations
  const [
    { data: council },
    { data: documents },
    { data: consultations },
  ] = await Promise.all([
    supabase.from('councils').select('*').eq('project_id', params.id).maybeSingle(),
    supabase
      .from('project_documents')
      .select('id, name, status, content_json')
      .eq('project_id', params.id)
      .order('generated_at', { ascending: true, nullsFirst: true }),
    supabase
      .from('consultations')
      .select('*')
      .eq('project_id', params.id)
      .order('created_at', { ascending: false }),
  ])

  let advisors: Advisor[] = []
  let cofounders: Cofounder[] = []

  if (council) {
    const [{ data: councilAdvisors }, { data: councilCofounders }] = await Promise.all([
      supabase.from('council_advisors').select('*, advisors(*)').eq('council_id', council.id),
      supabase.from('council_cofounders').select('*, cofounders(*)').eq('council_id', council.id),
    ])
    advisors = (councilAdvisors ?? []).map((ca: any) => ({ ...ca.advisors, level: ca.level })) as Advisor[]
    cofounders = (councilCofounders ?? []).map((cc: any) => ({ ...cc.cofounders, role: cc.role })) as Cofounder[]
  }

  return (
    <ConsultoriaView
      project={project as Project}
      advisors={advisors}
      cofounders={cofounders}
      documents={(documents ?? []) as DocumentRef[]}
      consultations={(consultations ?? []) as Consultation[]}
    />
  )
}

export interface DocumentRef {
  id: string
  name: string
  status: string
  content_json: { sections?: { section_name: string; content: string; key_points: string[] }[] } | null
}

export interface Consultation {
  id: string
  title: string
  messages: ConsultationMessage[]
  participating_advisors: string[]
  status: string
  created_at: string
}

export interface ConsultationMessage {
  role: 'user' | 'nexo' | 'advisor'
  content: string
  advisor_id?: string
  advisor_name?: string
  specialty?: string
  timestamp: string
}
