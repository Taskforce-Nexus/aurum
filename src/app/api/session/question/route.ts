import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaude } from '@/lib/claude'
import { SESSION_QUESTION_PROMPT } from '@/lib/prompts'
import { checkBalance, trackUsage } from '@/lib/usage'

interface QuestionItem {
  section_title: string
  section_description: string
  question: string
}

interface AdvisorContribution {
  advisor_name: string
  specialty: string
  comment: string
}

interface DualResponse {
  constructive_content: string
  critical_content: string
  agreement: boolean
  advisor_contributions: AdvisorContribution[]
  section_draft: string
  next_question: string | null
}

export async function POST(req: NextRequest) {
  const { session_id, phase_id, question_index, user_response } = await req.json()

  if (!session_id || !phase_id || question_index === undefined || !user_response) {
    return NextResponse.json({ error: 'session_id, phase_id, question_index, user_response required' }, { status: 400 })
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

  // 1. Load the phase with its document
  const { data: phase, error: phaseErr } = await supabase
    .from('session_phases')
    .select('*, session:sessions(project_id)')
    .eq('id', phase_id)
    .single()

  if (phaseErr || !phase) {
    return NextResponse.json({ error: 'Phase not found' }, { status: 404 })
  }

  // 2. Load the project document (for composition)
  const { data: doc, error: docErr } = await supabase
    .from('project_documents')
    .select('name, key_question, composition')
    .eq('id', phase.document_id)
    .single()

  if (docErr || !doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  // 3. Load project founder_brief
  const projectId = (phase.session as { project_id: string })?.project_id
  const { data: project } = await supabase
    .from('projects')
    .select('founder_brief')
    .eq('id', projectId)
    .single()

  // 4. Load active advisors from council
  const { data: councils } = await supabase
    .from('councils')
    .select('id')
    .eq('project_id', projectId)
    .single()

  let activeAdvisorsText = 'Sin consejeros activos en este turno.'
  if (councils) {
    const composition = doc.composition as { advisors_needed?: string[] } | null
    const advisorsNeeded = composition?.advisors_needed ?? []

    const { data: councilAdvisors } = await supabase
      .from('council_advisors')
      .select('advisor:advisors(name, specialty, communication_style, bio)')
      .eq('council_id', councils.id)
      .limit(3)

    if (councilAdvisors && councilAdvisors.length > 0) {
      const advisorList = councilAdvisors
        .map(ca => {
          const a = ca.advisor as unknown as { name: string; specialty: string; communication_style: string; bio: string } | null
          if (!a) return null
          // Prefer advisors matching needed categories
          return `- ${a.name} (${a.specialty}): ${a.communication_style}`
        })
        .filter(Boolean)
      activeAdvisorsText = advisorList.join('\n')
    } else if (advisorsNeeded.length > 0) {
      activeAdvisorsText = `Consejeros necesarios para este entregable: ${advisorsNeeded.join(', ')}`
    }
  }

  // 5. Load previous responses in this phase
  const { data: prevResponses } = await supabase
    .from('nexo_dual_responses')
    .select('question_index, founder_response, synthesis')
    .eq('phase_id', phase_id)
    .order('question_index', { ascending: true })

  const previousResponsesText = prevResponses && prevResponses.length > 0
    ? prevResponses
        .map(r => `P${r.question_index + 1}: ${r.founder_response ?? ''}\nSíntesis: ${r.synthesis ?? ''}`)
        .join('\n\n')
    : 'Sin respuestas anteriores en esta fase.'

  // 6. Get current question context
  const questions: QuestionItem[] = (phase.questions as QuestionItem[]) ?? []
  const currentQ = questions[question_index]

  if (!currentQ) {
    return NextResponse.json({ error: `Question index ${question_index} out of bounds` }, { status: 400 })
  }

  // 7. Build the prompt with template substitution
  const systemPrompt = SESSION_QUESTION_PROMPT
    .replace('{deliverable_name}', doc.name)
    .replace('{key_question}', doc.key_question ?? '')
    .replace('{section_title}', currentQ.section_title)
    .replace('{section_description}', currentQ.section_description)
    .replace('{founder_brief}', project?.founder_brief ?? 'No disponible')
    .replace('{previous_responses}', previousResponsesText)
    .replace('{active_advisors}', activeAdvisorsText)
    .replace('{current_question}', currentQ.question)
    .replace('{user_response}', user_response)

  // 8. Call Claude with Nexo Dual (tier: strong)
  let dual: DualResponse
  try {
    const raw = await callClaude({
      system: systemPrompt,
      messages: [{ role: 'user', content: `Responde con el proceso Nexo Dual para la respuesta del usuario.` }],
      max_tokens: 2048,
      tier: 'strong',
    })
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    dual = JSON.parse(jsonMatch[0]) as DualResponse
  } catch (e) {
    const err = e as Error
    return NextResponse.json({ error: `Claude error: ${err.message}` }, { status: 502 })
  }

  try { await trackUsage(user.id, projectId, 'session_question') } catch (e) { console.error('Usage tracking failed:', e) }

  // 9. Save NexoDualResponse
  const { data: savedDual, error: dualErr } = await supabase
    .from('nexo_dual_responses')
    .insert({
      phase_id,
      question_index,
      constructive_content: dual.constructive_content,
      constructive_hat: 'verde',
      critical_content: dual.critical_content,
      critical_hat: 'negro',
      agreement: dual.agreement,
      founder_response: user_response,
    })
    .select()
    .single()

  if (dualErr) {
    return NextResponse.json({ error: dualErr.message }, { status: 500 })
  }

  // 10. Compute progress
  const totalQuestions = questions.length

  // Group questions by section to get section count
  const sectionTitles = [...new Set(questions.map(q => q.section_title))]
  const totalSections = sectionTitles.length
  const currentSectionIdx = sectionTitles.indexOf(currentQ.section_title)

  const isLastQuestion = question_index >= totalQuestions - 1
  const nextQIndex = isLastQuestion ? null : question_index + 1

  // If last question of phase, mark phase complete
  if (isLastQuestion) {
    await supabase
      .from('session_phases')
      .update({ status: 'completada', completed_at: new Date().toISOString() })
      .eq('id', phase_id)

    await supabase
      .from('project_documents')
      .update({ status: 'en_progreso' })
      .eq('id', phase.document_id)
  }

  // Update session question index
  await supabase
    .from('sessions')
    .update({ current_question_index: question_index + 1 })
    .eq('id', session_id)

  return NextResponse.json({
    dual: {
      ...dual,
      dual_response_id: savedDual.id,
      next_question_index: nextQIndex,
      next_question_text: nextQIndex !== null ? questions[nextQIndex]?.question ?? null : null,
    },
    progress: {
      current_section: currentSectionIdx + 1,
      total_sections: totalSections,
      current_question: question_index + 1,
      total_questions: totalQuestions,
      phase_complete: isLastQuestion,
    },
  })
}
