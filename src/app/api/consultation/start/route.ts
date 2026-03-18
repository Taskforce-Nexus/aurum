import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { project_id, title } = await req.json()

  if (!project_id) {
    return NextResponse.json({ error: 'project_id required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  // 1. Verify project access
  const { data: project, error: projectErr } = await supabase
    .from('projects')
    .select('id, name, founder_brief')
    .eq('id', project_id)
    .eq('user_id', user.id)
    .single()

  if (projectErr || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // 2. Gate: require a completed session
  const { data: completedSession } = await supabase
    .from('sessions')
    .select('id')
    .eq('project_id', project_id)
    .eq('status', 'completada')
    .limit(1)
    .maybeSingle()

  if (!completedSession) {
    return NextResponse.json(
      { error: 'La Consultoría Activa requiere una Sesión de Consejo completada.' },
      { status: 403 }
    )
  }

  // 3. Load council advisors
  const { data: councilData } = await supabase
    .from('councils')
    .select('id, council_advisors(level, advisors(id, name, specialty, background))')
    .eq('project_id', project_id)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const advisors = ((councilData as any)?.council_advisors ?? []).map((ca: any) => ({
    id: ca.advisors?.id as string,
    name: ca.advisors?.name as string,
    specialty: ca.advisors?.specialty as string | null,
    background: ca.advisors?.background as string | null,
    level: ca.level as string,
  }))

  // 4. Create consultation
  const { data: consultation, error: consultErr } = await supabase
    .from('consultations')
    .insert({
      project_id,
      title: title ?? `Consultoría — ${project.name}`,
      messages: [],
      status: 'activa',
    })
    .select()
    .single()

  if (consultErr || !consultation) {
    return NextResponse.json({ error: consultErr?.message ?? 'Failed to create consultation' }, { status: 500 })
  }

  return NextResponse.json({ consultation, advisors })
}
