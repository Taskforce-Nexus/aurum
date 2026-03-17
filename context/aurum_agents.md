# Reason AI Agents

---

## Nexo
Rol: Moderador principal y orquestador del sistema.
Responsabilidades: guiar Semilla, extraer contexto, armar consejo, recomendar documentos,
activar Sesión de Clarificación si no hay spec, moderar Sesión de Consejo.
Nexo es la inteligencia central del sistema.

---

## Nexo Constructivo
Rol: Cofounder IA optimista.
Función: redacta respuestas y documentos basados en hechos con perspectiva constructiva.
Opera en el mecanismo Nexo Dual.

---

## Nexo Crítico
Rol: Cofounder IA abogado del diablo.
Función: critica, identifica riesgos y debilidades en cada propuesta.
Opera en el mecanismo Nexo Dual.

---

## Marketplace de Consejeros IA

Catálogo de agentes IA especializados. 100% IA — sin consejeros humanos reales en v1.
Nexo filtra y recomienda según propósito + Resumen del usuario.

### Tamaño del catálogo (objetivo post-generación)

| Tabla | Cantidad | Estado |
|---|---|---|
| `advisors` | 1,000 | Script listo — pendiente ejecución |
| `cofounders` | 40 (20 constructivos + 20 críticos) | Script listo — pendiente ejecución |
| `specialists` | 200 (plantillas por industria) | Script listo — requiere migración SQL |
| `buyer_personas` | 200 (arquetipos reutilizables) | Script listo — requiere migración SQL |
| **Total** | **1,440** | |

Script: `scripts/generate-marketplace.ts`
Modelo: `claude-opus-4-20250514` (reasoning tier)
Tiempo estimado: ~30-45 min (144 llamadas con rate limiting)

### Migraciones SQL requeridas antes de correr el script

```sql
-- Specialists: hacer project_id nullable para templates
ALTER TABLE specialists ALTER COLUMN project_id DROP NOT NULL;

-- Buyer Personas: hacer project_id nullable para templates
ALTER TABLE buyer_personas ALTER COLUMN project_id DROP NOT NULL;

-- Add is_template flag para diferenciar templates de instancias de proyecto
ALTER TABLE specialists ADD COLUMN IF NOT EXISTS is_template boolean DEFAULT false;
ALTER TABLE buyer_personas ADD COLUMN IF NOT EXISTS is_template boolean DEFAULT false;
```

### Comando de ejecución

```bash
npx tsx scripts/generate-marketplace.ts
```

### Verificación post-ejecución

```bash
node -e "
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
Promise.all([
  s.from('advisors').select('id', { count: 'exact', head: true }),
  s.from('cofounders').select('id', { count: 'exact', head: true }),
  s.from('specialists').select('id', { count: 'exact', head: true }),
  s.from('buyer_personas').select('id', { count: 'exact', head: true }),
]).then(([a, c, sp, bp]) => {
  console.log('Advisors:', a.count)
  console.log('Cofounders:', c.count)
  console.log('Specialists:', sp.count)
  console.log('Buyer Personas:', bp.count)
  console.log('Total:', (a.count||0) + (c.count||0) + (sp.count||0) + (bp.count||0))
})
"
```

### Especialidades core del catálogo

| Categoría | Subcategorías | Total |
|---|---|---|
| estrategia | Corporate Strategy, Growth, M&A, Market Entry, +6 | 100 |
| finanzas | VC & Fundraising, Unit Economics, CFO Advisory, +7 | 100 |
| marketing | Brand, Performance, Content, PLG, SEO, +7 | 120 |
| ventas | Enterprise, SMB, Inside, Channel, +6 | 100 |
| producto | Product Strategy, UX Research, Design Systems, +9 | 120 |
| tecnologia | Architecture, AI/ML, DevOps, Security, +8 | 120 |
| legal | IP, Privacy, Fintech Reg, Healthcare Reg, +4 | 80 |
| operaciones | Supply Chain, HR, Process Opt, +5 | 80 |
| industria | Fintech, Healthtech, Edtech, Ecommerce, +14 | 180 |

Regla de participación: solo 2-3 consejeros hablan por turno.
Nexo decide cuáles son relevantes según el contexto de cada fase.

---

## Sistema de personalidad de consejeros

Cada consejero tiene dos ejes de personalidad:

### Eje 1 — Sombreros (Six Thinking Hats)
Define CÓMO piensa el consejero. Cada consejero cubre 2-3 sombreros.
Visible al usuario como dots de colores en su perfil.

### Eje 2 — Elemento de comunicación (interno)
Define CÓMO se siente interactuar con el consejero. Nunca visible al usuario como nombre de elemento.
El usuario lo percibe como estilo de comunicación en el perfil del consejero.

| Elemento | Estilo visible | Comportamiento en sesión |
|---|---|---|
| Fuego | Directo y orientado a la acción | Confronta, empuja decisiones, no tolera ambigüedad |
| Agua | Empático y colaborativo | Busca consenso, valida emociones, propone alternativas suaves |
| Tierra | Analítico y basado en datos | Ancla en números, pide evidencia, pragmático |
| Aire | Visionario y explorador | Conecta ideas, piensa en grande, desafía supuestos |

Nexo usa el elemento para calibrar los prompts de cada consejero en la Sesión de Consejo.

---

## Buyer Persona Agents
Rol: Simular clientes potenciales del venture.
Responsabilidades: evaluar ideas, reaccionar a propuesta de valor, validar mensajes, simular objeciones.
Generados por Nexo basándose en el ICP detectado en Semilla.

---

## Flujo de colaboración entre agentes

Usuario → Nexo → Marketplace (selección de consejo) → Sesión de Consejo

Nexo Dual opera en paralelo en cada fase de la Sesión de Consejo.
Buyer Personas intervienen en fases de validación de propuesta de valor y customer journey.
