import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ConsultoriaView from '@/components/consultoria/ConsultoriaView'
import type { Project, Advisor, Cofounder } from '@/lib/types'

export default async function ConsultoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!project) notFound()

  // Gate: check for completed session
  const { data: completedSession } = await supabase
    .from('sessions')
    .select('id')
    .eq('project_id', id)
    .eq('status', 'completada')
    .limit(1)
    .maybeSingle()

  const sessionCompleted = !!completedSession

  // Fetch council, advisors, cofounders, documents, consultations
  const [
    { data: council },
    { data: documents },
    { data: consultations },
  ] = await Promise.all([
    supabase.from('councils').select('*').eq('project_id', id).maybeSingle(),
    supabase
      .from('project_documents')
      .select('id, name, status, content_json')
      .eq('project_id', id)
      .order('deliverable_index', { ascending: true }),
    supabase
      .from('consultations')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false }),
  ])

  let advisors: Advisor[] = []
  let cofounders: Cofounder[] = []

  if (council) {
    const [{ data: councilAdvisors }, { data: councilCofounders }] = await Promise.all([
      supabase.from('council_advisors').select('*, advisors(*)').eq('council_id', council.id),
      supabase.from('council_cofounders').select('*, cofounders(*)').eq('council_id', council.id),
    ])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    advisors = (councilAdvisors ?? []).map((ca: any) => ({ ...ca.advisors, level: ca.level })) as Advisor[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cofounders = (councilCofounders ?? []).map((cc: any) => ({ ...cc.cofounders, role: cc.role })) as Cofounder[]
  }

  return (
    <ConsultoriaView
      project={project as Project}
      advisors={advisors}
      cofounders={cofounders}
      documents={(documents ?? []) as DocumentRef[]}
      consultations={(consultations ?? []) as Consultation[]}
      sessionCompleted={sessionCompleted}
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
