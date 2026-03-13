import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SesionConsejoView from '@/components/sesion-consejo/SesionConsejoView'
import type { Project, Advisor, Cofounder } from '@/lib/types'

export default async function SesionConsejoPage({ params }: { params: { id: string } }) {
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

  // Fetch council + advisors + cofounders + documents + existing session
  const [
    { data: council },
    { data: documents },
    { data: session },
  ] = await Promise.all([
    supabase.from('councils').select('*').eq('project_id', params.id).maybeSingle(),
    supabase.from('project_documents').select('*, document_specs(*)').eq('project_id', params.id).order('created_at'),
    supabase.from('sessions').select('*').eq('project_id', params.id).eq('status', 'activa').maybeSingle(),
  ])

  // Fetch advisors and cofounders if council exists
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
      documents={(documents ?? []) as unknown[]}
      initialSession={session ?? null}
      initialPhases={phases}
    />
  )
}
