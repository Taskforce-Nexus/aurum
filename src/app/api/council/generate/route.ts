import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserPlan } from '@/lib/plan'
import { PLAN_LIMITS } from '@/lib/stripe'
import { getModel } from '@/lib/model-router'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const GENERATE_COUNCIL_PROMPT = `Eres Nexo. Analiza este proyecto y genera el consejo asesor PERFECTO.

PROYECTO:
Nombre: {name}
Descripción: {description}
Propósito del consejo: {purpose}

RESUMEN DEL FUNDADOR:
{founder_brief}

PERFIL DEL VENTURE:
{venture_profile}

Genera exactamente {maxAdvisors} consejeros. Cada uno debe ser ESPECÍFICO para este proyecto.

Para cada consejero, genera un objeto con estos campos:
- name: Nombre realista hispano o internacional según la industria
- specialty: Especialidad específica relevante al proyecto (no genérica)
- category: negocio | ux_producto | tecnico | investigacion | precios
- advisor_type: estrategia | finanzas | marketing | ventas | producto | tecnologia | legal | operaciones | industria
- element: fuego | agua | tierra | aire
- communication_style: Descripción de 1 línea
- hats: array de 2-3 sombreros de: blanco, rojo, negro, amarillo, verde, azul
- bio: Bio de 2-3 oraciones relevante al proyecto
- specialties_tags: array de 3-5 tags específicos
- industries_tags: array de 2-3 industrias relevantes al proyecto
- experience: array de 3-4 logros concretos con métricas
- language: "Español" o "Español · Inglés técnico"
- reason: Por qué este consejero es CRÍTICO para este proyecto específico (1-2 oraciones)

REGLAS:
- No genéricos. Si el proyecto es fintech en México, genera un experto en regulación fintech mexicana, no "abogado generalista"
- Si el proyecto es de comida, genera alguien de la industria alimentaria, no "estrategia genérica"
- Nombres creíbles y culturalmente diversos
- Diversidad de áreas: no 3 de marketing. Cubrir negocio, finanzas, y dominio específico del venture
- Cada "reason" explica qué aporta a ESTE proyecto
- Si no hay founder_brief o venture_profile, infiere del nombre y descripción del proyecto

Retorna ÚNICAMENTE un JSON array. Nada más, sin markdown, sin explicaciones.`

const SYSTEM_PROMPT_PROMPT = `Genera un system prompt para un consejero IA en español.

El consejero:
Nombre: {name}
Especialidad: {specialty}
Elemento: {element}
Estilo: {communication_style}
Bio: {bio}

El system prompt debe:
1. Definir la identidad y voz del consejero (2-3 párrafos)
2. Establecer su área de expertise específica con el proyecto
3. Definir cómo interviene según su elemento ({element}):
   - fuego: directo, orientado a la acción, confronta, empuja decisiones
   - agua: empático, busca consenso, valida emociones, propone alternativas suaves
   - tierra: analítico, basado en datos, pragmático, ancla en números
   - aire: visionario, conecta ideas, piensa en grande, desafía supuestos
4. Definir sus 3-5 preguntas tipo que siempre hace en debates
5. Establecer en qué momento interviene y en qué no

Extensión: 800-1200 palabras. Solo el prompt, sin introducción ni cierre.`

async function generateSystemPromptsInBackground(
  admin: ReturnType<typeof createAdminClient>,
  advisorIds: string[]
): Promise<void> {
  // Process 3 concurrent workers
  for (let i = 0; i < advisorIds.length; i += 3) {
    const batch = advisorIds.slice(i, i + 3)
    await Promise.all(batch.map(async (id) => {
      try {
        const { data: advisor } = await admin
          .from('advisors')
          .select('name, specialty, element, communication_style, bio')
          .eq('id', id)
          .single()

        if (!advisor) return

        const element = advisor.element ?? 'tierra'
        const prompt = SYSTEM_PROMPT_PROMPT
          .replace('{name}', advisor.name ?? '')
          .replace('{specialty}', advisor.specialty ?? '')
          .replace(/{element}/g, element)
          .replace('{communication_style}', advisor.communication_style ?? '')
          .replace('{bio}', advisor.bio ?? '')

        const response = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt }],
        })

        const systemPrompt = response.content[0].type === 'text' ? response.content[0].text : ''
        if (systemPrompt) {
          await admin.from('advisors').update({ system_prompt: systemPrompt }).eq('id', id)
        }
      } catch (err) {
        console.error('[COUNCIL/GENERATE] Prompt gen failed for', id, err)
      }
    }))
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { project_id } = await req.json()
  if (!project_id) return NextResponse.json({ error: 'project_id required' }, { status: 400 })

  // Verify project ownership
  const { data: project } = await supabase
    .from('projects')
    .select('name, description, purpose, founder_brief, venture_profile')
    .eq('id', project_id)
    .eq('user_id', user.id)
    .single()

  if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

  const admin = createAdminClient()

  // If council already has advisors, return existing
  const { data: existingCouncil } = await admin
    .from('councils')
    .select('id, council_advisors(id, advisors(*))')
    .eq('project_id', project_id)
    .maybeSingle()

  if (existingCouncil) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = ((existingCouncil as any).council_advisors ?? []).map((ca: any) => ({
      ...(ca.advisors ?? {}),
    }))
    if (existing.length >= 3) {
      return NextResponse.json({ council_id: existingCouncil.id, advisors: existing })
    }
  }

  // Get plan limits + model
  const plan = await getUserPlan(user.id)
  const maxAdvisors = (PLAN_LIMITS[plan] ?? PLAN_LIMITS['free']).advisors_per_session
  const model = getModel(plan, 'seed_chat') ?? 'claude-haiku-4-5-20251001'

  // Build the prompt
  const founderBrief = project.founder_brief
    ? (typeof project.founder_brief === 'string' ? project.founder_brief : JSON.stringify(project.founder_brief))
    : 'No disponible'
  const ventureProfile = project.venture_profile
    ? (typeof project.venture_profile === 'string' ? project.venture_profile : JSON.stringify(project.venture_profile))
    : 'No disponible'

  const prompt = GENERATE_COUNCIL_PROMPT
    .replace('{name}', project.name ?? 'Sin nombre')
    .replace('{description}', project.description ?? 'Sin descripción')
    .replace('{purpose}', project.purpose ?? 'Consejo estratégico')
    .replace('{founder_brief}', founderBrief.slice(0, 2000))
    .replace('{venture_profile}', ventureProfile.slice(0, 2000))
    .replace('{maxAdvisors}', String(maxAdvisors))

  // Call Claude to generate custom advisors
  let generatedAdvisors: Record<string, unknown>[] = []
  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      generatedAdvisors = JSON.parse(jsonMatch[0])
    }
  } catch (err) {
    console.error('[COUNCIL/GENERATE] Claude error:', err)
    return NextResponse.json({ error: 'Error generando consejo' }, { status: 500 })
  }

  if (!generatedAdvisors.length) {
    return NextResponse.json({ error: 'No se generaron consejeros' }, { status: 500 })
  }

  // Insert advisors into DB (not native — project-specific, no level field)
  const rows = generatedAdvisors.slice(0, maxAdvisors).map(a => ({
    name: a.name as string,
    specialty: a.specialty as string,
    category: a.category as string,
    advisor_type: a.advisor_type as string,
    element: a.element as string,
    communication_style: a.communication_style as string,
    hats: (a.hats as string[]) ?? [],
    bio: a.bio as string,
    specialties_tags: (a.specialties_tags as string[]) ?? [],
    industries_tags: (a.industries_tags as string[]) ?? [],
    experience: (a.experience as string[]) ?? [],
    language: (a.language as string) ?? 'Español',
    is_native: false,
  }))

  const { data: insertedAdvisors, error: insertErr } = await admin
    .from('advisors')
    .insert(rows)
    .select()

  if (insertErr || !insertedAdvisors?.length) {
    console.error('[COUNCIL/GENERATE] Insert error:', insertErr)
    return NextResponse.json({ error: 'Error guardando consejeros' }, { status: 500 })
  }

  // Create or reuse council
  let councilId: string
  if (existingCouncil) {
    councilId = existingCouncil.id
    await admin.from('council_advisors').delete().eq('council_id', councilId)
  } else {
    const { data: newCouncil } = await admin
      .from('councils')
      .insert({ project_id, status: 'configurando' })
      .select('id')
      .single()
    councilId = newCouncil!.id
  }

  // Link advisors to council (level kept as 'apoya' to satisfy DB constraint — not shown in UI)
  await admin.from('council_advisors').insert(
    insertedAdvisors.map((a) => ({
      council_id: councilId,
      advisor_id: a.id,
      level: 'apoya',
    }))
  )

  // Build response — include reason from generated data
  const advisorsWithReason = insertedAdvisors.map((a, i) => ({
    ...a,
    reason: generatedAdvisors[i]?.reason as string ?? null,
  }))

  // Fire-and-forget: generate system prompts in background (3 concurrent workers)
  const advisorIds = insertedAdvisors.map(a => a.id)
  generateSystemPromptsInBackground(admin, advisorIds).catch(err =>
    console.error('[COUNCIL/GENERATE] Background prompt generation failed:', err)
  )

  return NextResponse.json({ council_id: councilId, advisors: advisorsWithReason })
}
