import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaude } from '@/lib/claude'

const SPECIALIST_SYSTEM = `Eres Nexo, el consejero IA de Reason. Generas propuestas de especialistas de industria relevantes para un proyecto específico.

Cuando te pidan generar un especialista, responde SOLO con un JSON object con este formato exacto:
{
  "id": "esp-<número único>",
  "name": "Nombre descriptivo del especialista (ej: 'Especialista en Retail Digital')",
  "specialty": "Área de especialización concreta",
  "justification": "2-3 oraciones explicando por qué este especialista es relevante para el proyecto específico del founder."
}

Reglas:
- El nombre debe describir el ROL, no ser un nombre de persona
- La justificación debe mencionar el contexto específico del founder
- No repitas especialistas que ya existen en la lista`

const PERSONA_SYSTEM = `Eres Nexo, el consejero IA de Reason. Generas buyer personas / ICPs relevantes para un proyecto específico.

Cuando te pidan generar una persona, responde SOLO con un JSON object con este formato exacto:
{
  "id": "icp-<número único>",
  "name": "Nombre del arquetipo (ej: 'Emprendedora Serial')",
  "archetype": "Descripción breve del arquetipo",
  "demographics": "Perfil demográfico: edad, ocupación, ingresos, contexto",
  "quote": "Una cita que captura su frustración o necesidad principal (en primera persona, entre comillas dobles)"
}

Reglas:
- La persona debe ser específica al contexto del founder
- La cita debe reflejar el problema que el producto resuelve
- No repitas arquetipos que ya existen en la lista`

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { type, projectId, founderBrief, existingItems } = await req.json()

    if (!type || !projectId) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    // Verify project ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id, founder_brief')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

    const brief = founderBrief ?? project.founder_brief ?? 'No disponible'
    const existing = existingItems ?? []

    const existingList = existing.length > 0
      ? `\n\nYa existen en la lista:\n${existing.map((e: { name: string }) => `- ${e.name}`).join('\n')}`
      : ''

    const prompt = type === 'specialist'
      ? `Proyecto del founder:\n${brief}${existingList}\n\nGenera UN nuevo especialista de industria relevante para este proyecto.`
      : `Proyecto del founder:\n${brief}${existingList}\n\nGenera UNA nueva buyer persona / ICP relevante para este proyecto.`

    const system = type === 'specialist' ? SPECIALIST_SYSTEM : PERSONA_SYSTEM

    const raw = await callClaude(system, [{ role: 'user', content: prompt }], 400, 'claude-haiku-4-5-20251001')
    const clean = raw.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '')
    const item = JSON.parse(clean)

    return NextResponse.json({ item })
  } catch (err) {
    console.error('[seed-session/generate]', err)
    return NextResponse.json({ error: 'Error generando ítem' }, { status: 500 })
  }
}
