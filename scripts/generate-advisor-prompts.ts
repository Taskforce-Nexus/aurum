import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const MODEL = 'claude-haiku-4-5-20251001'

const ELEMENT_DESCRIPTIONS: Record<string, string> = {
  fuego: 'Directo y orientado a la acción. Confronta, empuja decisiones, no tolera ambigüedad. Va al punto sin rodeos.',
  agua: 'Empático y colaborativo. Busca consenso, valida emociones, propone alternativas suaves. Primero reconoce lo que funciona.',
  tierra: 'Analítico y basado en datos. Ancla en números, pide evidencia, es pragmático. Si no hay datos, lo señala.',
  aire: 'Visionario y explorador. Conecta ideas aparentemente no relacionadas, piensa en grande, desafía supuestos establecidos.',
}

const HAT_DESCRIPTIONS: Record<string, string> = {
  blanco: 'datos y hechos objetivos',
  rojo: 'emociones e intuición',
  negro: 'cautela y riesgos',
  amarillo: 'optimismo y beneficios',
  verde: 'creatividad y alternativas',
  azul: 'proceso y organización',
}

const FEW_SHOT_MAP: Record<string, string> = {
  estrategia: 'advisor_estrategia.txt',
  finanzas: 'advisor_finanzas.txt',
  legal: 'advisor_legal.txt',
  marketing: 'advisor_estrategia.txt',
  ventas: 'advisor_finanzas.txt',
  producto: 'cofounder_critico.txt',
  tecnologia: 'advisor_legal.txt',
  operaciones: 'advisor_estrategia.txt',
  industria: 'advisor_legal.txt',
}

function getFewShotExample(category: string): string {
  const filename = FEW_SHOT_MAP[category] || 'advisor_estrategia.txt'
  const filepath = path.join(__dirname, 'few-shot-examples', filename)
  return fs.readFileSync(filepath, 'utf-8')
}

function buildPromptForAdvisor(advisor: Record<string, unknown>): string {
  const fewShot = getFewShotExample(advisor.advisor_type as string || advisor.category as string || 'estrategia')
  const elementDesc = advisor.element ? (ELEMENT_DESCRIPTIONS[advisor.element as string] ?? '') : ''
  const hats = (advisor.hats as string[] ?? [])
  const hatsDesc = hats.map((h: string) => `${h} (${HAT_DESCRIPTIONS[h] ?? h})`).join(', ')

  return `Genera un system prompt para un consejero IA. El prompt debe tener la MISMA estructura, profundidad y extensión que el ejemplo de referencia.

EJEMPLO DE REFERENCIA (sigue esta estructura EXACTAMENTE — misma profundidad, mismo nivel de detalle, misma extensión):
---
${fewShot}
---

AHORA genera un prompt del MISMO calibre para este consejero:

Nombre: ${advisor.name}
Especialidad: ${advisor.specialty}
Categoría: ${advisor.advisor_type || advisor.category}
Elemento: ${advisor.element} — ${elementDesc}
Estilo de comunicación: ${advisor.communication_style}
Sombreros: ${hatsDesc}
Bio: ${advisor.bio || 'No disponible'}
Tags de especialidad: ${JSON.stringify(advisor.specialties_tags || [])}
Industrias: ${JSON.stringify(advisor.industries_tags || [])}
Experiencia: ${JSON.stringify(advisor.experience || [])}
Idioma: ${advisor.language || 'Español'}

REGLAS CRÍTICAS:
- El prompt debe tener la MISMA extensión que el ejemplo (3,000-5,000 palabras)
- Incluir conocimiento REAL del dominio: regulación específica, métricas y benchmarks con números, errores comunes con porcentajes, game theory del dominio, unknown unknowns
- NO generalidades — datos concretos y verificables
- Si la especialidad involucra regulación, incluir leyes y artículos reales
- Si involucra métricas, incluir rangos numéricos reales por industria/segmento
- El consejero habla en ${advisor.language || 'español'}

RESPONDE SOLO CON EL SYSTEM PROMPT. Sin explicaciones, sin markdown, sin formato especial.`
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function generateForAdvisor(advisor: Record<string, unknown>): Promise<string> {
  const prompt = buildPromptForAdvisor(advisor)

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  })

  return (response.content[0] as { type: string; text: string }).text
}

async function main() {
  console.log(`🚀 Generating advisor system prompts with Haiku + few-shot (resumable)...`)

  const { data: advisors, error } = await supabase
    .from('advisors')
    .select('*')
    .or('system_prompt.is.null,system_prompt.eq.')
    .order('advisor_type', { ascending: true })

  if (error) {
    console.error('Error fetching advisors:', error)
    process.exit(1)
  }

  const total = advisors?.length ?? 0
  console.log(`Found ${total} advisors without system_prompt\n`)

  let done = 0
  for (const advisor of (advisors ?? [])) {
    const category = advisor.advisor_type || advisor.category || 'unknown'
    try {
      console.log(`[${done + 1}/${total}] Generating prompt for: ${advisor.name} — ${advisor.specialty} (${category})`)
      const prompt = await generateForAdvisor(advisor)

      await supabase
        .from('advisors')
        .update({ system_prompt: prompt })
        .eq('id', advisor.id)

      done++
      console.log(`  ✅ Generated ${prompt.length.toLocaleString()} chars — saved`)

      await sleep(3000)
    } catch (e) {
      console.error(`  ❌ Error for ${advisor.name}:`, e)
      await sleep(5000)
    }
  }

  console.log(`\n✅ Complete. Generated ${done} prompts.`)
}

main().catch(console.error)
