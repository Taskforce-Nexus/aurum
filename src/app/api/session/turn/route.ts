import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callClaude } from '@/lib/claude'
import {
  NEXO_SESSION_QUESTION_SYSTEM,
  NEXO_CONSTRUCTIVO_SYSTEM,
  NEXO_CRITICO_SYSTEM,
  NEXO_SYNTHESIS_SYSTEM,
  NEXO_SECTION_WRITER_SYSTEM,
} from '@/lib/prompts'
import { getQuestionsForDocument, CanonicalQuestion } from '@/lib/session-questions'

type Admin = ReturnType<typeof createAdminClient>

export interface GeneratedSection {
  section_name: string
  content: string
  key_points: string[]
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await req.json()
    const { action, projectId } = body

    const { data: project } = await supabase
      .from('projects').select('*').eq('id', projectId).eq('user_id', user.id).single()
    if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

    const admin = createAdminClient()

    switch (action) {
      case 'start':   return await handleStart(admin, project)
      case 'debate':  return await handleDebate(admin, body)
      case 'resolve': return await handleResolve(admin, project, body)
      case 'approve': return await handleApprove(admin, project, body)
      default: return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
    }
  } catch (err) {
    console.error('[session/turn]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// ─── Start Session ────────────────────────────────────────────────────────────

async function handleStart(admin: Admin, project: { id: string; founder_brief: string }) {
  const { data: documents } = await admin
    .from('project_documents')
    .select('*, document_specs(*)')
    .eq('project_id', project.id)
    .order('generated_at', { ascending: true, nullsFirst: true })

  if (!documents?.length) {
    return NextResponse.json({ error: 'No hay documentos configurados' }, { status: 400 })
  }

  const { data: session } = await admin.from('sessions').insert({
    project_id: project.id,
    status: 'activa',
    mode: 'normal',
    current_document_index: 0,
    current_question_index: 0,
    total_documents: documents.length,
  }).select().single()

  if (!session) return NextResponse.json({ error: 'Error creando sesión' }, { status: 500 })

  const firstDoc = documents[0]
  const questions = await generateQuestions(project.founder_brief, firstDoc)

  const phasesData = documents.map((doc, i) => ({
    session_id: session.id,
    document_id: doc.id,
    phase_index: i,
    status: i === 0 ? 'en_progreso' : 'pendiente',
    questions: i === 0 ? questions : [],
    momentum: { total_questions: i === 0 ? questions.length : 0, resolved: 0, constructivo_count: 0, critico_count: 0 },
    started_at: i === 0 ? new Date().toISOString() : null,
  }))

  const { data: phases } = await admin.from('session_phases').insert(phasesData).select()

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

async function handleDebate(admin: Admin, body: {
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

  const [constructiveContent, criticalContent] = await Promise.all([
    callClaude(NEXO_CONSTRUCTIVO_SYSTEM, [{ role: 'user', content: context }], 4096),
    callClaude(NEXO_CRITICO_SYSTEM, [{ role: 'user', content: context }], 4096),
  ])

  let agreement = false
  let synthesis: string | null = null

  try {
    const synthesisContext = `Perspectiva Constructiva:\n${constructiveContent}\n\nPerspectiva Crítica:\n${criticalContent}`
    const synthesisRaw = await callClaude(
      NEXO_SYNTHESIS_SYSTEM,
      [{ role: 'user', content: synthesisContext }],
      2048,
      'claude-haiku-4-5-20251001'
    )
    const clean = synthesisRaw.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '')
    const parsed = JSON.parse(clean)
    agreement = parsed.agreement === true
    synthesis = parsed.synthesis ?? null
  } catch {
    agreement = false
  }

  const { data: nexoResponse } = await admin.from('nexo_dual_responses').insert({
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

async function handleResolve(admin: Admin, project: { id: string; founder_brief: string }, body: {
  sessionId: string
  phaseId: string
  responseId: string
  questionIndex: number
  resolution: 'constructiva' | 'critico' | 'responder_yo' | 'acuerdo' | 'find_common_ground'
  founderResponse?: string
  constructiveContent?: string
  criticalContent?: string
  synthesis?: string
  question?: string
  documentId?: string
  documentName?: string
  specSections?: { nombre: string; descripcion: string }[]
  previousSections?: GeneratedSection[]
}) {
  const { sessionId, phaseId, responseId, questionIndex, resolution, founderResponse } = body

  // Record resolution
  await admin.from('nexo_dual_responses').update({
    resolution,
    founder_response: founderResponse ?? null,
  }).eq('id', responseId)

  // Get current phase
  const { data: phase } = await admin
    .from('session_phases').select('*').eq('id', phaseId).single()
  if (!phase) return NextResponse.json({ error: 'Fase no encontrada' }, { status: 404 })

  // Update momentum + mark question as resolved
  const momentum = { ...(phase.momentum ?? {}) }
  momentum.resolved = (momentum.resolved ?? 0) + 1
  if (resolution === 'constructiva' || resolution === 'acuerdo') {
    momentum.constructivo_count = (momentum.constructivo_count ?? 0) + 1
  } else if (resolution === 'critico') {
    momentum.critico_count = (momentum.critico_count ?? 0) + 1
  } else if (resolution === 'find_common_ground') {
    momentum.constructivo_count = (momentum.constructivo_count ?? 0) + 1
    momentum.critico_count = (momentum.critico_count ?? 0) + 1
  }

  const questions = [...(phase.questions ?? [])]
  if (questions[questionIndex]) {
    questions[questionIndex] = { ...questions[questionIndex], resolucion: resolution }
  }

  // Generate section content for this question
  const resolutionContent = resolution === 'responder_yo'
    ? (founderResponse ?? '')
    : resolution === 'critico'
      ? (body.criticalContent ?? '')
      : resolution === 'find_common_ground'
        ? (body.synthesis ?? `${body.constructiveContent ?? ''}\n\n${body.criticalContent ?? ''}`)
        : (body.synthesis ?? body.constructiveContent ?? '')

  const generatedSection = await generateSection({
    founderBrief: project.founder_brief,
    question: body.question ?? questions[questionIndex]?.pregunta ?? '',
    resolution,
    resolutionContent,
    documentName: body.documentName ?? '',
    sectionSpec: body.specSections?.[questionIndex] ?? null,
    previousSections: body.previousSections ?? [],
  })

  // Update project_documents.content_json
  if (body.documentId && generatedSection) {
    await upsertDocumentSection(admin, body.documentId, generatedSection)
  }

  const nextQuestionIndex = questionIndex + 1
  const phaseComplete = nextQuestionIndex >= questions.length

  if (phaseComplete) {
    // Mark phase as completada — DO NOT advance yet (user must approve doc first)
    await admin.from('session_phases').update({
      status: 'completada',
      questions,
      momentum,
      completed_at: new Date().toISOString(),
    }).eq('id', phaseId)

    // Mark doc as generado (not approved yet)
    if (phase.document_id) {
      await admin.from('project_documents')
        .update({ status: 'generado', generated_at: new Date().toISOString() })
        .eq('id', phase.document_id)
    }

    return NextResponse.json({
      phaseComplete: true,
      documentId: phase.document_id,
      phaseIndex: phase.phase_index,
      generatedSection,
    })
  }

  // Advance within same phase
  await admin.from('session_phases').update({ questions, momentum }).eq('id', phaseId)
  await admin.from('sessions').update({ current_question_index: nextQuestionIndex }).eq('id', sessionId)

  return NextResponse.json({
    phaseComplete: false,
    nextQuestionIndex,
    nextQuestion: questions[nextQuestionIndex]?.pregunta ?? null,
    generatedSection,
  })
}

// ─── Approve Document & Advance ───────────────────────────────────────────────

async function handleApprove(admin: Admin, project: { id: string; founder_brief: string }, body: {
  sessionId: string
  documentId: string
  phaseIndex: number
}) {
  const { sessionId, documentId, phaseIndex } = body

  // Detect and fill missing sections before approving
  const { data: docData } = await admin
    .from('project_documents')
    .select('content_json, document_specs(*)')
    .eq('id', documentId)
    .single()

  const specSections: Array<{ nombre: string; descripcion: string }> = (docData?.document_specs as any)?.sections ?? []
  const existingSections: GeneratedSection[] = (docData?.content_json as any)?.sections ?? []
  const existingNames = new Set(existingSections.map((s: GeneratedSection) => s.section_name))

  const missingSections = specSections.filter(s => !existingNames.has(s.nombre))
  if (missingSections.length > 0) {
    const founderBrief = project.founder_brief ?? ''
    const docName = (docData?.document_specs as any)?.name ?? ''
    for (const spec of missingSections) {
      const generated = await generateSection({
        founderBrief,
        question: `Completa la sección "${spec.nombre}" del documento "${docName}"`,
        resolution: 'acuerdo',
        resolutionContent: spec.descripcion,
        documentName: docName,
        sectionSpec: spec,
        previousSections: existingSections,
      })
      if (generated) {
        existingSections.push(generated)
        await upsertDocumentSection(admin, documentId, generated)
      }
    }
  }

  // Mark document as approved
  await admin.from('project_documents')
    .update({ status: 'aprobado', approved_at: new Date().toISOString() })
    .eq('id', documentId)

  const nextDocIndex = phaseIndex + 1

  // Look for next phase
  const { data: nextPhase } = await admin
    .from('session_phases')
    .select('*, project_documents(*, document_specs(*))')
    .eq('session_id', sessionId)
    .eq('phase_index', nextDocIndex)
    .maybeSingle()

  if (!nextPhase) {
    // All phases done — session complete
    await admin.from('sessions').update({
      status: 'completada',
      completed_at: new Date().toISOString(),
    }).eq('id', sessionId)
    await admin.from('projects')
      .update({ current_phase: 'completado', last_active_at: new Date().toISOString() })
      .eq('id', project.id)
    return NextResponse.json({ sessionComplete: true })
  }

  // Generate questions for next phase
  const nextDoc = (nextPhase as any).project_documents
  const nextQuestions = await generateQuestions(project.founder_brief, nextDoc)

  await admin.from('session_phases').update({
    status: 'en_progreso',
    questions: nextQuestions,
    momentum: { total_questions: nextQuestions.length, resolved: 0, constructivo_count: 0, critico_count: 0 },
    started_at: new Date().toISOString(),
  }).eq('id', nextPhase.id)

  await admin.from('sessions').update({
    current_document_index: nextDocIndex,
    current_question_index: 0,
  }).eq('id', sessionId)

  return NextResponse.json({
    nextPhaseId: nextPhase.id,
    nextQuestion: nextQuestions[0]?.pregunta ?? null,
    nextDocumentName: nextDoc?.name ?? '',
    nextDocumentIndex: nextDocIndex,
    totalQuestions: nextQuestions.length,
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function generateQuestions(
  founderBrief: string,
  document: any
): Promise<Array<{ pregunta: string; resolucion: null }>> {
  const docName = document?.document_specs?.name ?? document?.name ?? ''
  const predefined = getQuestionsForDocument(docName)

  if (predefined && predefined.length > 0) {
    return await adaptQuestionsToContext(predefined, founderBrief, docName)
  }

  // Fallback: Claude generates questions
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

Genera exactamente 6 preguntas estratégicas para extraer la información necesaria para construir este documento.
Las preguntas deben ser específicas al contexto del founder descrito arriba, no genéricas.
Deben cubrir TODAS las secciones del documento listadas arriba y girar alrededor del problema y solución específica del founder.
Responde SOLO con un JSON array de 6 strings.`

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
      return parsed.slice(0, 6).map(q => ({ pregunta: String(q), resolucion: null }))
    }
  } catch {
    // fallback below
  }

  return [
    { pregunta: `¿Cuál es la propuesta central del "${document?.name ?? 'documento'}" para tu proyecto?`, resolucion: null },
    { pregunta: '¿Qué problema específico resuelves y para quién exactamente?', resolucion: null },
    { pregunta: '¿Qué diferencia tu propuesta de las alternativas que ya existen en el mercado?', resolucion: null },
    { pregunta: '¿Cuál es el perfil detallado de tu cliente ideal y cómo llega a tu solución?', resolucion: null },
    { pregunta: '¿Qué métricas de éxito usarías para validar que estás resolviendo el problema correctamente?', resolucion: null },
    { pregunta: '¿Cuáles son los 3 riesgos principales y cómo los mitigarías desde el inicio?', resolucion: null },
  ]
}

async function adaptQuestionsToContext(
  questions: CanonicalQuestion[],
  founderBrief: string,
  documentName: string
): Promise<Array<{ pregunta: string; resolucion: null }>> {
  const questionsList = questions
    .map((q, i) => `${i + 1}. [${q.section}] ${q.question}`)
    .join('\n')

  const prompt = `Tienes estas preguntas estratégicas canónicas para el documento "${documentName}":
${questionsList}

Resumen del Fundador:
${founderBrief ?? 'No disponible'}

Adapta cada pregunta al contexto específico del founder manteniendo EXACTAMENTE el mismo enfoque estratégico.
Usa el contexto del founder (industria, producto, cliente específico) para hacer las preguntas más precisas y relevantes.
No cambies el propósito estratégico de ninguna pregunta. Solo personaliza el lenguaje al contexto del proyecto.
Responde SOLO con un JSON array de ${questions.length} strings (las preguntas adaptadas, en el mismo orden).`

  try {
    const response = await callClaude(
      NEXO_SESSION_QUESTION_SYSTEM,
      [{ role: 'user', content: prompt }],
      600,
      'claude-haiku-4-5-20251001'
    )
    const clean = response.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '')
    const parsed = JSON.parse(clean)
    if (Array.isArray(parsed) && parsed.length === questions.length) {
      return parsed.map(q => ({ pregunta: String(q), resolucion: null }))
    }
  } catch {
    // fallback: use predefined questions as-is
  }

  return questions.map(q => ({ pregunta: q.question, resolucion: null }))
}

async function generateSection(args: {
  founderBrief: string
  question: string
  resolution: string
  resolutionContent: string
  documentName: string
  sectionSpec: { nombre: string; descripcion: string } | null
  previousSections: GeneratedSection[]
}): Promise<GeneratedSection | null> {
  const { founderBrief, question, resolution, resolutionContent, documentName, sectionSpec, previousSections } = args

  const previousContext = previousSections.length > 0
    ? `\n\nCONTEXTO DE SECCIONES YA GENERADAS (mantén coherencia con estas):\n${previousSections.map(s => `### ${s.section_name}\n${s.content.slice(0, 600)}`).join('\n\n')}`
    : ''

  const prompt = `DOCUMENTO: ${documentName}
SECCIÓN A GENERAR: ${sectionSpec?.nombre ?? 'Sección principal'}
DESCRIPCIÓN DE LA SECCIÓN: ${sectionSpec?.descripcion ?? 'Contenido relevante para el documento'}

RESUMEN DEL FUNDADOR:
${founderBrief ?? 'No disponible'}

DEBATE ESTRATÉGICO RESUELTO:
Pregunta: ${question}
Posición elegida: ${resolution}
Perspectiva seleccionada (úsala como fuente principal):
${resolutionContent}${previousContext}

INSTRUCCIONES:
- Genera el contenido de la sección "${sectionSpec?.nombre ?? 'Sección principal'}" del documento "${documentName}"
- Mínimo 300 palabras de contenido sustantivo
- Integra la perspectiva del debate con el contexto del founder
- Usa los datos, nombres y contexto específico del proyecto del founder
- El contenido debe ser accionable y específico, no genérico`

  try {
    const raw = await callClaude(
      NEXO_SECTION_WRITER_SYSTEM,
      [{ role: 'user', content: prompt }],
      8192,
      'claude-haiku-4-5-20251001'
    )
    const clean = raw.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '')
    const parsed = JSON.parse(clean) as GeneratedSection
    if (parsed.section_name && parsed.content) return parsed
  } catch {
    // fallback below
  }

  return {
    section_name: sectionSpec?.nombre ?? 'Sección principal',
    content: resolutionContent.slice(0, 800),
    key_points: [],
  }
}

async function upsertDocumentSection(
  admin: Admin,
  documentId: string,
  newSection: GeneratedSection
): Promise<void> {
  try {
    const { data: doc } = await admin
      .from('project_documents')
      .select('content_json')
      .eq('id', documentId)
      .single()

    const current = (doc?.content_json as { sections?: GeneratedSection[] } | null) ?? { sections: [] }
    const sections: GeneratedSection[] = current.sections ?? []

    const idx = sections.findIndex(s => s.section_name === newSection.section_name)
    if (idx >= 0) {
      sections[idx] = newSection
    } else {
      sections.push(newSection)
    }

    await admin.from('project_documents').update({
      content_json: { sections },
      status: 'en_progreso',
    }).eq('id', documentId)
  } catch (err) {
    console.error('[upsertDocumentSection]', err)
  }
}
