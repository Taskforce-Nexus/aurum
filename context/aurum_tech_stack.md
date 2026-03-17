# Reason — Tech Stack & Builder Operations

---

## Stack Técnico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 14+ App Router |
| Lenguaje | TypeScript strict |
| Estilos | Tailwind CSS + shadcn/ui |
| Base de datos | Supabase (Postgres + Auth) |
| IA | Anthropic Claude API |
| Pagos | Stripe (test mode) |
| Repositorio | GitHub (Taskforce-Nexus/venture-builder) |

---

## Modelos Claude

| Uso | Modelo ID |
|-----|-----------|
| Producción | `claude-sonnet-4-20250514` |
| Pruebas / económico | `claude-haiku-4-5-20251001` |

- Activar modelo económico: `CLAUDE_USE_CHEAP=true` en `.env.local`
- `callClaude()` en `src/lib/claude.ts` implementa reintentos con espera exponencial para errores 429

---

## Variables de entorno

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
CLAUDE_USE_CHEAP=              # true para Haiku, omitir para Sonnet
NEXT_PUBLIC_APP_URL=           # ej. http://localhost:3000
GITHUB_CLIENT_ID=              # OAuth app GitHub
GITHUB_CLIENT_SECRET=          # OAuth app GitHub
STRIPE_SECRET_KEY=             # sk_test_... — Stripe secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=  # pk_test_... — Stripe publishable key
STRIPE_WEBHOOK_SECRET=         # whsec_... — webhook signing secret
```

---

## Servidor de desarrollo

- Siempre en `localhost:3000`
- Comando: `npm run dev`
- Si el puerto 3000 está ocupado, matar el proceso antes de levantar uno nuevo

---

## Rutas de API

| Ruta | Responsabilidad |
|------|-----------------|
| `POST /api/chat` | Chat principal — semilla 1:1 + consejo + auto-generación debate Nexo Dual |
| `POST /api/chat/proxy` | Acciones de proxy: generar borrador, aprobar, descartar, elegir lado |
| `POST /api/chat/brief` | Generar Resumen del Fundador desde conversación semilla |
| `POST /api/extract` | Extraer 5 documentos Reason Framework (5 llamadas Claude en oleadas de 2) |
| `GET/POST /api/advisors` | CRUD de asesores |
| `POST /api/voice/correct` | Corrección de transcripción española con Haiku — recibe `{ text }`, devuelve `{ corrected }` |
| `POST /api/stripe/checkout` | Crea sesión Stripe Checkout (subscription o payment) |
| `POST /api/stripe/webhook` | Webhook Stripe — actualiza subscriptions + token_balances |

---

## Esquema de base de datos

```sql
-- Tabla: projects
id                  uuid PK
name                text
user_id             uuid FK → auth.users
status              text
incubation_mode     text
founder_brief       text
entry_level         text              -- raw_idea | has_prd | has_partial
current_phase       text
last_active_at      timestamptz
Reason_value_proposition   text        -- documento generado
Reason_business_model      text        -- documento generado
Reason_branding            text        -- documento generado
Reason_customer_journey    text        -- documento generado
Reason_business_plan       text        -- documento generado
created_at          timestamptz
updated_at          timestamptz

-- Tabla: conversations
id                  uuid PK
project_id          uuid FK → projects
phase               text
messages            JSONB
extracted_docs      JSONB
progress            JSONB
created_at          timestamptz
updated_at          timestamptz

-- Tabla: proxy_responses
id                  uuid PK
project_id          uuid FK → projects
conversation_id     uuid FK → conversations
phase               text
trigger_messages    JSONB
draft_content       text              -- borrador constructivo
critique_content    text              -- crítica de Nexo Crítico
final_content       text              -- síntesis final
agreement           boolean           -- true si Nexo Dual coincidió
edited_content      text              -- si el fundador editó
status              text              -- pending | approved | discarded | chosen
created_at          timestamptz
reviewed_at         timestamptz
```

---

## Niveles de entrada a la incubadora

| Nivel | Descripción |
|-------|-------------|
| `raw_idea` | Solo una idea cruda — Nexo hace todas las preguntas |
| `has_prd` | Fundador trae documentos existentes — Nexo lee y pregunta sobre huecos |
| `has_partial` | Fundador tiene cosas claras — Nexo enfoca en lo que falta |

---

## Estructura del repositorio

```
venture-builder/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx                    # Lista de proyectos
│   │   │   ├── settings/advisors/          # Config asesores
│   │   │   └── project/[id]/
│   │   │       ├── page.tsx                # Vista del proyecto
│   │   │       └── incubadora/page.tsx     # Sesión Incubadora
│   │   ├── api/
│   │   │   ├── chat/
│   │   │   │   ├── route.ts               # Chat principal
│   │   │   │   ├── proxy/route.ts         # Acciones de proxy
│   │   │   │   └── brief/route.ts         # Resumen del fundador
│   │   │   ├── extract/route.ts           # Extracción docs Reason
│   │   │   └── advisors/route.ts          # CRUD asesores
│   │   ├── layout.tsx
│   │   └── page.tsx                        # Landing / redirección
│   ├── components/
│   │   ├── incubadora/                     # Componentes de La Incubadora
│   │   ├── dashboard/                      # Componentes del panel
│   │   └── ui/                             # Componentes shadcn
│   ├── lib/
│   │   ├── supabase/                       # Cliente servidor / cliente / middleware
│   │   ├── advisors.ts                     # Configuración de 9 asesores
│   │   ├── claude.ts                       # Wrapper Claude API + reintentos
│   │   ├── prompts.ts                      # Prompts del sistema
│   │   ├── tts.ts                          # Text-to-speech
│   │   ├── types.ts                        # TypeScript types
│   │   └── utils.ts                        # Utilidades
│   └── middleware.ts                       # Auth middleware
├── supabase/migrations/                    # Migraciones SQL
├── docs/Reason-framework.md                 # Referencia Reason Framework
└── CLAUDE.md
```

---

## Convenciones de código

- TypeScript estricto — sin `any` implícito
- App Router de Next.js — directorio `app/`
- Componentes de servidor por defecto — `"use client"` solo cuando necesario
- Tailwind + shadcn/ui para UI
- Cliente Supabase vía `@supabase/ssr`
- Rutas de API en `app/api/`
- Commits pequeños — menos de 200 líneas lógicas por commit

---

## Idioma

- UI visible al usuario: **español** — labels, placeholders, mensajes, toasts, botones
- Código: variables y funciones en **inglés** por convención técnica
- Tags de asesores en el código: en inglés — `[MARKET RESEARCH]`, `[TECHNICAL LEAD]`, `[NEXO CONSTRUCTIVO]`, etc.
- Multi-idioma: fuera de alcance en v1

---

## Fuera de alcance (proyecto separado futuro)

- Venture Planner (módulos, frames, entidades)
- Generador de Frames + Metodología KWIQ
- Puente de diseño Pencil
- Bucle Ralph Wiggum (ejecutor Ollama)
- Bot Ágil (historias, backlog, sprints)
- Compilador de Entidades
- Motor de flujos de trabajo
