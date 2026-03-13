import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaude } from '@/lib/claude'
import {
  NEXO_SESSION_QUESTION_SYSTEM,
  NEXO_CONSTRUCTIVO_SYSTEM,
  NEXO_CRITICO_SYSTEM,
  NEXO_SYNTHESIS_SYSTEM,
} from '@/lib/prompts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Supa = ReturnType<typeof createClient>

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await req.json()
    const { action, projectId } = body

    const { data: project } = await supabase
      .from('projects').select('*').eq('id', projectId).eq('user_id', user.id).single()
    if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

    switch (action) {
      case 'start':   return await handleStart(supabase, project)
      case 'debate':  return await handleDebate(supabase, body)
      case 'resolve': return await handleResolve(supabase, project, body)
      default: return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
    }
  } catch (err) {
    console.error('[session/turn]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// ─── Start Session ────────────────────────────────────────────────────────────

async function handleStart(supabase: Supa, project: { id: string; founder_brief: string }) {
  // Get project documents with their specs
  const { data: documents } = await supabase
    .from('project_documents')
    .select('*, document_specs(*)')
    .eq('project_id', project.id)
    .order('created_at')

  if (!documents?.length) {
    return NextResponse.json({ error: 'No hay documentos configurados' }, { status: 400 })
  }

  // Create session
  const { data: session } = await supabase.from('sessions').insert({
    project_id: project.id,
    status: 'activa',
    mode: 'normal',
    current_document_index: 0,
    current_question_index: 0,
    total_documents: documents.length,
  }).select().single()

  if (!session) return NextResponse.json({ error: 'Error creando sesión' }, { status: 500 })

  // Generate questions for the first document
  const firstDoc = documents[0]
  const questions = await generateQuestions(project.founder_brief, firstDoc)

  // Create phases for all documents
  const phasesData = documents.map((doc, i) => ({
    session_id: session.id,
    document_id: doc.id,
    phase_index: i,
    status: i === 0 ? 'en_progreso' : 'pendiente',
    questions: i === 0 ? questions : [],
    momentum: { total_questions: i === 0 ? questions.length : 0, resolved: 0, constructivo_count: 0, critico_count: 0 },
    started_at: i === 0 ? new Date().toISOString() : null,
  }))

  const { data: phases } = await supabase.from('session_phases').insert(phasesData).select()

  return NextResponse.json({
    session,
    phases: phases ?? [],
    currentQuestion: questions[0]?.pregunta ?? null,
    questionIndex: 0,
    totalQuestions: questions.length,
    documentName: firstDoc.name,
    documentIndex: 0,
    totalDocuments: documents.length,
  })
}

// ─── Run Nexo Dual Debate ─────────────────────────────────────────────────────

async function handleDebate(supabase: Supa, body: {
  phaseId: string
  questionIndex: number
  question: string
  founderBrief: string
  documentName: string
}) {
  const { phaseId, questionIndex, question, founderBrief, documentName } = body

  const context = `Resumen del Fundador:
${founderBrief}

Documento en construcción: ${documentName}

Pregunta estratégica para el debate:
${question}`

  // Nexo Constructivo — optimistic proposal
  const constructiveContent = await callClaude(
    NEXO_CONSTRUCTIVO_SYSTEM,
    [{ role: 'user', content: context }],
    600
  )

  // Nexo Crítico — sees the constructive proposal
  const criticalContext = `${context}

Propuesta del Nexo Constructivo:
${constructiveContent}`

  const criticalContent = await callClaude(
    NEXO_CRITICO_SYSTEM,
    [{ role: 'user', content: criticalContext }],
    600
  )

  // Synthesis — check agreement level
  let agreement = false
  let synthesis: string | null = null

  try {
    const synthesisContext = `Propuesta Constructiva:\n${constructiveContent}\n\nCrítica:\n${criticalContent}`
    const synthesisRaw = await callClaude(
      NEXO_SYNTHESIS_SYSTEM,
      [{ role: 'user', content: synthesisContext }],
      400,
      'claude-haiku-4-5-20251001'
    )
    const cleanedRaw = synthesisRaw.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '')
    const parsed = JSON.parse(cleanedRaw)
    agreement = parsed.agreement === true
    synthesis = parsed.synthesis ?? null
  } catch {
    agreement = false
  }

  // Save NexoDualResponse
  const { data: nexoResponse } = await supabase.from('nexo_dual_responses').insert({
    phase_id: phaseId,
    question_index: questionIndex,
    constructive_content: constructiveContent,
    constructive_hat: 'amarillo',
    critical_content: criticalContent,
    critical_hat: 'negro',
    agreement,
    synthesis,
  }).select().single()

  return NextResponse.json({
    responseId: nexoResponse?.id ?? null,
    constructive: constructiveContent,
    critical: criticalContent,
    agreement,
    synthesis,
  })
}

// ─── Resolve Question ─────────────────────────────────────────────────────────

async function handleResolve(supabase: Supa, project: { id: string; founder_brief: string }, body: {
  sessionId: string
  phaseId: string
  responseId: string
  questionIndex: number
  resolution: 'constructiva' | 'critico' | 'responder_yo' | 'acuerdo'
  founderResponse?: string
}) {
  const { sessionId, phaseId, responseId, questionIndex, resolution, founderResponse } = body

  // Record resolution
  await supabase.from('nexo_dual_responses').update({
    resolution,
    founder_response: founderResponse ?? null,
  }).eq('id', responseId)

  // Get current phase
  const { data: phase } = await supabase
    .from('session_phases').select('*').eq('id', phaseId).single()
  if (!phase) return NextResponse.json({ error: 'Fase no encontrada' }, { status: 404 })

  // Update momentum + mark question as resolved
  const momentum = { ...(phase.momentum ?? {}) }
  momentum.resolved = (momentum.resolved ?? 0) + 1
  if (resolution === 'constructiva' || resolution === 'acuerdo') {
    momentum.constructivo_count = (momentum.constructivo_count ?? 0) + 1
  } else if (resolution === 'critico') {
    momentum.critico_count = (momentum.critico_count ?? 0) + 1
  }

  const questions = [...(phase.questions ?? [])]
  if (questions[questionIndex]) {
    questions[questionIndex] = { ...questions[questionIndex], resolucion: resolution }
  }

  const nextQuestionIndex = questionIndex + 1
  const phaseComplete = nextQuestionIndex >= questions.length

  if (phaseComplete) {
    // Mark this phase as completada
    await supabase.from('session_phases').update({
      status: 'completada',
      questions,
      momentum,
      completed_at: new Date().toISOString(),
    }).eq('id', phaseId)

    // Update document status
    await supabase.from('project_documents')
      .update({ status: 'generado', generated_at: new Date().toISOString() })
      .eq('id', phase.document_id)

    // Get session
    const { data: session } = await supabase
      .from('sessions').select('*').eq('id', sessionId).single()
    const nextDocIndex = (session?.current_document_index ?? 0) + 1

    // Look for next phase
    const { data: nextPhase } = await supabase
      .from('session_phases')
      .select('*, project_documents(*, document_specs(*))')
      .eq('session_id', sessionId)
      .eq('phase_index', nextDocIndex)
      .maybeSingle()

    if (!nextPhase) {
      // Session complete
      await supabase.from('sessions').update({
        status: 'completada',
        completed_at: new Date().toISOString(),
      }).eq('id', sessionId)
      await supabase.from('projects')
        .update({ current_phase: 'completado', last_active_at: new Date().toISOString() })
        .eq('id', project.id)
      return NextResponse.json({ sessionComplete: true })
    }

    // Generate questions for next phase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nextDoc = (nextPhase as any).project_documents
    const nextQuestions = await generateQuestions(project.founder_brief, nextDoc)

    await supabase.from('session_phases').update({
      status: 'en_progreso',
      questions: nextQuestions,
      momentum: { total_questions: nextQuestions.length, resolved: 0, constructivo_count: 0, critico_count: 0 },
      started_at: new Date().toISOString(),
    }).eq('id', nextPhase.id)

    await supabase.from('sessions').update({
      current_document_index: nextDocIndex,
      current_question_index: 0,
    }).eq('id', sessionId)

    return NextResponse.json({
      phaseComplete: true,
      nextPhaseId: nextPhase.id,
      nextQuestion: nextQuestions[0]?.pregunta ?? null,
      nextDocumentName: nextDoc?.name ?? '',
      nextDocumentIndex: nextDocIndex,
      nextQuestionIndex: 0,
      totalQuestions: nextQuestions.length,
    })
  } else {
    // Advance within same phase
    await supabase.from('session_phases').update({ questions, momentum }).eq('id', phaseId)
    await supabase.from('sessions').update({ current_question_index: nextQuestionIndex }).eq('id', sessionId)

    return NextResponse.json({
      phaseComplete: false,
      nextQuestionIndex,
      nextQuestion: questions[nextQuestionIndex]?.pregunta ?? null,
    })
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function generateQuestions(
  founderBrief: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  document: any
): Promise<Array<{ pregunta: string; resolucion: null }>> {
  const spec = document?.document_specs
  const sectionsText = (spec?.sections ?? [])
    .map((s: { nombre: string; descripcion: string }) => `- ${s.nombre}: ${s.descripcion}`)
    .join('\n')

  const prompt = `Resumen del Fundador:
${founderBrief ?? 'No disponible'}

Documento a construir: ${document?.name ?? 'Documento'}
Decisión estratégica: ${spec?.strategic_decision ?? ''}
Secciones del documento:
${sectionsText || '- Contenido general del documento'}

Genera exactamente 3 preguntas estratégicas para extraer la información necesaria para construir este documento.
Las preguntas deben ser específicas al contexto del founder descrito arriba, no genéricas.
Responde SOLO con un JSON array de 3 strings.`

  try {
    const response = await callClaude(
      NEXO_SESSION_QUESTION_SYSTEM,
      [{ role: 'user', content: prompt }],
      400,
      'claude-haiku-4-5-20251001'
    )
    const clean = response.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '')
    const parsed = JSON.parse(clean)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.slice(0, 3).map(q => ({ pregunta: String(q), resolucion: null }))
    }
  } catch {
    // fallback below
  }

  return [
    { pregunta: `¿Cuál es la propuesta central del "${document?.name ?? 'documento'}" para tu venture?`, resolucion: null },
    { pregunta: '¿Qué diferencia tu propuesta de las alternativas que ya existen en el mercado?', resolucion: null },
    { pregunta: '¿Cuáles son los 3 riesgos principales y cómo los mitigarías desde el inicio?', resolucion: null },
  ]
}
