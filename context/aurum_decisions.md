# Reason Architectural Decisions

This file stores important architectural and product decisions already made for Reason.

Its purpose is to preserve consistency across conversations and avoid re-opening already decided topics unless explicitly requested.

---

## 1. Core Product Identity

Reason is not just a chatbot or a code generator.

Reason is an AI-guided venture creation system that transforms a founder's idea into:

- business documentation

- product architecture

- UX structure

- system design

- backlog

- repository-ready outputs

---

## 2. Founder Role

The founder provides:

- the seed idea

- context

- constraints

- approvals

The founder should not be forced to produce heavy documentation manually.
Reason must reduce friction and preserve momentum.

---

## 3. Seed Session Philosophy

The seed session is essential. It exists to capture the founder's Eureka moment before motivation and clarity are lost.

The system should help the founder externalize:

- the idea

- frustrations

- founder experience

- constraints

- opportunities

This is handled through conversation with Nexo.

---

## 4. Nexo Role

Nexo is the moderator of the incubation process.

Nexo is responsible for:

- guiding the seed session

- extracting venture context

- orchestrating the advisory system

- deciding which advisors speak during incubation

- maintaining focus and flow

Nexo is not just another advisor. Nexo is the orchestrator.

---

## 5. Advisory Board Decision

The advisory board is not configured manually by default.

Nexo configures the advisory board automatically after the seed session.

Nexo may:

- select advisors from the library

- generate missing advisors if necessary

- select invited specialists if needed

- select or create buyer personas based on the seed session

Manual modification of the advisory board is allowed later.

---

## 6. Human and AI Participants

The system includes:

- founder

- optional human cofounders

- AI cofounders

- advisors

- invited specialists

- buyer personas / voice of customer

AI cofounders are distinct from advisors.

AI cofounders act as internal strategic counterparts:

- one constructive

- one critical

---

## 7. Venture Creation Pipeline

The canonical Reason pipeline has 13 stages:

IDEA
↓
INCUBADORA
↓
BUSINESS
↓
PRODUCT CONCEPT
↓
UX ARCHITECTURE
↓
DEFAULT FRAMES
↓
ITERATE
↓
FREEZE
↓
EXPAND
↓
SCAFFOLD
↓
SYSTEM DESIGN
↓
BACKLOG
↓
REPO

Notes:

- ITERATE and FREEZE are explicit stages, not implicit steps

- EXPAND replaces the former FRAME EXPANSION

- SCAFFOLD replaces the former FRAME SCAFFOLDING

- DESIGN SYSTEM is absorbed into SCAFFOLD and not a visible pipeline stage

- This pipeline should be preserved unless explicitly redesigned by Juan

---

## 8. Business vs Product vs Engineering

### Business

- value proposition

- business model

- customer journey

- branding

- business plan

### Product

- product concept

- UX architecture

- default frames

- frame expansion

- frame scaffolding

- design system

### Engineering

- system design

- backlog

- repo outputs

---

## 9. Branding Decision

Branding belongs to the BUSINESS layer.

Branding includes:

- purpose, mission, vision, values

- positioning, voice, naming, identity direction

Branding informs Product and Design System later.

---

## 10. UI Design Workflow Decision

The UI workflow is: default → iterate → freeze → expand → scaffold

Rules:

- never generate hundreds of frames in the first pass

- always start with default frames

- freeze before expansion

- expansion derives from approved defaults

- scaffolding prepares the UI for engineering

---

## 11. Pencil Decision

Pencil.dev is used to generate and iterate product UI frames.
Pencil is a design execution layer, not the source of truth.
The source of truth is the structured inventory and project docs.

---

## 12. Default Frame Strategy

Do not generate before freeze:

- loading states

- error states

- empty states

- responsive variants

- hover/microinteraction variants

---

## 13. Existing UI Decision

ProjectView is the main project hub. No duplicate hub screens.
Document Hub logic lives inside ProjectView.

---

## 14. Export Center Decision

Export Center evolves into a handoff center.

Supports:

- documents

- markdown bundles

- repo package

- slides / pitch deck

- investor materials

---

## 15. Build Scope Decision

Reason v1 generates:

- strategy

- business docs

- product structure

- system design

- backlog

- repo-ready artifacts

Full autonomous build is a future milestone, not v1.

---

## 16. Documentation Strategy

Important knowledge must be extracted into markdown files.
Claude Project files and /context in the repo are the core memory layers.

---

## 17. Language Decision

Conversation with Nexo happens in Spanish when requested.
Technical documentation may remain in English.

---

## 18. Product Experience Principle

Reason should feel: premium, serious, clear, structured, energizing.
It should never feel like a chaotic prompt toy.

---

## 19. Incubation Phase Model

The INCUBADORA stage contains 5 internal sub-phases:

1. Semilla — initial idea capture with Nexo

2. Propuesta de Valor — value proposition exploration

3. Modelo de Negocio — business model definition

4. Recorrido del Cliente — customer journey mapping

5. Plan de Negocio — business plan synthesis

These sub-phases are internal to INCUBADORA and do not appear as separate stages in the main pipeline.

The Nexo Dual mechanism operates across all sub-phases:

- Constructive cofounder proposes

- Critical cofounder challenges

- Nexo synthesizes and advances

Three operating modes: Normal, Autopilot, Levantar Mano (raise hand).

The advisory board is activated and configured by Nexo after Semilla is complete.

---

## 20. Modelo de Monetización y Retención

Ingresos:

- Suscripción mensual fija — acceso a la plataforma

- Saldo de tokens prepagado — consumo variable por uso real

- El usuario nunca conecta su propia API key

- Reason controla el acceso al modelo y aplica margen sobre costo Anthropic

El costo es variable por diseño: founders con más contexto, más archivos
y más conversación consumen más tokens. El saldo captura esa variabilidad.

Tiers:

- Core — pipeline completo

- Branding — upsell: identidad visual, naming, dirección de marca

- Frames — upsell: generación de UI con Pencil para founders de producto

- Consejo Premium — advisors especializados por industria

- Consultoría — acceso solo al Consejo sin pipeline completo

Modelo de retención estructural:
El Consejo Asesor es el switching cost principal de Reason.
El Consejo acumula advisors configurados, buyer personas, historial
de decisiones e inteligencia del negocio construida sesión a sesión.
Abandonar Reason significa abandonar la memoria institucional del negocio.
El valor acumulado supera el costo mensual — ese es el ancla de retención.

El Consejo no es producto separado — es una capa presente en todos
los tiers con diferente profundidad según el plan.

---

## 21. Verticalización del Pipeline — Adaptive Intelligence Architecture

El pipeline visible al founder es siempre el mismo.
La inteligencia que Nexo aplica dentro de cada etapa es específica
al tipo de venture.

Nexo construye un Venture Profile durante la Sesión Semilla:

{
  "venture_type": "saas | construccion | servicios | retail | otro",
  "pipeline_variant": "digital | construccion | servicios | retail",
  "doc_set": ["negocio_5", "rama_especifica", "ingenieria_x"],
  "advisor_config": ["advisor_1", "advisor_2", "advisor_3"],
  "confidence": 0.0-1.0
}

Con ese perfil el sistema configura automáticamente:

- qué etapas del pipeline tienen peso real

- qué preguntas hace Nexo en cada fase

- qué advisors se activan y con qué énfasis

- qué documentos se generan

- qué benchmarks y referencias de dominio se usan

Los prompts son paramétricos — un prompt base más contexto de dominio:

prompts/
  business_model/
    base.md
    context_saas.md
    context_construccion.md
    context_servicios.md
    context_retail.md

Agregar un vertical nuevo = escribir su context_[vertical].md
y definir su doc_set y pipeline_variant. No se toca la UI ni el pipeline.

Verticales v1:

- SaaS / producto digital

- Construcción / real estate

- Servicios / consultoría

- Retail / e-commerce

- Otros — ruta genérica

En v2: pipelines verticalizados con etapas distintas por industria.

---

## 22. Niveles de Entrada — Expansión

Niveles adicionales a raw_idea / has_prd / has_partial:

- has_brand — founder ya tiene identidad de marca.

  Nexo salta la fase de Branding.

- consulting_only — acceso directo al Consejo sin pipeline completo.

---

## 23. Principio de Operación Mínima del Founder

Reason opera como un artifact de Claude:
el founder describe, Reason genera, el founder corrige si algo
no refleja su realidad.

El founder habla en Semilla. Una vez.
Después de eso Reason trabaja. El founder solo aparece cuando
algo necesita su ojo — no su esfuerzo.

Reglas:

- sin formularios post-Semilla

- sin configuración manual de advisors

- sin selección de documentos a generar

- sin elección de pipeline o vertical

- Nexo infiere, configura, ejecuta y presenta resultados

- el founder aprueba o corrige en lenguaje natural

El Venture Profile no es algo que el founder llena —
es algo que Reason construye y el founder puede contradecir.

Corrección = lenguaje natural, no formulario:
"Mis clientes no son compradores individuales, son fondos de inversión"
Nexo actualiza el Venture Profile y regenera lo afectado.

---

## 26. Voice Stack — Deepgram STT + Cartesia TTS

**Decisión:** Reemplazar Web Speech API + speechSynthesis con Deepgram Nova-3 (STT) y Cartesia Sonic-3 (TTS).

**Razón:** Web Speech API no es confiable (loop infinito en Chrome, sin control de calidad). Deepgram + Cartesia ofrecen mejor calidad en español, latencia predecible y costo controlado.

**Stacks evaluados y descartados:** Vapi ($12k/mes a 1k sesiones), ElevenLabs (5× más caro), LiveKit (WebRTC overhead), OpenAI Realtime (ata a GPT-4o), Chatterbox (mala calidad español), Qwen3-TTS (reservado v2+ self-hosted).

**Costo proyectado:** ~$127/mes a 1,000 sesiones de 40 min. Migración futura a Qwen3-TTS cuando volumen supere ~10k sesiones/mes.

**Voz de Nexo:** Cartesia "Pedro - Formal Speaker" — ID: `15d0c2e2-8d29-44c3-be23-d585d5f154a1`

Acento mexicano, voz masculina, clara y estable. Voice design API devolvió 405 (no disponible en plan actual). Juan solicitó acento norteño/Monterrey — Cartesia no tiene voz específica de Monterrey; Pedro es el mejor disponible con acento mexicano explícito.

**Implementación:**

- `POST /api/voice/stt` — recibe FormData con audio webm/opus, devuelve `{ transcript }`. Parámetros: `model=nova-3&language=es-419&smart_format=true&punctuate=true&utterance_end_ms=1000`

- `POST /api/voice/tts` — recibe `{ text }`, devuelve `audio/mpeg` stream

- `VoiceModePanel.tsx` — MediaRecorder + AudioContext + VAD (amplitude threshold)

- VAD: SPEECH_START_THRESHOLD=20, SILENCE_THRESHOLD=12, SILENCE_DURATION=600ms

- Sentence streaming: LLM stream SSE → boundary detection (min 80 chars + [.!?\n]) → TTS queue por oración → text progresivo con cursor pulsante

- Interrupt: usuario habla durante SPEAKING → cancela AudioBufferSourceNode → vuelve a LISTENING

**Variables de entorno requeridas:** `DEEPGRAM_API_KEY`, `CARTESIA_API_KEY`

**Estado:** implementado — pendiente confirmación en browser real (Juan)

---

## 25. Voice Mode Architecture (SUPERSEDIDA por #26)

**Decisión original:** Web Speech API con `getUserMedia` explícito antes de iniciar SpeechRecognition.

**Supersedida por:** Decisión #26 — Deepgram STT + Cartesia TTS reemplaza Web Speech API completamente.

**Nota histórica:** Los patrones de `keepListeningRef` y `requestPermissionAndStart()` siguen siendo irrelevantes ya que el nuevo stack usa MediaRecorder, no SpeechRecognition.

---

## 24. Adaptive UI Architecture

La UI no se genera — se configura.

Capa 1 — Tronco común (todos los ventures, siempre):
  Pipeline progress · Documentos de negocio · Consejo Asesor · Export Center

Capa 2 — Módulos opcionales (bloques diseñados, activación variable):
  UX Architecture    → activo para: SaaS, producto digital
  Default Frames     → activo para: SaaS, producto digital
  System Design      → activo para: SaaS, producto digital, tech-enabled
  Design Studio      → activo para: SaaS, producto digital
  Branding           → activo por defecto, skip si has_brand
  Operaciones        → activo para: construcción, retail
  Consultoría        → activo si consulting_only

Capa 3 — Configuración en runtime:
  La UI lee venture_profile y renderiza los módulos correctos.
  Módulos inactivos simplemente no existen — no grayed out, no bloqueados.

Escalar a un vertical nuevo:

- diseñar sus módulos específicos una vez

- agregar regla de activación en la configuración

- costo marginal casi cero

Nexo configura — no construye en runtime.
La construcción ocurre en fase de diseño, no en ejecución.

---

## 27. Tavus CVI — archivado como spike

Implementado como spike de investigación en sesión 7. Costo prohibitivo en plan gratuito (25 min/mes totales — no por sesión). Archivado en `src/_archive/tavus/`.

Listo para reactivar con plan Starter+ ($50/mes). Fases 2-5 siguen usando Deepgram + Cartesia (VoiceModePanel).

Archivos archivados:

- `src/_archive/tavus/api/conversation/route.ts`
- `src/_archive/tavus/api/llm/route.ts`
- `src/_archive/tavus/NexoModal.tsx`

Variable de entorno requerida: `TAVUS_API_KEY` (no activa en producción hasta reactivar).

---

## 28. Voice Mode — estado post sesión 7

Fixes implementados en sesión 7:

- Mic mute durante TTS (`track.enabled = false`) para evitar eco acústico — superior a subir INTERRUPT_THRESHOLD
- Turn ID con `Date.now()` — evita colisión de contadores entre turnos
- Text reveal delay 100ms + min 5 ticks — audio empieza antes de texto, sin flash en frases cortas
- INTERRUPT_THRESHOLD=20 (revertido de 45 — 45 era demasiado alto)
- Cooldown 100ms antes de reactivar VAD (reducido de 300ms)

Voz de Nexo: Cartesia "Manuel - Newsman" — ID: `948196a7-fe02-417b-9b6d-c45ee0803565`
Más cálida y accesible que Pedro (Formal Speaker).
Alt disponible: Emilio - Friendly Optimist (`b0689631-eee7-4a6c-bb86-195f1d267c2e`)

Pendiente post-MVP: migración STT a Deepgram WebSocket (plan aprobado, implementación diferida).

---

## 29. Infraestructura de deploy

Railway + Vercel operativos.

Variables de entorno en producción:

- `DEEPGRAM_API_KEY`
- `CARTESIA_API_KEY`
- `ANTHROPIC_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TAVUS_API_KEY` (inactiva — archivado)

---

## 30. MVP scope definido

MVP = flujo completo end-to-end:

**Semilla → Resumen del Fundador → Documentos → Project View**

El founder completa una incubación sin intervención manual.

Fuera de MVP v1:

- Deepgram WebSocket (diferido post-MVP)
- Tavus CVI (diferido hasta Starter+)
- Frames completos en Pencil.dev (en paralelo, no bloqueante)
- Backlog y Repo Blueprint

---

## 31. AVA Suite Architecture

Reason es uno de tres productos independientes bajo AVA:
- Reason — estrategia de negocio + consejo IA
- Branding — identidad de marca completa (se hace a mano hasta post-Reason)
- Agile Bot — backlog estructurado → GitHub / Jira / Linear

Cada producto tiene su propio ICP, precio y marca. Se complementan pero funcionan solos.
La conexión entre productos es vía outputs exportables — no integración forzada.
El modelo de negocio es tipo Zoho/Odoo: cada módulo se vende solo o como suite completa.

---

## 32. Reason no es una incubadora

Reason es un sistema de toma de decisiones estratégicas asistido por consejo IA.
El ICP puede ser cualquier persona que necesite estructurar una decisión compleja.
No está limitado a founders. El pipeline y los documentos se adaptan al ICP y al propósito declarado.

---

## 33. Journey definitivo de Reason

1. Registro
2. Semilla — Nexo extrae contexto completo del usuario
3. Propósito del Consejo — el usuario declara qué decisión necesita tomar
4. Marketplace de Consejeros — Nexo recomienda perfiles IA relevantes, usuario arma su consejo
5. Definición de Documentos:
   - Nexo revisa la Document Specification Library
   - Si existe spec clara → propone documentos directamente
   - Si no existe spec → activa Sesión de Clarificación de Expectativas
   - Usuario valida documentos propuestos
6. Sesión de Consejo — N fases, cada fase produce un documento aprobado
7. Export Center

---

## 34. Document Specification Library

Biblioteca viva de specs técnicas por ICP y propósito. Cada spec contiene:
- Nombre del documento e ICP para el que aplica
- Decisión estratégica que resuelve
- Pregunta central que responde
- Secciones con descripción exacta de contenido
- Datos que necesita extraer de la sesión para generarlo
- Consejeros mejor posicionados para contribuir
- Criterio de calidad — cómo sabe Reason que el documento está completo

La biblioteca crece con cada usuario nuevo que no tiene spec previa.

---

## 35. Sesión de Clarificación de Expectativas

Mecanismo que se activa cuando el usuario tiene un propósito para el que no existe spec en la biblioteca.
Nexo co-construye la spec con el usuario:
- ¿Qué decisión necesita resolver cada documento?
- ¿Qué secciones necesita?
- ¿Cómo se ve un output de calidad para este caso?
La spec queda guardada en la biblioteca al terminar.

---

## 36. Proceso de construcción de specs nuevas

Cuando se detecta un ICP sin spec previa, el proceso es:
1. Discovery — identificar las 3-5 decisiones más críticas que ese ICP necesita tomar
2. Mapeo — cada decisión se mapea a un documento que la estructura y resuelve
3. Especificación técnica — se escribe la ficha completa del documento
4. Validación con caso real — se prueba con un usuario real antes de entrar a la biblioteca
5. Biblioteca — la spec entra como oficial y Nexo puede recomendarla

---

## 37. Marketplace de Consejeros

Catálogo de agentes IA con perfil completo: nombre, especialidad, industria, estilo de comunicación.
100% IA — sin consejeros humanos reales en v1.
Nexo filtra y recomienda según propósito + Resumen del Fundador.
El usuario puede aceptar la recomendación o explorar el catálogo completo.
Especialidades core del catálogo: estrategia de negocio, finanzas, marketing, ventas, producto/UX, tecnología, legal/regulatorio, operaciones, industria específica.
Mínimo viable para MVP: 15-20 consejeros cubriendo especialidades core.

---

## 38. Documentos ICP Founder — spec completa

Documento 1 — Value Proposition Canvas:
- Perfil del cliente: trabajos, dolores, ganancias esperadas
- Propuesta de valor: productos/servicios, aliviadores de dolor, creadores de ganancia
- Encaje problema-solución
- ICP definido
- Hipótesis de valor a validar
- 2-3 Customer Personas con: perfil detallado, lenguaje exacto para describir el problema, Next Best Alternatives actuales, mapa emocional y racional a través del proceso de compra desde detección del problema hasta compra

Documento 2 — Business Model:
- Business Model Canvas completo: segmentos de clientes, propuesta de valor, canales, relación con clientes, fuentes de ingresos, recursos clave, actividades clave, socios clave, estructura de costos
- Modelo de pricing y esquemas de cobro
- Economía unitaria: CAC, LTV, margen por cliente
- Palancas de crecimiento
- P&L Proforma completo: Ventas · COGS · Utilidad bruta / Margen bruto · Gastos de ventas desglosados · Gastos generales desglosados · Gastos administrativos desglosados · Utilidad operativa / Margen operativo · Impuestos · Depreciación · Utilidad neta / Margen neto · Flujo de efectivo / Margen de flujo

Documento 3 — Customer Journey:
- Framework compartido por todos los ICPs y personas: Descubrimiento · Evaluación · Decisión · Activación · Retención · Expansión
- Anotaciones específicas por persona donde necesita refuerzo particular en el journey
- Balancing loops y Reinforcing loops marcados explícitamente: adquisición, activación, retención, conversión
- Recomendaciones concretas de cambios en el producto para resolver loops débiles

Documento 4 — Business Plan:
- Dirección estratégica
- Evaluación de preparación — 8 dimensiones puntuadas 1-10
- Riesgos clave y plan de mitigación
- Decisión go / no-go con justificación
- Impulsos estratégicos (no líneas de tiempo): cada impulso tiene objetivo claro, acciones clave y condición de éxito. El founder avanza cuando cumple la condición del impulso anterior. Típicamente 3-5 impulsos.

---

## 39. Export Center

Interfaz de presentación interactiva que muestra los resultados de la Sesión de Consejo como documento visual navegable.
El JSON generado en la Sesión de Consejo es la fuente de verdad. El Export Center lo presenta y empaqueta.
- MVP: PDF + PPTX via PptxGenJS
- v2: Google Slides via Google Slides API

No es solo un botón de descarga — es una interfaz de presentación completa.

---

## 40. Renombrar Sesión de Consejo

La etapa "Incubadora" se renombra a "Sesión de Consejo" en toda la UI visible al usuario.
El término "incubadora" queda solo en código legacy donde sea necesario para compatibilidad.

---

## 41. Pipeline se adapta por venture type

El pipeline base es el de producto digital. El pipeline visible al usuario se filtra según el venture type detectado en Semilla. Branding, Agile Bot y módulos AVA son externos — Reason los orquesta pero no los contiene.

---

## 42. Orden de construcción AVA Suite

1. Reason completo — se construye ahora
2. Agile Bot — siguiente módulo después de Reason
3. Branding — se hace a mano hasta que sea su turno

No más cambios de scope hasta terminar Reason.

---

## 43. Rebranding AURUM → Reason

**Decisión:** El producto se renombra de AURUM a Reason.

**Scope del rebrand:**
- Nombre visible al usuario: AURUM → Reason en toda la UI, docs y código fuente
- Brandbook Reason aplicado: Navy Blue #0A1128 (bg), Off-White #F8F8F8 (texto), Dark Gold #B8860B (acento), Cool Blue #007BFF (secundario), Charcoal Grey #2C3E50 (texto secundario)
- Tipografía: Outfit (headers/nav/labels), Open Sans (cuerpo/párrafos)
- Logos: archivos en public/branding/ — usar logo-claro-reason.png (blanco sobre oscuro)
- Archivos de contexto en /context/ y /prompts/: siguen llamándose `aurum_*.md` (no renombrados)
- Variables internas de código (nombres de funciones, tipos TS): sin cambios

**Fecha:** 2026-03-11

## 44. Sistema de personalidad de consejeros — elementos de comunicación

Cada consejero tiene dos ejes: sombreros (cómo piensa) y elemento de comunicación (cómo interactúa).
Los elementos son internos — el usuario nunca ve el nombre del elemento.
4 elementos: Fuego (directo), Agua (empático), Tierra (analítico), Aire (visionario).
El estilo se refleja en el perfil como descriptor de comunicación y en los prompts de la Sesión de Consejo.

---

## 22. SeedSession Step Order Decision

La secuencia canónica de pasos dentro de la Sesión Semilla es:

1. Default (conversación con Nexo)
2. EntregablesPropuesta — documentos que se generarán
3. ConsejoPrincipalPropuesta — rol de Nexo y asesores
4. CofoundersPropuesta — cofounders IA seleccionados
5. EspecialistasPropuesta — especialistas convocados
6. ICPsPropuesta — buyer personas definidas
7. ConsejoListo — confirmación y arranque

El nav de cada frame muestra "Paso X de 7" acorde a esta secuencia.
Esta decisión no debe reabrirse sin instrucción explícita de Juan o Kira.

---

## 45. Mascota de Nexo — pulpo orquestador

Nexo tendrá una representación visual como mascota tipo pulpo.
Metáfora: 8 brazos coordinando múltiples consejeros simultáneamente.
Scope: post-MVP. No bloquea el flujo actual.

**Fecha:** 2026-03-12

---

## 46. Ambient music durante Sesión de Consejo

La Sesión de Consejo tendrá loops lofi/instrumental sin voz como ambiente sonoro.
Referencia: FigJam ambient sounds.
Transforma la experiencia de herramienta a espacio de pensamiento.
Scope: post-MVP. No bloquea el flujo actual.

**Fecha:** 2026-03-12

---

## 47. Consultoría activa post-sesión — chat vivo con tu consejo

Después de completar la Sesión de Consejo y exportar documentos, el usuario
puede regresar al proyecto y abrir un chat con su consejo armado.

Funciones:

- Debatir nuevas ideas con los mismos consejeros que ya tienen contexto
- Actualizar documentos existentes con nueva información
- Resolver dudas estratégicas posteriores
- Consultar al consejo antes de tomar decisiones de ejecución

Es el principal driver de consumo recurrente de tokens y el ancla de retención.
El consejo acumula inteligencia sesión a sesión — abandonar Reason = perder esa memoria.

Scope: post-MVP. Diseñar frame después de completar landing.

**Fecha:** 2026-03-12

---

## 48. Game Theory como meta-framework de preguntas estratégicas

Las preguntas canónicas de la Sesión de Consejo se estructuran internamente bajo Game Theory:

- **Players** — ¿Quiénes participan? (cliente, competencia, aliados, reguladores)
- **Rules / Constraints** — ¿Qué restricciones operan? (mercado, legal, técnico, capital)
- **Incentives** — ¿Qué mueve a cada jugador? (pains, ganancias, poder, status)

Esto no es visible para el founder — es el framework interno que usa Nexo para formular
preguntas que extraigan información estratégicamente completa por sección de documento.

Implementación: `src/lib/session-questions.ts` — preguntas canónicas por documento con sección explícita.
Adaptación: `adaptQuestionsToContext()` personaliza cada pregunta al contexto del founder
sin cambiar su enfoque estratégico (Game Theory preservado).

Documentos cubiertos: Value Proposition Canvas, Business Model, Customer Journey, Business Plan.

**Extensión (Game Analysis — 2026-03-17):**

Al completar la Semilla, Nexo genera un `game_analysis` JSONB que mapea explícitamente:
Players, Rules, Incentives y Key Tensions del juego estratégico del founder.
Este análisis se guarda en `projects.game_analysis` y se inyecta en:

- `adaptQuestionsToContext()` — tensiones y players contextualizan las preguntas canónicas
- `handleDebate()` — advisors y cofounders debaten considerando el juego completo
- ProjectView sidebar — muestra las 3 primeras tensiones clave al founder

Generación: `NEXO_GAME_ANALYSIS_SYSTEM` → Haiku 4096 tokens → `projects.game_analysis`
Disparado en: `/api/chat/route.ts` al detectar `[CONSEJO:...]` (ambas rutas streaming y non-streaming)
SQL requerido: `ALTER TABLE projects ADD COLUMN IF NOT EXISTS game_analysis jsonb;`

**Fecha:** 2026-03-17

---

## 49. Tres tiers de modelo — fast / strong / reasoning

`callClaude()` usa `tier` para seleccionar el modelo por función, no por entorno:

- `fast` (`CLAUDE_MODEL`, default Haiku) — mecánico: Semilla chat, preguntas canónicas, voice, topics
- `strong` (`CLAUDE_MODEL_STRONG`, default Sonnet) — debate constructivo/crítico, síntesis, secciones de documentos, consultoría, advisors
- `reasoning` (`CLAUDE_MODEL_REASONING`, default Opus) — founder_brief, game_analysis (2 llamadas por proyecto, alta calidad)

El tier es explícito en cada llamada — no hay "modelo global" por entorno.
En Railway/Vercel: cada variable se configura independientemente.

Implementación: `src/lib/claude.ts` — `interface CallClaudeOptions { system, messages, max_tokens?, tier? }`

**Fecha:** 2026-03-17

---

## 48. Framework Engine — reemplaza Document Specification Library

La Document Specification Library estática (4 documentos fijos para ICP Founder)
se reemplaza por el Framework Engine.

Nexo ya no elige documentos de un menú. Nexo COMPONE entregables a la medida
usando su conocimiento de frameworks estratégicos, modelos cuantitativos
y metodologías de análisis.

Qué muere:
- Tabla document_specs en Supabase
- Sesión de Clarificación como pantalla separada
- 4 documentos fijos para founders
- Campo spec_id en ProjectDocument
- aurum_document_specs.md

Qué cambia:
- ProjectDocument lleva composition (JSON dinámico) en vez de spec_id
- EntregablesPropuesta muestra propuesta dinámica de Nexo
- Las preguntas de la Sesión de Consejo se generan por contexto

Qué se mantiene:
- Pipeline de usuario
- Marketplace de consejeros
- Nexo Dual
- Export Center

Fuente de verdad: /context/aurum_framework_engine.md

**Fecha:** 2026-03-17

---

## 50. Stripe backend — checkout, webhook, portal

Stripe integrado en modo test con tres rutas:
- `POST /api/stripe/checkout` — crea sesión Checkout (subscription o payment), busca o crea customer en profiles.stripe_customer_id
- `POST /api/stripe/webhook` — procesa checkout.session.completed, subscription.updated/deleted, invoice.paid
- `POST /api/stripe/portal` — abre Billing Portal para gestión de suscripción

Regla de redirect: `success_url` y `cancel_url` apuntan a `/settings/facturacion`.
Variables requeridas: `STRIPE_SECRET_KEY` (sk_test_*, NO rk_test_*), `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`.

**Fecha:** 2026-03-18

---

## 51. Token usage tracking — OPERATION_COSTS, checkBalance, trackUsage

`src/lib/usage.ts` centraliza el modelo de consumo:
- `OPERATION_COSTS` — mapa de operación → costo en USD (chat_message: 0.04, session_question: 0.08, consultation_message: 0.08, etc.)
- `checkBalance(userId)` — lee token_balances, retorna `{ canProceed, balance }`
- `trackUsage(userId, projectId, operation)` — descuenta de token_balances + inserta en token_usages

Todo endpoint Claude llama `checkBalance` antes de llamar a la API. Si `canProceed = false`, retorna HTTP 402.

**Fecha:** 2026-03-18

---

## 52. 402 handler pattern — safeFetch + InsufficientFundsModal

Cuando un endpoint retorna HTTP 402 (saldo insuficiente), el frontend muestra un modal de recarga.

Implementación:
- `src/lib/fetch402.ts` — `safeFetch()` es drop-in replacement de `fetch`. Intercepta 402 y dispara evento custom `'insufficient-funds'`
- `InsufficientFundsModal` en dashboard layout — escucha el evento y muestra modal con botón de recarga
- Componentes migrados: EntregablesPropuesta, SesionConsejoView, ICPsPropuesta, EspecialistasPropuesta, ConsultoriaView, ExportCenter

Regla: todos los componentes que llaman a endpoints Claude deben usar `safeFetch` en lugar de `fetch`.

**Fecha:** 2026-03-18

---

## 53. Consultoría Activa — chat post-sesión con el consejo

Después de completar la Sesión de Consejo, el founder puede chatear con su consejo armado.

Gate: requiere `sessions.status = 'completada'` para el proyecto.
Tabla: `consultations` — `{ id, project_id, title, messages JSONB, status }`
Messages format: `{ role: 'user' | 'council', content, responses?: AdvisorResponse[], created_at }`
AdvisorResponse: `{ role: 'nexo' | 'advisor', content, advisor_id?, advisor_name?, specialty? }`

Rutas: `/api/consultation/start`, `/api/consultation/message`, `/api/consultation/[consultationId]`
Modelo: Claude Sonnet (tier: strong). Costo: $0.08/mensaje.
Prompt: `NEXO_CONSULTORIA_SYSTEM` en `src/lib/prompts.ts`.

**Fecha:** 2026-03-18

---

## 54. UI Settings — Billing + Plans

Settings__Billing (`/settings/facturacion`) muestra: saldo actual, plan activo, historial de consumo, método de pago, facturas.
Settings__Plans (`/settings/planes`) muestra: comparación de 3 tiers (Core/Pro/Enterprise) + recarga de saldo con botones fijos ($10/$25/$50).

Botones de suscripción leen precio de env vars `STRIPE_PRICE_CORE`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ENTERPRISE`.
Botones de recarga usan `price_id` del env var correspondiente (ej. `STRIPE_PRICE_TOKEN_10`).
Modal 402 (`InsufficientFundsModal`) aparece cuando cualquier endpoint retorna HTTP 402.

**Fecha:** 2026-03-18

---

## 55. Deploy Railway — variables de entorno requeridas

Variables mínimas para producción en Railway:
- `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY` (sk_test_* — NO rk_test_* — Restricted Key retorna url: null en checkout)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL` (con https:// incluido, ej. https://reason-production-e205.up.railway.app)
- `STRIPE_PRICE_CORE`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ENTERPRISE`
- `STRIPE_PRICE_TOKEN_10`, `STRIPE_PRICE_TOKEN_25`, `STRIPE_PRICE_TOKEN_50`

**Fecha:** 2026-03-18

---

## 56. Deep System Prompts Architecture — Advisors & Cofounders

Cada advisor y cofounder en el marketplace tiene un `system_prompt` de 3,000–5,000 palabras generado por Claude Sonnet.
El prompt contiene: Identidad (200w), Conocimiento Profundo del Dominio (1,500–2,500w con frameworks reales, regulación, métricas, unknown unknowns), Comportamiento en Sesión (300w), Reglas Operativas (200w).

- Generación on-demand vía `POST /api/advisors/generate-prompt` y `POST /api/cofounders/generate-prompt`
- Generación en batch: `scripts/generate-advisor-prompts.ts` (resumable, skip si ya tiene prompt)
- En `session/question/route.ts`: si `system_prompt` existe se inyecta directamente; si no, fallback a descripción breve
- Columnas requeridas: `advisors.system_prompt text`, `cofounders.system_prompt text`

**Fecha:** 2026-03-18

---

## 57. Editable Prompts Pattern — Advisor Drawer + NexoCustomPromptEditor

Usuarios pueden ver y editar el `system_prompt` de cualquier consejero directamente desde `AdvisorProfileDrawer`.
El drawer expone un textarea (monospace, 15 rows) con botones "Generar automáticamente" (genera vía API) y "Guardar cambios" (solo visible si hay cambios pendientes).

A nivel de proyecto, `NexoCustomPromptEditor` en el sidebar de `/project/[id]` permite personalizar el comportamiento de Nexo con instrucciones adicionales almacenadas en `projects.nexo_custom_prompt`.
Estas instrucciones se inyectan al final del system prompt en `session/question/route.ts`.

- Columna requerida: `projects.nexo_custom_prompt text`
- Patrón de dirty tracking: botón Guardar solo aparece cuando `isDirty === true`

**Fecha:** 2026-03-18

---

## Free Tier + Model Router (Story 7.0)

**Decisión:** Registro por defecto en plan `free` con $1.00 de saldo inicial. El plan se puede actualizar a Core/Pro/Enterprise via Stripe.

**Tabla de modelos por plan y task** (`src/lib/model-router.ts`):
- `free`: Haiku para seed_chat, compose, session, specialists, personas, file_extract, system_prompt. `null` (bloqueado) para: consultation, custom_advisor, edit_document.
- `core`: Sonnet para seed_chat, compose, session (question + resolve), custom_advisor. Haiku para consultation, specialists, personas, edit_document, file_extract, system_prompt.
- `pro`: Sonnet para todo excepto system_prompt (Haiku).
- `enterprise`: Opus para compose, session_question, session_resolve. Sonnet para resto. Haiku para system_prompt.

**Feature gates** (retornan 403 con `error: 'upgrade_required'`):
- `consultation` — requiere Core+
- `generate_custom_advisor` — requiere Core+
- `edit_document` — requiere Core+

**UpgradeModal**: Se dispara via evento `upgrade-required` desde `safeFetch` (403 + upgrade_required). Botón "Ver planes" → `/settings/planes`.

**Registro free**: `/api/auth/setup` crea `plan: 'free'`, `status: 'activa'`, `balance_usd: 1.00`.

**Offer Architecture** (brand):
- Reason Core = tier `core` ($29/mo)
- Reason Board = tier `pro` ($79/mo)
- Reason Command = tier `enterprise` ($199/mo)

**Fecha:** 2026-03-19

---
