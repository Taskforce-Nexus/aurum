import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SesionConsejoView from '@/components/sesion-consejo/SesionConsejoView'
import type { Project, Advisor, Cofounder } from '@/lib/types'

export default async function SesionConsejoPage({ params }: { params: Promise<{ id: string }> }) {
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

  const [
    { data: council },
    { data: documents },
    { data: session },
  ] = await Promise.all([
    supabase.from('councils').select('*').eq('project_id', id).maybeSingle(),
    supabase
      .from('project_documents')
      .select('id, name, key_question, composition, deliverable_index, status')
      .eq('project_id', id)
      .order('deliverable_index', { ascending: true }),
    supabase.from('sessions').select('*').eq('project_id', id).eq('status', 'activa').maybeSingle(),
  ])

  let advisors: Advisor[] = []
  let cofounders: Cofounder[] = []
  let phases: unknown[] = []

  if (council) {
    const [
      { data: councilAdvisors },
      { data: councilCofounders },
    ] = await Promise.all([
      supabase.from('council_advisors').select('*, advisors(*)').eq('council_id', council.id),
      supabase.from('council_cofounders').select('*, cofounders(*)').eq('council_id', council.id),
    ])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    advisors = (councilAdvisors ?? []).map((ca: any) => ({ ...ca.advisors, level: ca.level })) as Advisor[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cofounders = (councilCofounders ?? []).map((cc: any) => ({ ...cc.cofounders, role: cc.role })) as Cofounder[]
  }

  if (session) {
    const { data: sessionPhases } = await supabase
      .from('session_phases')
      .select('*')
      .eq('session_id', session.id)
      .order('phase_index')
    phases = sessionPhases ?? []
  }

  return (
    <SesionConsejoView
      project={project as Project}
      advisors={advisors}
      cofounders={cofounders}
      documents={documents ?? []}
      initialSession={session ?? null}
      initialPhases={phases}
    />
  )
}
