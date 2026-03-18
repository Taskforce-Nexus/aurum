import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaude } from '@/lib/claude'
import { NEXO_CONSULTORIA_SYSTEM } from '@/lib/prompts'
import { checkBalance, trackUsage } from '@/lib/usage'

interface AdvisorResponse {
  role: 'nexo' | 'advisor'
  content: string
  advisor_id?: string
  advisor_name?: string
  specialty?: string
}

interface MessageRecord {
  role: 'user' | 'council'
  content: string
  responses?: AdvisorResponse[]
  created_at: string
}

export async function POST(req: NextRequest) {
  const { consultation_id, message } = await req.json()

  if (!consultation_id || !message) {
    return NextResponse.json({ error: 'consultation_id and message required' }, { status: 400 })
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

  // 1. Load consultation + project
  const { data: consultation, error: consultErr } = await supabase
    .from('consultations')
    .select('*, project:projects(id, name, founder_brief, user_id)')
    .eq('id', consultation_id)
    .single()

  if (consultErr || !consultation) {
    return NextResponse.json({ error: 'Consultation not found' }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const project = (consultation as any).project
  if (project?.user_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  // 2. Load council advisors for context
  const { data: councilData } = await supabase
    .from('councils')
    .select('id, council_advisors(level, advisors(id, name, specialty, background))')
    .eq('project_id', project.id)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const advisors = ((councilData as any)?.council_advisors ?? []).map((ca: any) => ({
    id: ca.advisors?.id as string,
    name: ca.advisors?.name as string,
    specialty: ca.advisors?.specialty as string | null,
    background: ca.advisors?.background as string | null,
    level: ca.level as string,
  }))

  // 3. Load approved documents for context
  const { data: approvedDocs } = await supabase
    .from('project_documents')
    .select('name, key_question, content_json')
    .eq('project_id', project.id)
    .in('status', ['generado', 'aprobado'])
    .order('deliverable_index', { ascending: true })

  // 4. Build system prompt with project context
  const advisorList = advisors.map((a: { name: string; specialty: string | null; level: string }) =>
    `- ${a.name} (${a.specialty ?? 'Asesor'}) — nivel: ${a.level}`
  ).join('\n')

  const docsContext = approvedDocs && approvedDocs.length > 0
    ? approvedDocs.map(d => `### ${d.name}\n${d.key_question}`).join('\n\n')
    : 'Sin entregables generados aún.'

  const systemWithContext = `${NEXO_CONSULTORIA_SYSTEM}

PROYECTO: ${project.name}

RESUMEN DEL FUNDADOR:
${project.founder_brief ?? 'Sin resumen disponible.'}

CONSEJO DISPONIBLE:
${advisorList || 'Sin consejeros configurados.'}

ENTREGABLES GENERADOS:
${docsContext}`

  // 5. Build message history for Claude
  const existingMessages = ((consultation as { messages?: MessageRecord[] }).messages ?? []) as MessageRecord[]
  const history: Array<{ role: 'user' | 'assistant'; content: string }> = []
  for (const m of existingMessages) {
    if (m.role === 'user') {
      history.push({ role: 'user', content: m.content })
    } else {
      const councilText = (m.responses ?? [])
        .map(r => r.role === 'nexo'
          ? `[Nexo]: ${r.content}`
          : `[${r.advisor_name ?? 'Asesor'} — ${r.specialty ?? ''}]: ${r.content}`)
        .join('\n\n')
      if (councilText) history.push({ role: 'assistant', content: councilText })
    }
  }

  const userMessage = { role: 'user' as const, content: message }

  // 6. Call Claude
  const raw = await callClaude({
    system: systemWithContext,
    messages: [...history, userMessage],
    max_tokens: 2048,
    tier: 'strong',
  })

  // 7. Parse response
  let responses: AdvisorResponse[] = []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      responses = (parsed as AdvisorResponse[])
    }
  } catch {
    responses = [{ role: 'nexo', content: raw }]
  }

  // 8. Append messages to consultation
  const newUserMsg: MessageRecord = {
    role: 'user',
    content: message,
    created_at: new Date().toISOString(),
  }
  const newCouncilMsg: MessageRecord = {
    role: 'council',
    content: '',
    responses,
    created_at: new Date().toISOString(),
  }

  const updatedMessages = [...existingMessages, newUserMsg, newCouncilMsg]

  await supabase
    .from('consultations')
    .update({ messages: updatedMessages })
    .eq('id', consultation_id)

  // 9. Track usage
  await trackUsage(user.id, project.id, 'consultation_message')

  return NextResponse.json({ responses, messages: updatedMessages })
}
