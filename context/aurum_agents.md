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

| Tabla | Objetivo | Estado DB (2026-03-18) |
|---|---|---|
| `advisors` | 1,000 | **1,371** — COMPLETO (excede objetivo por runs concurrentes) |
| `cofounders` | 40 (20+20) | **124** — todos en uso por councils activos, no recortados |
| `specialists` | 200 | **325** — COMPLETO (excede objetivo) |
| `buyer_personas` | 200 | **338** — COMPLETO (excede objetivo, B2C reintentado con count=20) |
| **Total** | **1,440** | **2,158** |

Script: `scripts/generate-marketplace.ts`
Modelo: `claude-sonnet-4-20250514` (strong tier)
Estado: **COMPLETO** — 1,760 entidades generadas (excede objetivo 1,440)

### System Prompts profundos por consejero

Cada advisor y cofounder puede tener un `system_prompt` de 3,000–5,000 palabras con conocimiento real de dominio.

**Generación:**
- On-demand: `POST /api/advisors/generate-prompt { advisor_id }` — guarda en `advisors.system_prompt`
- On-demand: `POST /api/cofounders/generate-prompt { cofounder_id }` — guarda en `cofounders.system_prompt`
- Batch: `npx tsx scripts/generate-advisor-prompts.ts` — genera para todos sin prompt (resumable)

**Uso en sesión:**
- `session/question/route.ts` inyecta `system_prompt` si existe; fallback a descripción breve
- `nexo_custom_prompt` de `projects` se inyecta como bloque adicional al final del system prompt

**Edición manual:**
- `AdvisorProfileDrawer` expone textarea editable con botones Generar / Guardar
- `NexoCustomPromptEditor` en sidebar de `/project/[id]` para instrucciones personalizadas de Nexo

**SQL requerido:**
```sql
ALTER TABLE advisors ADD COLUMN IF NOT EXISTS system_prompt text;  -- ya existe
ALTER TABLE cofounders ADD COLUMN IF NOT EXISTS system_prompt text;  -- pendiente
ALTER TABLE projects ADD COLUMN IF NOT EXISTS nexo_custom_prompt text;  -- pendiente
```

**Ejemplos generados (Story 6.0):**
- `scripts/example-prompt-Advisor_estrategia.txt` — Alejandra Mendoza, 11,521 chars ✅ en DB
- `scripts/example-prompt-Advisor_finanzas.txt` — Elena Mendoza Chen, 15,095 chars ✅ en DB
- `scripts/example-prompt-Advisor_legal.txt` — Elisabeth Björkman, 12,770 chars ✅ en DB
- `scripts/example-prompts-output.txt` — cofounders Camila Reyes + Andrés Quiroga, pendiente columna DB

### Migraciones SQL requeridas antes de correr el script

⚠️ **BLOQUEADOR** — La columna `advisor_type` tiene dos constraints incompatibles con el marketplace:
- `NOT NULL` — requiere valor
- `UNIQUE` (`advisors_advisor_type_unique`) — solo permite un advisor por tipo

Ambas deben resolverse antes de ejecutar el script:

```sql
-- 1. BLOQUEADOR CRÍTICO: Drop UNIQUE constraint en advisor_type
--    (impide tener más de 1 advisor por tipo — incompatible con catálogo de 1,000)
ALTER TABLE advisors DROP CONSTRAINT IF EXISTS advisors_advisor_type_unique;

-- 2. BLOQUEADOR CRÍTICO: Hacer advisor_type nullable
--    (el script lo poblará como la categoría específica: estrategia, finanzas, etc.)
ALTER TABLE advisors ALTER COLUMN advisor_type DROP NOT NULL;

-- 3. Specialists: hacer project_id nullable para templates
ALTER TABLE specialists ALTER COLUMN project_id DROP NOT NULL;

-- 4. Buyer Personas: hacer project_id nullable para templates
ALTER TABLE buyer_personas ALTER COLUMN project_id DROP NOT NULL;

-- 5. Add is_template flag para diferenciar templates de instancias de proyecto
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
