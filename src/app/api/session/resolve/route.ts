import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaude } from '@/lib/claude'
import { checkBalance, trackUsage } from '@/lib/usage'
import { GENERATE_DOCUMENT_PROMPT } from '@/lib/prompts'
import { createNotification } from '@/lib/notifications'
import { getModel } from '@/lib/model-router'
import { getUserPlan } from '@/lib/plan'

export async function POST(req: NextRequest) {
  const { session_id, phase_id, dual_response_id, resolution, founder_response } = await req.json()

  if (!session_id || !phase_id || !dual_response_id || !resolution) {
    return NextResponse.json(
      { error: 'session_id, phase_id, dual_response_id, resolution required' },
      { status: 400 }
    )
  }

  const validResolutions = ['constructiva', 'critico', 'responder_yo', 'acuerdo']
  if (!validResolutions.includes(resolution)) {
    return NextResponse.json(
      { error: `resolution must be one of: ${validResolutions.join(', ')}` },
      { status: 400 }
    )
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

  const plan = await getUserPlan(user.id)
  const resolveModel = getModel(plan, 'session_resolve')
  if (!resolveModel) {
    return NextResponse.json({ error: 'upgrade_required', feature: 'session_resolve', message: 'Esta función requiere plan Core o superior' }, { status: 403 })
  }

  // 1. Update the NexoDualResponse with the resolution
  const updatePayload: Record<string, string> = { resolution }
  if (resolution === 'responder_yo' && founder_response) {
    updatePayload.founder_response = founder_response
  }

  const { error: resolveErr } = await supabase
    .from('nexo_dual_responses')
    .update(updatePayload)
    .eq('id', dual_response_id)

  if (resolveErr) {
    return NextResponse.json({ error: resolveErr.message }, { status: 500 })
  }

  // 2. Load the phase
  const { data: phase, error: phaseErr } = await supabase
    .from('session_phases')
    .select('*, session:sessions(id, project_id, total_documents, current_document_index)')
    .eq('id', phase_id)
    .single()

  if (phaseErr || !phase) {
    return NextResponse.json({ error: 'Phase not found' }, { status: 404 })
  }

  const session = phase.session as {
    id: string
    project_id: string
    total_documents: number
    current_document_index: number
  }

  // 3. Check if phase is complete (last question resolved)
  const questions = (phase.questions as Array<{ question: string }>) ?? []
  const { data: allResponses } = await supabase
    .from('nexo_dual_responses')
    .select('id, resolution')
    .eq('phase_id', phase_id)
    .order('question_index', { ascending: true })

  const allResolved = allResponses?.every(r => r.resolution !== null) ?? false
  const phaseComplete = phase.status === 'completada' || (allResolved && allResponses?.length === questions.length)

  if (!phaseComplete) {
    // Not the last question — just return progress
    return NextResponse.json({
      resolved: true,
      phase_complete: false,
      session_complete: false,
    })
  }

  // 4. Phase is complete — generate the final document
  const { data: doc } = await supabase
    .from('project_documents')
    .select('name, key_question, composition')
    .eq('id', phase.document_id)
    .single()

  const { data: project } = await supabase
    .from('projects')
    .select('founder_brief')
    .eq('id', session.project_id)
    .single()

  // Build session history from all responses
  const { data: responses } = await supabase
    .from('nexo_dual_responses')
    .select('question_index, founder_response, constructive_content, critical_content, resolution, synthesis')
    .eq('phase_id', phase_id)
    .order('question_index', { ascending: true })

  const sessionHistory = (responses ?? [])
    .map(r => {
      const q = (phase.questions as Array<{ question: string }>)[r.question_index]
      const chosenContent = r.resolution === 'constructiva'
        ? r.constructive_content
        : r.resolution === 'critico'
        ? r.critical_content
        : r.founder_response
      return `P${r.question_index + 1}: ${q?.question ?? ''}\nRespuesta del fundador: ${r.founder_response ?? ''}\nResolución (${r.resolution}): ${chosenContent ?? ''}`
    })
    .join('\n\n')

  const composition = (doc?.composition ?? {}) as {
    sections?: Array<{ title: string; description: string }>
  }

  let contentJson: Record<string, unknown> = {}
  try {
    const frameworksText = ((composition.sections ?? []) as Array<{ title: string; description: string }>).map(s => s.title).join(', ')
    const prompt = GENERATE_DOCUMENT_PROMPT
      .replace('{deliverable_name}', doc?.name ?? '')
      .replace('{key_question}', doc?.key_question ?? '')
      .replace('{frameworks}', frameworksText)
      .replace('{session_transcript}', sessionHistory)

    const raw = await callClaude({
      system: prompt,
      messages: [{ role: 'user', content: 'Genera el documento final del entregable.' }],
      max_tokens: 4096,
      model: resolveModel,
    })
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (jsonMatch) contentJson = JSON.parse(jsonMatch[0])
    try { await trackUsage(user.id, session.project_id, 'session_resolve') } catch (e) { console.error('Usage tracking failed:', e) }
  } catch { /* non-blocking — save empty content */ }

  // Save content to ProjectDocument
  await supabase
    .from('project_documents')
    .update({
      content_json: contentJson,
      status: 'generado',
      generated_at: new Date().toISOString(),
    })
    .eq('id', phase.document_id)

  // Notify: documento generado
  try {
    await createNotification({
      userId: user.id,
      projectId: session.project_id,
      type: 'documento_generado',
      title: `Tu "${doc?.name ?? 'documento'}" está listo`,
    })
  } catch (e) { console.error('[notify] documento_generado:', e) }

  // 5. Advance session to next phase
  const nextDocIndex = session.current_document_index + 1
  const sessionComplete = nextDocIndex >= session.total_documents

  if (sessionComplete) {
    await supabase
      .from('sessions')
      .update({ status: 'completada', completed_at: new Date().toISOString() })
      .eq('id', session_id)

    await supabase
      .from('projects')
      .update({ current_phase: 'completado' })
      .eq('id', session.project_id)

    // Notify: sesión completada
    try {
      await createNotification({
        userId: user.id,
        projectId: session.project_id,
        type: 'sesion_completada',
        title: `Sesión de Consejo completada — ${session.total_documents} documentos generados`,
      })
    } catch (e) { console.error('[notify] sesion_completada:', e) }
  } else {
    // Mark next phase as en_progreso
    const { data: nextPhase } = await supabase
      .from('session_phases')
      .select('id, document_id')
      .eq('session_id', session_id)
      .eq('phase_index', nextDocIndex)
      .single()

    if (nextPhase) {
      await supabase
        .from('session_phases')
        .update({ status: 'en_progreso', started_at: new Date().toISOString() })
        .eq('id', nextPhase.id)

      await supabase
        .from('project_documents')
        .update({ status: 'en_progreso' })
        .eq('id', nextPhase.document_id)
    }

    await supabase
      .from('sessions')
      .update({ current_document_index: nextDocIndex, current_question_index: 0 })
      .eq('id', session_id)
  }

  return NextResponse.json({
    resolved: true,
    phase_complete: true,
    session_complete: sessionComplete,
    document_generated: Object.keys(contentJson).length > 0,
    next_phase_index: sessionComplete ? null : nextDocIndex,
  })
}
