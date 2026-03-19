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

function getFewShotExample(role: string): string {
  const filename = role === 'critico' ? 'cofounder_critico.txt' : 'cofounder_constructivo.txt'
  const filepath = path.join(__dirname, 'few-shot-examples', filename)
  return fs.readFileSync(filepath, 'utf-8')
}

function buildPromptForCofounder(cofounder: Record<string, unknown>): string {
  const role = cofounder.role as string || 'constructivo'
  const fewShot = getFewShotExample(role)
  const elementDesc = cofounder.element ? (ELEMENT_DESCRIPTIONS[cofounder.element as string] ?? '') : ''

  const roleBlock = role === 'constructivo'
    ? `CONSTRUCTIVO — Este cofundador CONSTRUYE. No es un cheerleader. Es un builder estratégico que propone soluciones con plan de ejecución, fundamenta en datos, y cuando el crítico señala un riesgo, propone la mitigación concreta. Su optimismo es estratégico y calculado, jamás ingenuo.`
    : `CRÍTICO — Este cofundador PROTEGE. No es un pesimista. Es un guardián estratégico que identifica riesgos con datos y lógica, conoce los patrones de fracaso, señala cuando los números no cuadran. Si la idea es sólida, lo reconoce explícitamente.`

  return `Genera un system prompt para un cofundador IA. El prompt debe tener la MISMA estructura, profundidad y extensión que el ejemplo de referencia.

EJEMPLO DE REFERENCIA (sigue esta estructura EXACTAMENTE — misma profundidad, mismo nivel de detalle, misma extensión):
---
${fewShot}
---

AHORA genera un prompt del MISMO calibre para este cofundador:

Nombre: ${cofounder.name}
Rol: ${role}
Especialidad: ${cofounder.specialty || ''}
Elemento: ${cofounder.element || ''} — ${elementDesc}
Estilo de comunicación: ${cofounder.communication_style || ''}
Bio: ${cofounder.bio || 'No disponible'}
Tags de especialidad: ${JSON.stringify(cofounder.specialties_tags || [])}
Industrias: ${JSON.stringify(cofounder.industries_tags || [])}
Experiencia: ${JSON.stringify(cofounder.experience || [])}

ROL ESPECÍFICO:
${roleBlock}

REGLAS CRÍTICAS:
- El prompt debe tener la MISMA extensión que el ejemplo (2,500-4,000 palabras)
- Incluir conocimiento REAL del dominio de la especialidad del cofundador
- Métricas, benchmarks, frameworks concretos — no generalidades
- Mecánica de debate clara: cómo interactúa con el cofundador opuesto y con el founder
- Habla en español

RESPONDE SOLO CON EL SYSTEM PROMPT. Sin explicaciones, sin markdown, sin formato especial.`
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function generateForCofounder(cofounder: Record<string, unknown>): Promise<string> {
  const prompt = buildPromptForCofounder(cofounder)

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  })

  return (response.content[0] as { type: string; text: string }).text
}

async function main() {
  console.log(`🚀 Generating cofounder system prompts with Haiku + few-shot (resumable)...`)

  const { data: cofounders, error } = await supabase
    .from('cofounders')
    .select('*')
    .or('system_prompt.is.null,system_prompt.eq.')
    .order('role', { ascending: true })

  if (error) {
    console.error('Error fetching cofounders:', error)
    process.exit(1)
  }

  const total = cofounders?.length ?? 0
  console.log(`Found ${total} cofounders without system_prompt\n`)

  let done = 0
  for (const cofounder of (cofounders ?? [])) {
    try {
      console.log(`[${done + 1}/${total}] Generating prompt for: ${cofounder.name} — ${cofounder.specialty} (${cofounder.role})`)
      const prompt = await generateForCofounder(cofounder)

      await supabase
        .from('cofounders')
        .update({ system_prompt: prompt })
        .eq('id', cofounder.id)

      done++
      console.log(`  ✅ Generated ${prompt.length.toLocaleString()} chars — saved`)

      await sleep(3000)
    } catch (e) {
      console.error(`  ❌ Error for ${cofounder.name}:`, e)
      await sleep(5000)
    }
  }

  console.log(`\n✅ Complete. Generated ${done} prompts.`)
}

main().catch(console.error)
