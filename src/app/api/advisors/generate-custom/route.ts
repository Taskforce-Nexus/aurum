import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callClaude } from '@/lib/claude'
import { GENERATE_ADVISOR_PROMPT, ELEMENT_DESCRIPTIONS, HAT_DESCRIPTIONS } from '@/lib/prompts'

const GENERATE_PROFILE_SYSTEM = `Eres un generador de perfiles de consejeros para una plataforma de ventures.
El usuario describe qué tipo de experto necesita. Tu tarea es crear un perfil completo y realista para ese advisor.

Responde ÚNICAMENTE con JSON válido, sin texto adicional:
{
  "name": "Nombre completo realista y culturalmente apropiado para LATAM",
  "specialty": "Especialidad específica (ej: Regulación Fintech Colombia, IA Generativa Enterprise)",
  "category": "Una de: estrategia | finanzas | legal | marketing | ventas | producto | tecnologia | operaciones | industria",
  "element": "Una de: fuego | agua | tierra | aire",
  "hats": ["negro", "verde"],
  "communication_style": "Directo y analítico. Una frase describiendo su estilo.",
  "bio": "2-3 oraciones sobre su trayectoria, empresas donde trabajó, logros específicos.",
  "specialties_tags": ["tag1", "tag2", "tag3"],
  "industries_tags": ["industria1", "industria2"]
}

Reglas:
- El nombre debe sonar real y latinoamericano (o del país del dominio si aplica)
- La especialidad debe ser MUY específica, no genérica
- Los hats: máximo 3, elegir los más relevantes (negro=riesgos, verde=creatividad, blanco=datos, amarillo=optimismo, rojo=intuición, azul=proceso)
- El bio debe mencionar empresas o instituciones reales del sector`

export async function POST(req: NextRequest) {
  const { project_id, description } = await req.json()

  if (!project_id || !description) {
    return NextResponse.json({ error: 'project_id and description required' }, { status: 400 })
  }
  if (description.length < 10 || description.length > 500) {
    return NextResponse.json({ error: 'description must be 10–500 characters' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = createAdminClient()

  // 1. Generate advisor profile with Sonnet
  let profile: Record<string, unknown>
  try {
    const raw = await callClaude({
      system: GENERATE_PROFILE_SYSTEM,
      messages: [{ role: 'user', content: `Necesito un experto: ${description}` }],
      max_tokens: 1024,
      tier: 'strong',
    })
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    profile = JSON.parse(jsonMatch[0])
  } catch (e) {
    const err = e as Error
    return NextResponse.json({ error: `Profile generation failed: ${err.message}` }, { status: 502 })
  }

  // 2. Insert advisor into DB
  const { data: advisor, error: insertErr } = await admin
    .from('advisors')
    .insert({
      name: profile.name,
      specialty: profile.specialty,
      advisor_type: profile.category,
      element: profile.element,
      hats: profile.hats,
      communication_style: profile.communication_style,
      bio: profile.bio,
      specialties_tags: profile.specialties_tags,
      industries_tags: profile.industries_tags,
      is_native: false,
      language: 'Español',
    })
    .select()
    .single()

  if (insertErr || !advisor) {
    return NextResponse.json({ error: insertErr?.message ?? 'Insert failed' }, { status: 500 })
  }

  // 3. Generate deep system_prompt with the existing generate-prompt logic (Haiku, fast)
  try {
    const elementDesc = advisor.element ? (ELEMENT_DESCRIPTIONS[advisor.element as string] ?? '') : ''
    const hats = (advisor.hats as string[] ?? [])
    const hatsDesc = hats.map((h: string) => `${h} (${HAT_DESCRIPTIONS[h] ?? h})`).join(', ')

    const metaPrompt = GENERATE_ADVISOR_PROMPT
      .replace('{name}', advisor.name ?? '')
      .replace('{specialty}', advisor.specialty ?? '')
      .replace('{category}', (advisor.advisor_type as string) ?? '')
      .replace('{element}', (advisor.element as string) ?? '')
      .replace('{element_description}', elementDesc)
      .replace('{communication_style}', (advisor.communication_style as string) ?? '')
      .replace('{hats_description}', hatsDesc)
      .replace('{bio}', (advisor.bio as string) ?? '')
      .replace('{specialties_tags}', JSON.stringify(advisor.specialties_tags ?? []))
      .replace('{industries_tags}', JSON.stringify(advisor.industries_tags ?? []))
      .replace('{experience}', '[]')
      .replace('{language}', 'Español')

    const systemPrompt = await callClaude({
      system: metaPrompt,
      messages: [{ role: 'user', content: 'Genera el system prompt para este consejero.' }],
      max_tokens: 8192,
      tier: 'fast',
    })

    await admin.from('advisors').update({ system_prompt: systemPrompt }).eq('id', advisor.id)
    advisor.system_prompt = systemPrompt
  } catch (e) {
    console.error('[generate-custom] system_prompt generation failed (non-blocking):', e)
  }

  // 4. Add advisor to project's council
  const { data: council } = await admin
    .from('councils')
    .select('id')
    .eq('project_id', project_id)
    .single()

  if (council) {
    await admin.from('council_advisors').insert({
      council_id: council.id,
      advisor_id: advisor.id,
      level: 'lidera',
      participation_pct: 0.2,
    })
  }

  return NextResponse.json({ advisor, council_id: council?.id ?? null })
}
