import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

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

const GENERATE_ADVISOR_PROMPT = `Genera un system prompt EXHAUSTIVO y PROFUNDO para un consejero IA que va a operar dentro de una sesión de consejo estratégico.

PERFIL DEL CONSEJERO:
Nombre: {name}
Especialidad: {specialty}
Categoría: {category}
Elemento de comunicación: {element} — {element_description}
Estilo: {communication_style}
Sombreros de pensamiento: {hats_description}
Bio: {bio}
Tags de especialidad: {specialties_tags}
Industrias: {industries_tags}
Experiencia: {experience}
Idioma: {language}

EL PROMPT DEBE CONTENER (en este orden):

1. IDENTIDAD (200 palabras)
   - Quién es esta persona, su trayectoria, su reputación
   - Su filosofía de trabajo y principios no negociables
   - Cómo su elemento y sombreros definen su forma de pensar y comunicar

2. CONOCIMIENTO PROFUNDO DEL DOMINIO (1,500-2,500 palabras)
   Este es el bloque más importante. NO es una lista de temas — es el CONOCIMIENTO REAL.

   - Frameworks y metodologías que domina con explicación de cuándo y cómo aplicar cada uno
   - Regulación específica si aplica: leyes reales, artículos, normas, organismos reguladores
   - Métricas y benchmarks del sector: números reales, rangos típicos, red flags
   - Errores comunes que detecta inmediatamente: los que comete el 90% de los novatos
   - Trampas y riesgos ocultos que solo un experto conoce: los unknown unknowns
   - Patrones que ha visto repetirse en su carrera
   - Casos de referencia que cita: ficticios pero realistas con datos concretos
   - Game theory de su dominio: interacciones entre actores, incentivos, equilibrios, cuándo conviene qué
   - Lo que la mayoría no sabe pero debería saber sobre su especialidad
   - Las preguntas que SIEMPRE hace al evaluar un caso nuevo
   - Las señales de alerta que busca antes de que el cliente las vea
   - Cómo piensa sobre riesgo vs oportunidad en su área

3. COMPORTAMIENTO EN SESIÓN (300 palabras)
   - Cómo interviene: cuándo habla, cuándo escucha, cuándo interrumpe
   - Cómo interactúa con otros consejeros: complementa, contradice, profundiza
   - Su nivel de intensidad según la situación
   - Qué lo activa: temas donde siempre tiene algo que decir
   - Qué lo frustra: errores que no tolera

4. REGLAS OPERATIVAS (200 palabras)
   - Habla en español o el idioma indicado
   - Sus intervenciones son densas pero concisas: 4-6 oraciones con sustancia
   - Siempre aporta desde su especialidad — no opina de todo
   - Si algo no es su área, lo dice y sugiere quién debería responder
   - Cita datos y benchmarks cuando los tiene
   - Si detecta un riesgo crítico, lo señala aunque nadie haya preguntado

REGLAS PARA TI AL GENERAR:
- Mínimo 3,000 palabras, idealmente 4,000-5,000
- El prompt debe hacer que Claude SE CONVIERTA en este experto con conocimiento real
- NO uses lenguaje meta como "Eres un modelo de lenguaje" o "Tu rol es simular"
- Escribe como si fuera el briefing interno de un socio senior de McKinsey sobre esta persona
- El conocimiento debe ser REAL y VERIFICABLE — no generalidades
- Incluye los unknown unknowns — lo que el usuario ni sabe que debería preguntar

RESPONDE SOLO CON EL SYSTEM PROMPT. Sin explicaciones, sin markdown, sin formato especial. Solo el texto del prompt.`

function buildAdvisorMetaPrompt(advisor: Record<string, unknown>): string {
  const elementDesc = advisor.element ? (ELEMENT_DESCRIPTIONS[advisor.element as string] ?? '') : ''
  const hats = (advisor.hats as string[] ?? [])
  const hatsDesc = hats.map((h: string) => `${h} (${HAT_DESCRIPTIONS[h] ?? h})`).join(', ')
  return GENERATE_ADVISOR_PROMPT
    .replace('{name}', (advisor.name as string) ?? '')
    .replace('{specialty}', (advisor.specialty as string) ?? '')
    .replace('{category}', (advisor.advisor_type as string) ?? (advisor.category as string) ?? '')
    .replace('{element}', (advisor.element as string) ?? '')
    .replace('{element_description}', elementDesc)
    .replace('{communication_style}', (advisor.communication_style as string) ?? '')
    .replace('{hats_description}', hatsDesc)
    .replace('{bio}', (advisor.bio as string) ?? '')
    .replace('{specialties_tags}', JSON.stringify(advisor.specialties_tags ?? []))
    .replace('{industries_tags}', JSON.stringify(advisor.industries_tags ?? []))
    .replace('{experience}', JSON.stringify(advisor.experience ?? []))
    .replace('{language}', (advisor.language as string) ?? 'Español')
}

function buildCofounderMetaPrompt(cofounder: Record<string, unknown>): string {
  const elementDesc = cofounder.element ? (ELEMENT_DESCRIPTIONS[cofounder.element as string] ?? '') : ''
  const roleBlock = cofounder.role === 'constructivo'
    ? `CONSTRUCTIVO — Este cofundador CONSTRUYE. No es un cheerleader. Es un builder estratégico que:
- Ve oportunidades REALES donde otros ven obstáculos
- Propone soluciones con plan de ejecución, no solo ideas
- Fundamenta en datos y precedentes
- Conoce profundamente su especialidad y la aplica para encontrar caminos viables
- Cuando el crítico señala un riesgo, propone la mitigación concreta
- Su optimismo es estratégico y calculado, jamás ingenuo`
    : `CRÍTICO — Este cofundador PROTEGE. No es un pesimista. Es un guardián estratégico que:
- Identifica riesgos que nadie más está viendo
- Cuestiona supuestos con datos y lógica, no con opinión
- Conoce los patrones de fracaso de su industria
- Señala cuando los números no cuadran
- Protege al usuario de errores costosos ANTES de que los cometa
- Si la idea es sólida, lo reconoce explícitamente — su credibilidad depende de ser justo`

  return `Genera un system prompt EXHAUSTIVO para un cofundador IA que opera en sesiones de consejo estratégico.

PERFIL:
Nombre: ${cofounder.name}
Rol: ${cofounder.role}
Especialidad: ${cofounder.specialty ?? ''}
Elemento: ${cofounder.element ?? ''} — ${elementDesc}
Estilo: ${cofounder.communication_style ?? ''}
Bio: ${cofounder.bio ?? ''}
Tags: ${JSON.stringify(cofounder.specialties_tags ?? [])}
Industrias: ${JSON.stringify(cofounder.industries_tags ?? [])}
Experiencia: ${JSON.stringify(cofounder.experience ?? [])}

ROL ESPECÍFICO:
${roleBlock}

EL PROMPT DEBE CONTENER:

1. IDENTIDAD Y FILOSOFÍA (300 palabras)
2. CONOCIMIENTO PROFUNDO DE SU ESPECIALIDAD (1,500-2,000 palabras)
3. MECÁNICA DE DEBATE (500 palabras)
4. REGLAS (200 palabras)

Mínimo 2,500 palabras. RESPONDE SOLO CON EL SYSTEM PROMPT.`
}

async function generate(metaPrompt: string, label: string): Promise<string> {
  console.log(`\n🔄 Generating: ${label}...`)
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: metaPrompt,
    messages: [{ role: 'user', content: 'Genera el system prompt completo.' }],
  })
  const text = (response.content[0] as { type: string; text: string }).text
  console.log(`  ✅ Done — ${text.length.toLocaleString()} chars`)
  return text
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('🚀 Generating 3 advisor + 2 cofounder example prompts...')

  const [a1res, a2res, a3res, c1res, c2res] = await Promise.all([
    supabase.from('advisors').select('*').eq('advisor_type', 'estrategia').limit(1),
    supabase.from('advisors').select('*').eq('advisor_type', 'finanzas').limit(1),
    supabase.from('advisors').select('*').eq('advisor_type', 'legal').limit(1),
    supabase.from('cofounders').select('*').eq('role', 'constructivo').limit(1),
    supabase.from('cofounders').select('*').eq('role', 'critico').limit(1),
  ])

  const advisor1 = a1res.data?.[0]
  const advisor2 = a2res.data?.[0]
  const advisor3 = a3res.data?.[0]
  const cofounder1 = c1res.data?.[0]
  const cofounder2 = c2res.data?.[0]

  if (!advisor1 || !advisor2 || !advisor3 || !cofounder1 || !cofounder2) {
    console.error('Could not load all profiles')
    process.exit(1)
  }

  const results: { label: string; id: string; table: string; prompt: string }[] = []

  const items = [
    { entity: advisor1, label: `Advisor Estrategia — ${advisor1.name}`, table: 'advisors', metaFn: buildAdvisorMetaPrompt },
    { entity: advisor2, label: `Advisor Finanzas — ${advisor2.name}`, table: 'advisors', metaFn: buildAdvisorMetaPrompt },
    { entity: advisor3, label: `Advisor Legal — ${advisor3.name}`, table: 'advisors', metaFn: buildAdvisorMetaPrompt },
    { entity: cofounder1, label: `Cofounder Constructivo — ${cofounder1.name}`, table: 'cofounders', metaFn: buildCofounderMetaPrompt },
    { entity: cofounder2, label: `Cofounder Crítico — ${cofounder2.name}`, table: 'cofounders', metaFn: buildCofounderMetaPrompt },
  ]

  for (const item of items) {
    try {
      const metaPrompt = item.metaFn(item.entity)
      const prompt = await generate(metaPrompt, item.label)

      // Save to DB
      await supabase.from(item.table).update({ system_prompt: prompt }).eq('id', item.entity.id)
      console.log(`  💾 Saved to ${item.table}.${item.entity.id}`)

      results.push({ label: item.label, id: item.entity.id, table: item.table, prompt })

      if (item !== items[items.length - 1]) await sleep(3000)
    } catch (e) {
      console.error(`  ❌ Error for ${item.label}:`, e)
    }
  }

  // Save to file
  const output = results.map(r => `\n${'='.repeat(80)}\n${r.label} [${r.id}]\n${'='.repeat(80)}\n\n${r.prompt}`).join('\n')
  writeFileSync('scripts/example-prompts-output.txt', output, 'utf-8')
  console.log('\n✅ All done. Saved to scripts/example-prompts-output.txt')
  console.log(`Total prompts: ${results.length}`)
  results.forEach(r => console.log(`  - ${r.label}: ${r.prompt.length.toLocaleString()} chars`))
}

main().catch(console.error)
