import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaude } from '@/lib/claude'
import { COMPOSE_DELIVERABLES_PROMPT } from '@/lib/prompts'
import { checkBalance, trackUsage } from '@/lib/usage'

export async function POST(req: NextRequest) {
  const { project_id } = await req.json()

  if (!project_id) {
    return NextResponse.json({ error: 'project_id required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { canProceed } = await checkBalance(user.id)
  if (!canProceed) {
    return NextResponse.json({
      error: 'Saldo insuficiente. Recarga tu saldo para continuar.',
      balance: 0,
    }, { status: 402 })
  }

  // 1. Leer proyecto
  const { data: project, error: projectErr } = await supabase
    .from('projects')
    .select('id, name, founder_brief, purpose, venture_profile')
    .eq('id', project_id)
    .single()

  if (projectErr || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (!project.founder_brief) {
    return NextResponse.json({ error: 'Founder brief not generated yet' }, { status: 400 })
  }

  // 2. Componer entregables con Claude (tier strong — composición estratégica)
  const userMessage = `RESUMEN DEL FUNDADOR:\n${project.founder_brief}\n\nPROPÓSITO DEL CONSEJO:\n${project.purpose || 'No declarado — inferir del resumen'}\n\nPERFIL DEL VENTURE:\n${JSON.stringify(project.venture_profile || {})}`

  let response: string
  try {
    response = await callClaude({
      system: COMPOSE_DELIVERABLES_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
      max_tokens: 4096,
      tier: 'strong',
    })
  } catch (e) {
    const err = e as Error
    return NextResponse.json({ error: `Claude error: ${err.message}` }, { status: 502 })
  }

  try { await trackUsage(user.id, project_id, 'compose') } catch (e) { console.error('Usage tracking failed:', e) }

  // 3. Parsear JSON
  let composition: { diagnosis: unknown; deliverables: Array<Record<string, unknown>> }
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in response')
    composition = JSON.parse(jsonMatch[0])
  } catch {
    return NextResponse.json({ error: 'Failed to parse composition from Claude' }, { status: 500 })
  }

  const deliverables = composition.deliverables || []

  if (deliverables.length < 2) {
    return NextResponse.json({ error: 'Composition returned fewer than 2 deliverables' }, { status: 500 })
  }

  // 4. Limpiar entregables pendientes anteriores del proyecto
  await supabase
    .from('project_documents')
    .delete()
    .eq('project_id', project_id)
    .eq('status', 'pendiente')

  // 5. Insertar entregables como ProjectDocuments
  const documents = deliverables.map((d, i) => ({
    project_id,
    name: d.name as string,
    status: 'pendiente',
    key_question: d.key_question as string,
    deliverable_index: i,
    composition: d,
  }))

  const { data: inserted, error: insertErr } = await supabase
    .from('project_documents')
    .insert(documents)
    .select()

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  // 6. Actualizar fase del proyecto
  await supabase
    .from('projects')
    .update({ current_phase: 'entregables' })
    .eq('id', project_id)

  return NextResponse.json({
    diagnosis: composition.diagnosis,
    deliverables: inserted,
  })
}
