import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaude } from '@/lib/claude'
import { checkBalance, trackUsage } from '@/lib/usage'

const SPECIALIST_SYSTEM = `Eres Nexo, el consejero IA de Reason. Generas propuestas de especialistas de industria relevantes para un proyecto específico.

Cuando te pidan generar UN especialista, responde SOLO con un JSON object:
{
  "id": "esp-<timestamp>",
  "name": "Nombre descriptivo del ROL (ej: 'Especialista en Retail Digital')",
  "specialty": "Área de especialización concreta",
  "justification": "2-3 oraciones explicando por qué este especialista es relevante para el proyecto específico."
}

Cuando te pidan generar VARIOS especialistas, responde SOLO con un JSON array:
[
  { "id": "esp-1", "name": "...", "specialty": "...", "justification": "..." },
  ...
]

Reglas:
- El nombre describe el ROL, no es un nombre de persona
- La justificación menciona el contexto específico del founder
- No repitas especialistas que ya existen en la lista
- Los especialistas deben ser distintos entre sí en área de expertise`

const PERSONA_SYSTEM = `Eres Nexo, el consejero IA de Reason. Generas buyer personas / ICPs ricos y detallados para un proyecto específico.

Cuando te pidan generar UNA persona, responde SOLO con un JSON object:
{
  "id": "icp-<timestamp>",
  "name": "Nombre del arquetipo (ej: 'Emprendedora Serial')",
  "archetype": "2-3 palabras que definen el arquetipo",
  "demographics": "Perfil: edad, género, NSE, ubicación, situación laboral — en una sola línea descriptiva",
  "quote": "Frase en primera persona que resume su dolor principal (entre comillas dobles)",
  "jobs_to_be_done": ["trabajo 1", "trabajo 2", "trabajo 3"],
  "pains": ["dolor específico 1", "dolor 2", "dolor 3"],
  "gains": ["ganancia que busca 1", "ganancia 2", "ganancia 3"],
  "fears_objections": ["miedo u objeción 1", "objeción 2", "objeción 3"],
  "current_alternatives": ["qué usa HOY para resolver el problema", "alternativa 2"],
  "discovery_channels": ["canal donde busca información 1", "canal 2"],
  "purchase_triggers": ["evento que lo haría comprar ahora 1", "trigger 2"],
  "decision_criteria": ["criterio de evaluación 1", "criterio 2", "criterio 3"],
  "behavior_tags": ["tag1", "tag2", "tag3"]
}

Cuando te pidan generar VARIAS personas, responde SOLO con un JSON array de objetos con el mismo schema.

Reglas:
- Cada persona es específica al contexto del founder
- La cita refleja el problema que el producto resuelve
- Los campos de lista tienen 3-5 items cada uno, concretos y específicos
- No repitas arquetipos que ya existen en la lista
- Las personas deben diferenciarse significativamente entre sí`

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { type, projectId, founderBrief, existingItems, count = 1 } = await req.json()

    if (!type || !projectId) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    const { data: project } = await supabase
      .from('projects')
      .select('id, founder_brief, name')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

    const { canProceed } = await checkBalance(user.id)
    if (!canProceed) {
      return NextResponse.json({
        error: 'Saldo insuficiente. Recarga tu saldo para continuar.',
        balance: 0,
      }, { status: 402 })
    }

    const brief = founderBrief ?? project.founder_brief ?? 'No disponible'
    const existing = existingItems ?? []
    const batchCount = Math.min(Math.max(1, count), 5)

    const existingList = existing.length > 0
      ? `\n\nYa existen en la lista:\n${existing.map((e: { name: string }) => `- ${e.name}`).join('\n')}`
      : ''

    const countPhrase = batchCount === 1
      ? (type === 'specialist' ? 'UN nuevo especialista' : 'UNA nueva buyer persona')
      : `${batchCount} ${type === 'specialist' ? 'especialistas distintos' : 'buyer personas distintas'}`

    const prompt = type === 'specialist'
      ? `Proyecto del founder — ${project.name}:\n${brief}${existingList}\n\nGenera ${countPhrase} de industria relevante${batchCount > 1 ? 's' : ''} para este proyecto.`
      : `Proyecto del founder — ${project.name}:\n${brief}${existingList}\n\nGenera ${countPhrase} relevante${batchCount > 1 ? 's' : ''} para este proyecto.`

    const system = type === 'specialist' ? SPECIALIST_SYSTEM : PERSONA_SYSTEM

    const maxTokens = batchCount === 1 ? 600 : 4000

    const raw = await callClaude({
      system,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      tier: 'fast',
    })

    const operation = type === 'specialist' ? 'generate_specialist' : 'generate_persona'
    try { await trackUsage(user.id, projectId, operation) } catch (e) { console.error('Usage tracking failed:', e) }

    // Strip markdown code fences if present
    const clean = raw.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim()

    if (batchCount > 1) {
      // Expect JSON array
      const jsonMatch = clean.match(/\[[\s\S]*\]/)
      if (!jsonMatch) return NextResponse.json({ error: 'No se pudo parsear la respuesta' }, { status: 500 })
      const items = JSON.parse(jsonMatch[0])
      // Stamp unique IDs to avoid collisions
      const stamped = items.map((item: { id?: string }, i: number) => ({
        ...item,
        id: `${type === 'specialist' ? 'esp' : 'icp'}-${Date.now()}-${i}`,
      }))
      return NextResponse.json({ items: stamped })
    } else {
      // Expect single object
      const jsonMatch = clean.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return NextResponse.json({ error: 'No se pudo parsear la respuesta' }, { status: 500 })
      const item = JSON.parse(jsonMatch[0])
      item.id = `${type === 'specialist' ? 'esp' : 'icp'}-${Date.now()}`
      return NextResponse.json({ item })
    }
  } catch (err) {
    console.error('[seed-session/generate]', err)
    return NextResponse.json({ error: 'Error generando ítem' }, { status: 500 })
  }
}
