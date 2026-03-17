import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
dotenv.config({ path: '.env.local' })

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const OPUS = 'claude-opus-4-20250514'
const ELEMENTS = ['fuego', 'agua', 'tierra', 'aire'] as const
const HATS = ['blanco', 'rojo', 'negro', 'amarillo', 'verde', 'azul'] as const
const LEVELS = ['lidera', 'apoya', 'observa'] as const

// Map from script categories to DB CHECK constraint values
// DB constraint allows: 'investigacion' | 'ux_producto' | 'negocio' | 'tecnico' | 'precios'
const CATEGORY_DB_MAP: Record<string, string> = {
  estrategia:  'negocio',
  finanzas:    'negocio',
  marketing:   'negocio',
  ventas:      'negocio',
  producto:    'ux_producto',
  tecnologia:  'tecnico',
  legal:       'negocio',
  operaciones: 'negocio',
  industria:   'investigacion',
}

// ==================== ADVISORS (1,000) ====================

const ADVISOR_CATEGORIES = [
  { category: 'estrategia', count: 100, subs: ['Corporate Strategy', 'Growth Strategy', 'M&A Advisory', 'Market Entry', 'Competitive Intelligence', 'Business Model Innovation', 'Strategic Partnerships', 'Pivot Strategy', 'Scaling Strategy', 'Exit Strategy'] },
  { category: 'finanzas', count: 100, subs: ['Venture Capital & Fundraising', 'Unit Economics', 'Financial Modeling', 'CFO Advisory', 'Revenue Operations', 'Treasury & Cash Flow', 'Pricing Strategy', 'Valuation', 'Debt Financing', 'Investor Relations'] },
  { category: 'marketing', count: 120, subs: ['Brand Strategy', 'Performance Marketing', 'Content Marketing', 'Community Building', 'Product-Led Growth', 'SEO/SEM', 'Influencer Marketing', 'Email & CRM', 'Growth Hacking', 'PR & Communications', 'Social Media Strategy', 'Marketing Analytics'] },
  { category: 'ventas', count: 100, subs: ['Enterprise Sales', 'SMB Sales', 'Inside Sales', 'Channel & Partnerships', 'Sales Operations', 'Account Management', 'Sales Enablement', 'International Expansion', 'B2B Negotiation', 'Retail & D2C Sales'] },
  { category: 'producto', count: 120, subs: ['Product Strategy', 'UX Research', 'Design Systems', 'Product Management', 'Data Products', 'Mobile Product', 'Platform & API Product', 'B2B Product', 'Consumer Product', 'Product Analytics', 'Accessibility & Inclusion', 'Information Architecture'] },
  { category: 'tecnologia', count: 120, subs: ['Software Architecture', 'AI & Machine Learning', 'DevOps & Infrastructure', 'Cybersecurity', 'Mobile Development', 'Blockchain & Web3', 'Data Engineering', 'Cloud Architecture', 'Frontend Engineering', 'Backend & APIs', 'QA & Testing Strategy', 'CTO Advisory'] },
  { category: 'legal', count: 80, subs: ['IP & Patents', 'Privacy (GDPR/CCPA)', 'Fintech Regulation', 'Healthcare Regulation', 'International Law', 'Labor & Employment Law', 'Corporate Governance', 'Contract & Commercial Law'] },
  { category: 'operaciones', count: 80, subs: ['Supply Chain', 'HR & People Ops', 'Process Optimization', 'Scaling Operations', 'Customer Success', 'Quality Management', 'Logistics & Fulfillment', 'Procurement & Vendor Management'] },
  { category: 'industria', count: 180, subs: ['Fintech', 'Healthtech', 'Edtech', 'Ecommerce', 'Construction & Real Estate', 'Food & Beverage', 'Logistics', 'Real Estate Tech', 'Energy & Cleantech', 'Agtech', 'SaaS & Cloud', 'Media & Entertainment', 'Gaming', 'Travel & Hospitality', 'Manufacturing', 'Insurance', 'Telecom', 'Automotive'] },
]

// ==================== COFOUNDERS (40) ====================

const COFOUNDER_CONFIG = {
  constructivo: {
    count: 20,
    specialties: ['Bootstrapping & Growth', 'Product & UX', 'Sales & Revenue', 'Marketing & Brand', 'Technology & Architecture', 'Finance & Fundraising', 'Operations & Scale', 'Community & Network', 'International Expansion', 'Innovation & R&D', 'Customer Success', 'Data & Analytics', 'Content & Media', 'Partnerships & BD', 'Talent & Culture', 'Legal & Compliance', 'Supply Chain', 'Sustainability', 'Government & Public Sector', 'Impact & Social Enterprise'],
  },
  critico: {
    count: 20,
    specialties: ['Risk & Due Diligence', 'Financial Scrutiny', 'Market Reality Check', 'Technical Debt & Feasibility', 'Competitive Threats', 'Regulatory Exposure', 'Unit Economics Stress Test', 'Go-to-Market Critique', 'Scalability Assessment', 'Team & Execution Gaps', 'Customer Churn Analysis', 'Pricing Pressure', 'IP & Defensibility', 'Cash Flow Vulnerabilities', 'Operational Bottlenecks', 'Culture & Retention Risk', 'International Complexity', 'Timing & Market Windows', 'Dependency Risks', 'Exit & Investor Expectations'],
  },
}

// ==================== ESPECIALISTAS (200) ====================

const SPECIALIST_INDUSTRIES = [
  { industry: 'Fintech & Banking', count: 15 },
  { industry: 'Healthtech & Pharma', count: 15 },
  { industry: 'Edtech', count: 12 },
  { industry: 'Ecommerce & Retail', count: 15 },
  { industry: 'Construction & Real Estate', count: 12 },
  { industry: 'Food & Beverage', count: 10 },
  { industry: 'Logistics & Supply Chain', count: 10 },
  { industry: 'Energy & Cleantech', count: 10 },
  { industry: 'Agtech', count: 8 },
  { industry: 'SaaS & Cloud', count: 15 },
  { industry: 'Media & Entertainment', count: 10 },
  { industry: 'Gaming', count: 8 },
  { industry: 'Travel & Hospitality', count: 8 },
  { industry: 'Manufacturing', count: 10 },
  { industry: 'Insurance', count: 8 },
  { industry: 'Telecom', count: 8 },
  { industry: 'Automotive', count: 8 },
  { industry: 'Legal & Compliance', count: 10 },
  { industry: 'Government & Public Sector', count: 8 },
]

// ==================== BUYER PERSONAS (200) ====================

const PERSONA_SEGMENTS = [
  { segment: 'Founder early-stage', count: 20, context: 'Pre-seed to seed, validating ideas, building MVPs' },
  { segment: 'Founder growth-stage', count: 15, context: 'Series A+, scaling product-market fit, hiring' },
  { segment: 'CEO / Dueño PYME', count: 20, context: 'Established business, 10-200 employees, growth or turnaround' },
  { segment: 'Director de innovación corporativo', count: 15, context: 'Innovation lab, new business unit, corporate venture' },
  { segment: 'Product Manager', count: 15, context: 'Feature prioritization, user research, roadmap' },
  { segment: 'CTO / Tech Lead', count: 15, context: 'Architecture decisions, team scaling, build vs buy' },
  { segment: 'CMO / Marketing Lead', count: 15, context: 'Growth strategy, brand, channels, budget allocation' },
  { segment: 'CFO / Finance Lead', count: 10, context: 'Fundraising, financial planning, cost optimization' },
  { segment: 'Consumidor B2C', count: 40, context: 'End users across verticals: fintech, health, education, ecommerce, food, travel, entertainment' },
  { segment: 'Comprador B2B enterprise', count: 20, context: 'VP/Director level buying software, services, or solutions for their org' },
  { segment: 'Freelancer / Independiente', count: 15, context: 'Solo operator, multiple clients, managing own business' },
]

// ==================== GENERATION FUNCTIONS ====================

async function generateAdvisorBatch(category: string, subcategory: string, batchSize: number, batchIndex: number): Promise<any[]> {
  const prompt = `Genera ${batchSize} perfiles de consejeros IA especializados en "${subcategory}" dentro de la categoría "${category}".

REGLAS:
- Nombres ficticios realistas, culturalmente diversos (latino, anglo, asiático, europeo, africano, medio oriente)
- Cada perfil debe sentirse como una persona REAL con carrera verificable
- Bios de 2-3 oraciones con trayectoria específica (empresas ficticias pero realistas, métricas, años de experiencia)
- Especialidades tags: 3-5 tags específicos de su expertise
- Industrias tags: 2-4 industrias donde han operado
- Experiencia: 4-5 bullets concretos con logros medibles
- Idioma: "Español" o "Español · Inglés técnico" o "Español · Inglés · Portugués"
- Cada advisor es ÚNICO — no repetir patrones de carrera

Responde SOLO en JSON array:
[
  {
    "name": "Nombre Apellido",
    "specialty": "Especialidad en Español (2-4 palabras)",
    "category": "${category}",
    "level": "lidera" | "apoya" | "observa",
    "element": "fuego" | "agua" | "tierra" | "aire",
    "communication_style": "Descripción del estilo en español (5-10 palabras)",
    "hats": ["blanco", "negro"] (2-3 de: blanco/rojo/negro/amarillo/verde/azul),
    "bio": "Bio profesional en español, 2-3 oraciones con trayectoria concreta.",
    "specialties_tags": ["Tag1", "Tag2", "Tag3"],
    "industries_tags": ["Industria1", "Industria2"],
    "experience": ["Logro 1 con métrica", "Logro 2 con métrica", "Logro 3", "Logro 4"],
    "language": "Español · Inglés técnico"
  }
]

Batch ${batchIndex + 1}. No repetir nombres de batches anteriores. Generar exactamente ${batchSize} perfiles.`

  const response = await anthropic.messages.create({
    model: OPUS,
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error(`Failed to parse advisor batch ${batchIndex}`)
  try {
    return JSON.parse(jsonMatch[0])
  } catch {
    // Retry once
    const retry = await anthropic.messages.create({
      model: OPUS,
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    })
    const retryText = retry.content[0].type === 'text' ? retry.content[0].text : ''
    const retryMatch = retryText.match(/\[[\s\S]*\]/)
    if (!retryMatch) throw new Error(`Failed to parse advisor batch ${batchIndex} after retry`)
    return JSON.parse(retryMatch[0])
  }
}

async function generateCofounderBatch(role: 'constructivo' | 'critico', specialties: string[]): Promise<any[]> {
  const prompt = `Genera ${specialties.length} cofounders IA con rol "${role}".

ROL ${role.toUpperCase()}:
${role === 'constructivo'
    ? 'Construye sobre ideas, encuentra caminos viables, propone soluciones optimistas pero fundamentadas.'
    : 'Identifica riesgos, cuestiona supuestos, protege al founder de errores costosos.'
  }

Cada cofounder tiene una especialidad diferente. Genera UNO por cada especialidad:
${specialties.map((s, i) => `${i + 1}. ${s}`).join('\n')}

REGLAS:
- Nombres ficticios realistas, culturalmente diversos
- Bio de 2-3 oraciones con perspectiva desde su especialidad
- El estilo de comunicación debe reflejar tanto el rol (${role}) como el elemento asignado
- Cada cofounder aporta su perspectiva única al debate

Responde SOLO en JSON array:
[
  {
    "name": "Nombre Apellido",
    "role": "${role}",
    "specialty": "Especialidad en Español",
    "element": "fuego" | "agua" | "tierra" | "aire",
    "communication_style": "Estilo en español (5-10 palabras)",
    "hats": ["sombrero1", "sombrero2"] (2-3 de: blanco/rojo/negro/amarillo/verde/azul),
    "bio": "Bio profesional en español.",
    "specialties_tags": ["Tag1", "Tag2", "Tag3"],
    "industries_tags": ["Industria1", "Industria2"],
    "experience": ["Logro 1", "Logro 2", "Logro 3", "Logro 4"],
    "language": "Español · Inglés técnico"
  }
]`

  const response = await anthropic.messages.create({
    model: OPUS,
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error(`Failed to parse cofounder batch ${role}`)
  return JSON.parse(jsonMatch[0])
}

async function generateSpecialistBatch(industry: string, count: number): Promise<any[]> {
  const prompt = `Genera ${count} especialistas de industria en "${industry}".

Un especialista es un experto invitado que aporta contexto profundo de una industria específica. No es un advisor general — es alguien que ha operado DENTRO de esta industria.

REGLAS:
- Nombres ficticios realistas, culturalmente diversos
- Specialty describe su nicho dentro de la industria (no solo la industria)
- Justification: por qué Nexo lo invitaría (1 oración)
- Bio con trayectoria concreta en la industria
- Category tag: subcategoría dentro de la industria

Responde SOLO en JSON array:
[
  {
    "name": "Nombre Apellido",
    "specialty": "Nicho específico dentro de ${industry}",
    "category_tag": "Subcategoría",
    "justification": "Por qué este especialista es valioso para proyectos en ${industry}.",
    "bio": "Bio con trayectoria real en la industria.",
    "specialties_tags": ["Tag1", "Tag2", "Tag3"],
    "industries_tags": ["${industry}", "Industria relacionada"],
    "experience": ["Logro 1", "Logro 2", "Logro 3"],
    "language": "Español · Inglés técnico"
  }
]`

  const response = await anthropic.messages.create({
    model: OPUS,
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error(`Failed to parse specialist batch ${industry}`)
  return JSON.parse(jsonMatch[0])
}

async function generatePersonaBatch(segment: string, count: number, context: string): Promise<any[]> {
  const prompt = `Genera ${count} buyer personas del segmento "${segment}".

Contexto del segmento: ${context}

Un buyer persona es un arquetipo de cliente que Nexo usa para simular la perspectiva del mercado. No es un individuo real — es un patrón recurrente.

REGLAS:
- Nombre del arquetipo (no nombre de persona): ej. "El Founder Bootstrapper", "La Directora de Innovación Corporativa"
- Archetype label corto (2-3 palabras): ej. "El pragmático", "La visionaria"
- Demographics: género, edad, situación, región
- Quote: frase que esta persona diría sobre su problema principal (en español, primera persona)
- Needs: 3-5 necesidades concretas
- Fears/objections: 3-5 miedos u objeciones al evaluar soluciones
- Discovery channels: dónde busca información y soluciones
- Current alternatives: qué usa hoy para resolver su problema
- Behavior tags: 3-5 tags de comportamiento

Responde SOLO en JSON array:
[
  {
    "name": "Nombre del Arquetipo",
    "archetype_label": "Label corto",
    "demographics": "Género, edad, situación, región",
    "quote": "Frase en primera persona que describe su dolor principal.",
    "needs": ["Necesidad 1", "Necesidad 2", "Necesidad 3"],
    "fears_objections": ["Miedo 1", "Objeción 2", "Miedo 3"],
    "discovery_channels": ["Canal 1", "Canal 2"],
    "current_alternatives": ["Alternativa 1", "Alternativa 2"],
    "behavior_tags": ["Tag1", "Tag2", "Tag3"]
  }
]`

  const response = await anthropic.messages.create({
    model: OPUS,
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error(`Failed to parse persona batch ${segment}`)
  return JSON.parse(jsonMatch[0])
}

// ==================== MAIN ====================

async function main() {
  console.log('🚀 Generating marketplace catalog — 1,440 profiles')
  console.log('Using model:', OPUS)
  console.log('')

  const logFile = 'scripts/marketplace-generation.log'
  const log = (msg: string) => {
    console.log(msg)
    fs.appendFileSync(logFile, msg + '\n')
  }

  // Clean previous partial run
  const { error: cleanErr } = await supabase.from('advisors').delete().eq('is_native', true)
  if (cleanErr) log(`⚠️ Clean error: ${cleanErr.message}`)
  else log('🧹 Cleaned previous advisors')

  // Track totals
  let totalAdvisors = 0
  let totalCofounders = 0
  let totalSpecialists = 0
  let totalPersonas = 0

  // ---- ADVISORS ----
  log('========== ADVISORS (1,000) ==========')
  for (const cat of ADVISOR_CATEGORIES) {
    const perSub = Math.ceil(cat.count / cat.subs.length)
    for (const sub of cat.subs) {
      const remaining = cat.count - totalAdvisors
      if (remaining <= 0) break
      const batchSize = Math.min(perSub, 5, remaining) // Max 5 per API call to avoid truncated JSON

      try {
        log(`  Generating ${batchSize} advisors: ${cat.category} / ${sub}`)
        const batch = await generateAdvisorBatch(cat.category, sub, batchSize, totalAdvisors)

        const rows = batch.map(a => ({
          name: a.name,
          specialty: a.specialty,
          category: CATEGORY_DB_MAP[cat.category] || 'negocio', // mapped to constraint values
          advisor_type: cat.category, // original rich category stored here
          level: a.level || LEVELS[Math.floor(Math.random() * 3)],
          element: a.element || ELEMENTS[Math.floor(Math.random() * 4)],
          communication_style: a.communication_style,
          hats: a.hats || [HATS[0], HATS[2]],
          bio: a.bio,
          specialties_tags: a.specialties_tags || [],
          industries_tags: a.industries_tags || [],
          experience: a.experience || [],
          language: a.language || 'Español',
          is_native: true,
        }))

        const { error } = await supabase.from('advisors').insert(rows)
        if (error) log(`    ❌ Insert error: ${error.message}`)
        else {
          totalAdvisors += rows.length
          log(`    ✅ Inserted ${rows.length} — Total: ${totalAdvisors}`)
        }

        // Rate limit
        await new Promise(r => setTimeout(r, 2000))
      } catch (e: any) {
        log(`    ❌ Generation error: ${e.message}`)
      }
    }
  }
  log(`\nAdvisors total: ${totalAdvisors}`)

  // ---- COFOUNDERS ----
  log('\n========== COFOUNDERS (40) ==========')
  for (const role of ['constructivo', 'critico'] as const) {
    const config = COFOUNDER_CONFIG[role]
    try {
      log(`  Generating ${config.count} ${role} cofounders`)
      const batch = await generateCofounderBatch(role, config.specialties)

      const rows = batch.map(c => ({
        name: c.name,
        role: c.role || role,
        specialty: c.specialty,
        element: c.element || ELEMENTS[Math.floor(Math.random() * 4)],
        communication_style: c.communication_style,
        hats: c.hats || [HATS[0], HATS[2]],
        bio: c.bio,
        specialties_tags: c.specialties_tags || [],
        industries_tags: c.industries_tags || [],
        experience: c.experience || [],
        language: c.language || 'Español',
        is_native: true,
      }))

      const { error } = await supabase.from('cofounders').insert(rows)
      if (error) log(`    ❌ Insert error: ${error.message}`)
      else {
        totalCofounders += rows.length
        log(`    ✅ Inserted ${rows.length} — Total: ${totalCofounders}`)
      }
      await new Promise(r => setTimeout(r, 2000))
    } catch (e: any) {
      log(`    ❌ Generation error: ${e.message}`)
    }
  }
  log(`\nCofounders total: ${totalCofounders}`)

  // ---- ESPECIALISTAS ----
  log('\n========== ESPECIALISTAS (200) ==========')
  for (const ind of SPECIALIST_INDUSTRIES) {
    try {
      log(`  Generating ${ind.count} specialists: ${ind.industry}`)
      const batch = await generateSpecialistBatch(ind.industry, ind.count)

      const rows = batch.map(s => ({
        name: s.name,
        specialty: s.specialty,
        category_tag: s.category_tag || ind.industry,
        justification: s.justification,
        bio: s.bio,
        specialties_tags: s.specialties_tags || [],
        industries_tags: s.industries_tags || [],
        experience: s.experience || [],
        language: s.language || 'Español',
        is_confirmed: false,
        is_template: true,
        project_id: null, // Template — no attached to project
      }))

      // Specialists need project_id (NOT NULL). Insert as templates in a different way
      // Check schema first — if project_id is NOT NULL, we need a template project
      const { error } = await supabase.from('specialists').insert(rows)
      if (error) {
        log(`    ⚠️ Insert error: ${error.message}`)
        log(`    Note: specialists table may require project_id — templates may need schema change`)
      } else {
        totalSpecialists += rows.length
        log(`    ✅ Inserted ${rows.length} — Total: ${totalSpecialists}`)
      }
      await new Promise(r => setTimeout(r, 2000))
    } catch (e: any) {
      log(`    ❌ Generation error: ${e.message}`)
    }
  }
  log(`\nSpecialists total: ${totalSpecialists}`)

  // ---- BUYER PERSONAS ----
  log('\n========== BUYER PERSONAS (200) ==========')
  for (const seg of PERSONA_SEGMENTS) {
    try {
      log(`  Generating ${seg.count} personas: ${seg.segment}`)
      const batch = await generatePersonaBatch(seg.segment, seg.count, seg.context)

      const rows = batch.map(p => ({
        name: p.name,
        archetype_label: p.archetype_label,
        demographics: p.demographics,
        quote: p.quote,
        needs: p.needs || [],
        fears_objections: p.fears_objections || [],
        discovery_channels: p.discovery_channels || [],
        current_alternatives: p.current_alternatives || [],
        behavior_tags: p.behavior_tags || [],
        is_confirmed: false,
        is_template: true,
        project_id: null, // Template
      }))

      const { error } = await supabase.from('buyer_personas').insert(rows)
      if (error) {
        log(`    ⚠️ Insert error: ${error.message}`)
        log(`    Note: buyer_personas table may require project_id — templates may need schema change`)
      } else {
        totalPersonas += rows.length
        log(`    ✅ Inserted ${rows.length} — Total: ${totalPersonas}`)
      }
      await new Promise(r => setTimeout(r, 2000))
    } catch (e: any) {
      log(`    ❌ Generation error: ${e.message}`)
    }
  }
  log(`\nBuyer Personas total: ${totalPersonas}`)

  // ---- SUMMARY ----
  log('\n========== GENERATION COMPLETE ==========')
  log(`Advisors:     ${totalAdvisors} / 1,000`)
  log(`Cofounders:   ${totalCofounders} / 40`)
  log(`Specialists:  ${totalSpecialists} / 200`)
  log(`Personas:     ${totalPersonas} / 200`)
  log(`Total:        ${totalAdvisors + totalCofounders + totalSpecialists + totalPersonas} / 1,440`)
}

main().catch(console.error)
