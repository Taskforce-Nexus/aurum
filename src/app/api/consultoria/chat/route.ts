import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaude } from '@/lib/claude'
import { NEXO_CONSULTORIA_SYSTEM } from '@/lib/prompts'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await req.json()
    const { projectId, consultationId, message, createOnly } = body

    if (!projectId || !message) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    // Verify project ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id, founder_brief, current_phase')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    if (project.current_phase !== 'completado') {
      return NextResponse.json({ error: 'Sesión de Consejo no completada' }, { status: 403 })
    }

    // Get or create consultation
    let consultation = null
    if (consultationId) {
      const { data } = await supabase
        .from('consultations')
        .select('*')
        .eq('id', consultationId)
        .eq('project_id', projectId)
        .single()
      consultation = data
    }

    if (!consultation) {
      const title = createOnly
        ? message
        : `Consulta ${new Date().toLocaleDateString('es', { month: 'short', day: 'numeric' })}`
      const { data } = await supabase
        .from('consultations')
        .insert({ project_id: projectId, title, messages: [], status: 'activa' })
        .select()
        .single()
      consultation = data
    }

    if (createOnly) {
      return NextResponse.json({ consultation })
    }

    if (!consultation) return NextResponse.json({ error: 'Error creando consulta' }, { status: 500 })

    // Fetch approved documents for context
    const { data: documents } = await supabase
      .from('project_documents')
      .select('name, content_json')
      .eq('project_id', projectId)
      .in('status', ['aprobado', 'generado'])

    // Fetch council advisors
    const { data: council } = await supabase
      .from('councils')
      .select('id')
      .eq('project_id', projectId)
      .maybeSingle()

    let advisors: Array<{ id: string; name: string; specialty: string | null; category: string | null }> = []
    if (council) {
      const { data: councilAdvisors } = await supabase
        .from('council_advisors')
        .select('advisors(id, name, specialty, category)')
        .eq('council_id', council.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      advisors = (councilAdvisors ?? []).map((ca: any) => ca.advisors).filter(Boolean)
    }

    // Build context
    const docsContext = (documents ?? [])
      .map(d => {
        const sections = d.content_json?.sections ?? []
        if (sections.length === 0) return null
        return `## ${d.name}\n${sections.map((s: { section_name: string; content: string }) => `### ${s.section_name}\n${s.content.slice(0, 400)}`).join('\n')}`
      })
      .filter(Boolean)
      .join('\n\n')

    const advisorsContext = advisors
      .map(a => `- ${a.name}: ${a.specialty ?? a.category ?? 'Generalista'}`)
      .join('\n')

    const historyContext = (consultation.messages as Array<{ role: string; content: string; advisor_name?: string }> ?? [])
      .slice(-6)
      .map(m => {
        const sender = m.role === 'user' ? 'Founder' : m.advisor_name ?? 'Nexo'
        return `${sender}: ${m.content.slice(0, 300)}`
      })
      .join('\n')

    const prompt = `RESUMEN DEL FUNDADOR:
${project.founder_brief ?? 'No disponible'}

CONSEJEROS DEL CONSEJO:
${advisorsContext || 'Consejo general'}

DOCUMENTOS APROBADOS:
${docsContext || 'Sin documentos aprobados aún'}

HISTORIAL DE LA CONSULTA:
${historyContext || 'Primera pregunta de la consulta'}

PREGUNTA DEL FOUNDER:
${message}

Selecciona 2-3 consejeros relevantes del consejo y responde según el formato JSON indicado.`

    const raw = await callClaude(
      NEXO_CONSULTORIA_SYSTEM,
      [{ role: 'user', content: prompt }],
      1200
    )

    const clean = raw.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let responses: any[] = []
    try {
      responses = JSON.parse(clean)
    } catch {
      responses = [{ role: 'nexo', content: raw }]
    }

    // Save messages to consultation
    const userMsg = { role: 'user', content: message, timestamp: new Date().toISOString() }
    const aiMsgs = responses.map((r: { role: string; content: string; advisor_name?: string; specialty?: string; advisor_id?: string }) => ({
      ...r,
      timestamp: new Date().toISOString(),
    }))
    const allNewMsgs = [userMsg, ...aiMsgs]
    const updatedMessages = [...(consultation.messages ?? []), ...allNewMsgs]

    await supabase
      .from('consultations')
      .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
      .eq('id', consultation.id)

    return NextResponse.json({ responses, consultation })
  } catch (err) {
    console.error('[consultoria/chat]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
