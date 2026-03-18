# Reason — STATUS

Este archivo es la fuente de verdad del estado actual del proyecto.
Faber lo actualiza después de cada sesión de trabajo.

---

## Estado general

Fecha última actualización: 2026-03-17
Etapa actual: TESTS E2E COMPLETOS — Story 4.8 ejecutada. 9/9 tests PASS en full-flow.spec.ts. Playwright 1.58.2 con Chromium. Usuario test: e2e@reason.test. Screenshots generados para todos los pasos. 2 warnings documentados (no son bugs de código).

---

## Lo que funciona

- Login / Registro
- Crear y gestionar proyectos
- Conexión GitHub repo por proyecto
- Semilla con Nexo — conversación persiste en Supabase
- Resumen del Fundador generado al terminar Semilla
- Banner de Semilla completada → router.refresh() → SeedSessionFlow automático
- SeedSession pasos 2-7: Entregables, Cofounders, ConsejoPrincipal, Especialistas, ICPs, ConsejoListo
- Modo voz VAD dos fases (waiting/processing) + interrupción a Nexo + engranaje voz/velocidad
- Deploy activo en Railway y Vercel

## En progreso

- CofoundersPropuesta — FREEZE ✓
- SeedSession__CofounderSelector__Drawer — FREEZE ✓
- EntregablesPropuesta — FREEZE ✓
- Paso X de 7 actualizado en los 7 frames SeedSession ✓
- ConsejoPrincipalPropuesta — hat dots + Cambiar button en 7 cards ✓
- ConsejoPrincipalPropuesta — leyenda sombreros + dots activos/inactivos por asesor ✓
- AdvisoryBoard__MyBoard — leyenda de hat colors 11px ✓ (renombrado desde Projects__AdvisoryBoard__MyBoard)
- SeedSession__AdvisorSelector__Drawer — 4 fixes (pills, cards, badges, banner) ✓
- ConsejoPrincipalPropuesta — dots 10px, outline inactivos, comm style por asesor ✓
- AdvisoryBoard__MyBoard — leyenda inline con labels, comm style por asesor ✓
- SeedSession__AdvisorSelector__Drawer — sección ESTILO DE COMUNICACIÓN en detail panel ✓
- SeedSession__CofounderSelector__Drawer — Tomás Herrera estilo actualizado ✓
- Todos los modales — estilos consistentes (variables → hex explícitos) ✓
- InvitedAdvisorModal — CRUD: "+ Invitar" header, ✏ 🗑 detalle, ⋯ filas ✓
- BuyerPersonaModal — CRUD: "+ Nueva Persona" header, ✏ 🗑 detalle, ⋯ filas ✓
- AdvisoryBoard__MyBoard — leyenda sombreros 11px + comm style 7 cards ✓ (confirmado)
- ConsejoPrincipalPropuesta — FREEZE ✓
- SeedSession__AdvisorSelector__Drawer — FREEZE ✓
- AdvisoryBoard__MyBoard — FREEZE ✓
- EspecialistasPropuesta — botones Aceptar/Descartar por fila, justificación itálica, "Pedir otro especialista" ✓
- SeedSession__EspecialistaSelector__Drawer — edit icon removido, confirm eliminación inline rojo oscuro ✓
- SeedSession__EspecialistaSelector__Drawer — footer 2 filas: Confirmar Invitado (gold full) + Editar/Eliminar (ghost) ✓
- EspecialistasPropuesta — FREEZE ✓
- SeedSession__EspecialistaSelector__Drawer — FREEZE ✓
- ICPsPropuesta — Paso 6 de 7 visible, 3 personas, Aceptar/Descartar, citas itálicas, Agregar perspectiva ✓
- SeedSession__BuyerPersonaSelector__Drawer — ALTERNATIVAS ACTUALES + JOURNEY DE COMPRA + confirmación eliminación ✓
- Projects__AdvisoryBoard__BuyerPersonaModal → renombrado SeedSession__BuyerPersonaSelector__Drawer ✓
- ICPsPropuesta — FREEZE ✓
- SeedSession__BuyerPersonaSelector__Drawer — FREEZE ✓

- ConsejoListo — 6 fixes: ICPs 3 personas, asesores LIDERA/APOYA/OBSERVA, cofounders con nombres, especialistas con nombres, ENTREGABLES, nota Revisar consejo ✓
- ConsejoListo — FREEZE ✓
- CofounderSwapDrawer — drawer funcional, carga por role desde Supabase, filtra actual ✓
- AdvisorSwapDrawer — drawer funcional, carga advisors desde Supabase, excluye actual ✓
- CofoundersPropuesta — botón Cambiar conectado a CofounderSwapDrawer ✓
- ConsejoPrincipalPropuesta — botón Cambiar por card conectado a AdvisorSwapDrawer ✓
- "Ver perfil" ya funcional en ConsejoPrincipalPropuesta, EspecialistasPropuesta, ICPsPropuesta ✓
- Story 4.7 — ProjectView tiles con estado real ✓
  - Pipeline progress: Semilla/Entregables/Consejo/Sesión/Entrega con dots ✓/●/○ reales
  - Tile Semilla: badge Completada/En curso, CTA "Continuar Semilla →" vs "Ver resumen →"
  - Tile Entregables (NUEVO): lista docs con estado, barra progreso, CTA por estado
  - Tile Sesión de Consejo: muestra estado real (activa/completada/pendiente), progreso X de N
  - Tile Consejo Asesor: advisor names + specialty reales (council_advisors join), max 4 + "+N más"
  - Tile Export Center: count por status (generado/aprobado), barra progreso real
  - Sidebar: stats con datos reales (entregables, consejeros, sesión)
  - Eliminados todos los datos hardcodeados (message_count, "hace 2 horas", avatars ficticios, EXPORT_DOCS)

- Fix Part A — ConsejoPrincipalPropuesta muestra solo advisors del council (auto-select) ✓
  - /api/council/auto-select: lee advisors_needed de entregables, mapea categorías, selecciona 5-7 nativos con niveles
  - EntregablesPropuesta: llama auto-select al aprobar, pasa resultado via onCouncilReady
  - SeedSessionFlow: councilAdvisors state, sin prop advisors de página
  - seed-session/page.tsx: ya no carga todos los advisors del marketplace

- Fix Part A+B — Persistencia de paso SeedSession + fixes críticos ✓
  - SeedSessionFlow.advance(): actualiza projects.current_phase en Supabase con el siguiente paso
  - seed-session/page.tsx: lee current_phase y pasa initialStep a SeedSessionFlow
  - SeedSessionFlow: inicializa con initialStep (sin localStorage)
  - ConsejoListo: router.push a /project/[id]/sesion-consejo (no a /project/[id])
  - Botones primarios: CofoundersPropuesta, ConsejoPrincipalPropuesta, EspecialistasPropuesta, ICPsPropuesta → "Siguiente →"

- Story 4.4 — Export Center integrado con content_json ✓
  - page.tsx: query actualizada (key_question, composition, deliverable_index, sin document_specs)
  - ExportCenter.tsx reescrito: tabla, drawer preview, Copiar JSON, estado vacío
  - Drawer: title + key_question_answer + secciones + key_insights + recomendaciones + riesgos
  - Estado vacío con botón "Ir a Sesión de Consejo"
  - /api/export/pdf actualizado: acepta nuevo contentJson (title/key_question_answer/sections/key_insights/recommendations/risks)
  - PDF incluye páginas de insights, recomendaciones y riesgos
  - Navegación verificada: SesionConsejoView → /project/[id]/export ✓, ProjectView → /project/[id]/export ✓
  - TypeScript: clean

- Story 4.3 — UI de Sesión de Consejo ✓
  - SesionConsejoView.tsx reescrito para endpoints start/question/resolve/GET
  - Layout 3 columnas: sidebar fases (260px) + área central + sidebar consejeros (280px)
  - Flujo: init → starting → answering → submitting → debate_ready → resolving → phase_complete → session_complete
  - Modo Normal: cards dual + botones de resolución manual
  - Modo Autopiloto: auto-resolve constructiva/acuerdo después de 1.8s
  - Modo Levantar Mano: auto-resolve responder_yo con input del usuario
  - Celebración de fase con animación bounce + 2.5s pausa → siguiente fase
  - Preview vivo de secciones (section_draft por pregunta resuelta)
  - page.tsx: query documents actualizada (sin document_specs, con composition/key_question/deliverable_index)
  - TypeScript: clean

- Story 4.2 — Sesión de Consejo endpoints ✓
  - POST /api/session/start — crea session + session_phases desde project_documents pendientes
  - POST /api/session/question — Nexo Dual por pregunta (constructive/critical + NexoDualResponse)
  - POST /api/session/resolve — resuelve debate, genera documento final, avanza a siguiente fase
  - GET /api/session/[sessionId] — estado completo: session + fases + dual_responses fase actual
  - SESSION_QUESTION_PROMPT agregado a src/lib/prompts.ts
  - TypeScript: clean (solo errores pre-existentes en e2e tests)

- Story 4.1 — EntregablesPropuesta dinámica — conectada a /api/compose ✓
  - Fetch automático al montar (useEffect + compose())
  - Loading: skeleton 3 cards + mensaje Nexo
  - Cards expandibles: nombre, pregunta clave, badges secciones/consejeros, dependencias
  - "Pedir ajuste" → textarea → recompone con contexto adicional
  - "Aprobar propuesta" → save + advance
  - SeedSessionFlow: sin documentSpecs prop, composedDeliverables state
  - seed-session/page.tsx: sin query a document_specs (tabla eliminada)

- Story 4.0 — POST /api/compose — endpoint de composición dinámica de entregables ✓
  - supabase/migrations/20260317_framework_engine.sql (DROP document_specs + ADD composition/deliverable_index/key_question)
  - COMPOSE_DELIVERABLES_PROMPT agregado a src/lib/prompts.ts
  - src/app/api/compose/route.ts — lee founder_brief, llama Claude tier:strong, guarda ProjectDocuments
  - Tabla project_documents verificada: existe en migration 005, nombre correcto
  - ⚠️ Juan debe ejecutar 20260317_framework_engine.sql en Supabase SQL Editor

- Framework Engine instalado — aurum_framework_engine.md creado, aurum_document_specs.md eliminado ✓
  - aurum_brain.md, aurum_incubadora.md, aurum_documents.md, CLAUDE.md actualizados ✓
  - aurum_decisions.md: Decisión #48 agregada ✓

- scripts/generate-marketplace.ts — resumable, Sonnet, skip logic por sección ✓
  - Estado DB actual (2026-03-17): Advisors 340/1,000 · Cofounders 124/40 · Specialists 431/200 · Personas 0/200
  - ⚠️ BLOQUEADO: API limit Anthropic — se renueva 2026-04-01 00:00 UTC
  - Script es completamente resumable — re-ejecutar después del 1 Abr para completar advisors + personas

- Projects__Incubator__Default — 12 fixes: header Reason, breadcrumb multi-color, FinTrack, toggle Normal, remove Sí/No, remove Etapa redundante, remove Semilla, Experto UX 0%, Experto en Producto En espera, PREVIEW sobre PROGRESO, remove thumbs replies, Responder yo ✓

- Documents__Viewer__Ajustes/Contenido/Identidad — AURUM→FinTrack (31 refs), secciones spec (Hipótesis, Encaje, Customer Personas), chips sugerencias, rename frames ✓
- Documents__Viewer — header contraste (#141F3C + border azul), textos blancos, "Sesión de Consejo" en 3 frames ✓

- Documents__Viewer__Ajustes/Contenido/Identidad — FREEZE ✓

- Export__Center__Default — rediseño completo v1: breadcrumb, subtítulo, barra progreso, cards Listo/Pendiente, PDF completo, Estrategia de Comunicación ✓
- Export__Center__Default — rebuild v2: tabla escalable CRUD con header acciones globales, 5 filas, estados Listo/Pendiente, acciones por fila, paginación ✓
- Export__Center__Default — FREEZE ✓ (aprobado por Juan)

- Marketing__Landing__Default — rebuild completo desde cero: 10 secciones (Hero, Problema, Para Quién, Cómo Funciona, Consejo IA, Documentos, Nexo Dual, Suite AVA, CTA Final, Footer) ✓
- Marketing__Landing__Default — copies rescatados: 5 headlines/subtítulos reemplazados con versión original de mayor fuerza ✓
- Marketing__Landing__Default — hero mockup activo (3 cols: consejo, debate, turno activo) + textGrowth fixed en 30 nodos (ICP, docs, steps, consejo, AVA, stats) ✓
- Marketing__Landing__Default — hero mockup rediseñado: dots 4 colores, pregunta bold 14px, bloques wireframe gold/rojo, altura 360px ✓
- Marketing__Landing__Default — FREEZE ✓ (aprobado por Juan)
- aurum_decisions.md — decisiones 45 (mascota pulpo Nexo), 46 (ambient music Sesión de Consejo) y 47 (consultoría activa post-sesión) registradas ✓

- Projects__ProjectView__Default — card CONSULTORÍA ACTIVA añadida (gold border top, 2 consultas badge, cita itálica, CTA gold); tiles reestructurados en 2 filas (3+2) ✓
- Projects__Consultoria__Default — nuevo frame: nav + 3 cols (sidebar consejo, chat Nexo+asesores, sidebar docs/contexto/acciones) ✓
- Projects__ProjectView__Default — fix tile_export: "Marca" → "Comunicación" en pendientes ✓
- Projects__Consultoria__Default — fix input: íconos 📎 🎙 añadidos antes del botón enviar ✓
- Projects__ProjectView__Default — FREEZE ✓ (aprobado por Juan)
- Projects__Consultoria__Default — FREEZE ✓ (aprobado por Juan)
- aurum_default_frames.md — inventario completo reestructurado y limpio ✓

- CreateProject__Modal — pills renombrados (lenguaje humano), overlay navy, sin X (solo Cancelar) ✓
- InviteCollaborator__Modal — descripción de rol bajo pills, overlay navy, sin X (solo Cancelar) ✓
- ConfirmAction__Modal — título/desc/botón contextuales (eliminar proyecto), overlay navy ✓
- 3 modales — padding:24 añadido a modalCard (RCoeo, X4DQq, gzOh8) ✓
- 3 modales — X close removido de todos: cierre unificado vía Cancelar ✓
- CreateProject__Modal — FREEZE ✓ (aprobado por Juan)
- InviteCollaborator__Modal — FREEZE ✓ (aprobado por Juan)
- ConfirmAction__Modal — FREEZE ✓ (aprobado por Juan)

- Settings__Account__Default — nuevo frame: nav + sidebar (Cuenta activo) + 4 secciones (Perfil, Preferencias, Seguridad, Zona de Peligro) ✓
- Settings__Billing__Default — nuevo frame: nav + sidebar (Facturación activo) + 5 secciones (Saldo, Plan, Historial, Método de Pago, Facturas) ✓
- Settings sidebar actualizado a 6 tabs en Account y Billing (Equipo, Planes, Notificaciones, Conexiones añadidos) ✓
- Settings__Team__Default — nuevo frame: tabla MIEMBROS + INVITACIONES + CTA INVITAR ✓
- Settings__Plans__Default — nuevo frame: TU PLAN ACTUAL + COMPARA PLANES (3 cards) + ALERTAS ✓
- Settings__Notifications__Default — nuevo frame: RECIENTES (5 items) + CONFIGURACIÓN (4 grupos toggles) ✓
- Settings__Connections__Default — nuevo frame: REPOSITORIOS (GitHub conectado) + EXPORTACIÓN (Slides, Notion) + COMUNICACIÓN (Slack) + GESTIÓN (Jira, Linear) ✓
- Settings__Team__Default — FREEZE ✓ (aprobado por Juan)
- Settings__Plans__Default — FREEZE ✓ (aprobado por Juan)
- Settings__Notifications__Default — FREEZE ✓ (aprobado por Juan)
- Settings__Connections__Default — FREEZE ✓ (aprobado por Juan)

- context/reason_entities.md — creado: 26 entidades, relaciones y mapa de datos por pantalla ✓
- context/reason_backlog.md — creado: 9 epics, 38 stories, backlog ordenado por dependencias ✓
- context/aurum_default_frames.md — sincronizado: 35 frames FREEZE, 0 pendientes ✓
- CLAUDE.md — referencias reason_entities + reason_backlog añadidas ✓

## Story 1.1 — Schema de Supabase (COMPLETO ✓)

- supabase/migrations/005_reason_schema.sql — 23 tablas nuevas, 29 ALTER TABLE, 41 RLS policies, 20 índices ✓
- supabase/migrations/006_seed_catalogs.sql — 7 advisors + 4 cofounders + 4 document_specs ✓
- scripts/apply-migrations.js — script de aplicación vía Management API ✓
- Migraciones aplicadas en Supabase: 005 + 006 ✓
- Verificado: 16 advisors (7 Reason nativos), 4 cofounders, 4 document_specs ✓

## Story 1.2 — Auth completo (COMPLETO ✓)

- login/page.tsx — forgot password link + "Enviar enlace" button ✓
- register/page.tsx — confirm-password + redirect /verify-email + /api/auth/setup call ✓
- middleware.ts — verify-email, forgot-password, forgot-password-sent añadidos a isAuthPage ✓
- verify-email/page.tsx — nuevo: resend con supabase.auth.resend, email por query param ✓
- forgot-password/page.tsx — nuevo: resetPasswordForEmail → redirect /forgot-password-sent ✓
- forgot-password-sent/page.tsx — nuevo: mensaje confirmación + link login ✓
- api/auth/setup/route.ts — nuevo: crea profiles + token_balances + subscriptions (service role) ✓

## Story 1.3 — Layout global + Routing (COMPLETO ✓)

- Fix profiles/setup: `full_name`→`name`, `balance`→`balance_usd` ✓
- (dashboard)/layout.tsx — header global: logo, balance, notificaciones, UserMenu ✓
- UserMenu.tsx — dropdown: Configuración + Cerrar sesión (client component) ✓
- SettingsSidebar.tsx — 6 tabs con active state via usePathname + botón signOut ✓
- settings/layout.tsx — wrapper con sidebar ✓
- 6 rutas placeholder: semilla, sesion-consejo, consultoria, export, documento/[docId], consejo ✓
- 6 rutas settings placeholder: cuenta, facturacion, equipo, planes, notificaciones, conexiones ✓

## Story 1.4 — Dashboard (COMPLETO ✓)

- DashboardClient.tsx — grid responsive 2-3 cols, fase pill por color, empty state ✓
- CreateProjectModal.tsx — nombre + 3 pills entry_level + INSERT projects → /project/[id]/semilla ✓
- ProjectCard.tsx — acepta description + phasePill (additive, no breaking) ✓
- (dashboard)/page.tsx — query por user_id directo (sin organizations) ✓

## Alineación visual UI (COMPLETO ✓)

- Fonts: Outfit (headings/buttons) + Open Sans (body) añadidos a root layout.tsx ✓
- Tailwind: `font-outfit` y `font-sans` (Open Sans) definidos en theme ✓
- AuthBrandPanel.tsx — componente compartido: panel izquierdo con logo imagen, headline, features/checklist ✓
- Login — two-column layout: brandPanel + formPanel (mode toggle + Google OAuth) ✓
- Register — two-column layout: brandPanel register variant + form (email/pass/confirm) ✓
- VerifyEmail — two-column layout: email gold + resend button outline ✓
- ForgotPassword — two-column layout: email input + CTA ✓
- ForgotPasswordSent — two-column layout: email gold + expiry + back link ✓
- Dashboard layout — logo `/branding/logo-claro-reason.png` en header (Image, no texto) ✓
- ProjectCard — rediseñado: list-row, progress bar oro, phase pill, arrow link ✓
- DashboardClient — layout list (flex-col gap-3), colores y tipografía actualizados ✓
- CreateProjectModal — colores actualizados a tokens `#B8860B` / `#0D1535` ✓
- Design tokens aplicados: bg `#0A1128`, card `#0D1535`, border `#1E2A4A`, gold `#B8860B` ✓
- CLAUDE.md — reglas permanentes: fidelidad visual + logo ✓

### Fix Auth__Login__Default — delta vs frame (2026-03-12) ✓

- AuthBrandPanel: íconos SVG stroke gold (no emojis) — Semilla, Consejo IA, Documentos, Exportar
- AuthBrandPanel: labels corregidos — Escalamiento→Documentos, Ejecutar→Exportar, Consejo AI→Consejo IA
- AuthBrandPanel: subtítulo default actualizado al copy del frame
- AuthBrandPanel: testimonial quote + autor (Carlos M., Fundador — SaaS B2B)
- Login: subtítulo → "Ingresa tus credenciales para continuar."
- Login: label "Selecciona el tipo de acceso" sobre los tabs
- Login: tabs pill shape (rounded-full, py-1.5, text-xs, borde sutil)
- Login: password input con ícono ojo toggle (show/hide)

## Story 1.5 — ProjectView (COMPLETO ✓)

- `/project/[id]/page.tsx` — reescrito completo según frame Projects__ProjectView__Default
- Eliminado header duplicado (dashboard layout ya lo provee)
- Journey 5 etapas con stepper: Semilla → Selección de Consejeros → Definición de Entregables → Sesión de Consejo → Entrega
- 3 tiles superiores: Semilla (estado + CTA), Sesión de Consejo (activa/bloqueada), Consultoría Activa
- 2 tiles inferiores: Consejo Asesor (3 cols, avatars), Exportación (2 cols, doc list + progress bar)
- Sidebar derecho: stats (etapas/mensajes/tiempo), Fase Actual, Último Insight, Documentos count
- Fetch defensivo de: `councils`, `project_documents`, `consultations` (maybeSingle, graceful null)
- Design tokens correctos: #0D1535 cards, #1E2A4A borders, #B8860B gold
- Rutas placeholder existentes: semilla, sesion-consejo, consejo, consultoria, export, documento/[docId]

### Fix ProjectView — delta vs frame (2026-03-12) ✓

- layout.tsx: balance stacked + badge notif rojo
- UserMenu.tsx: avatar gold #B8860B, nombre blanco, dropdown tokens correctos
- page.tsx: last_active_at relativo + sección PROPÓSITO DEL CONSEJO
- page.tsx: barra progreso continua + etapas ✓/●/○
- page.tsx: bordes color por estado, labels por estado, CTAs gold/ghost
- page.tsx: Consultoría tile con última pregunta + advisor
- page.tsx: Exportación 4 docs correctos (sin Marca, con Plan de Negocio)
- page.tsx: sidebar stats gold + Último Insight con borde gold

## Story 2.1 — SeedSession routing + visual (COMPLETO ✓)

- semilla/page.tsx → redirect a `/project/[id]/incubadora`
- IncubadoraChat.tsx → tokens actualizados (#C9A84C→#B8860B, #1A1B1E→#0D1535, #2a2b30→#1E2A4A, #6b6d75/#9a9ba5/#3a3b40→#8892A4/#1E2A4A, #0F0F11→#0A1128)
- IncubadoraChat.tsx → step indicator "Fase X de 13" → "Paso X de 7"
- incubadora/page.tsx → movido fuera de (dashboard) a `src/app/project/[id]/incubadora/` para evitar header duplicado

### Fix Incubadora — logo + voice mode (2026-03-12) ✓

- src/lib/logo.ts: LOGO_DATA_URL base64 extraído a archivo compartido
- AuthBrandPanel.tsx: import desde lib/logo (elimina ~33k chars inline)
- IncubadoraChat.tsx: header texto "Reason" → img con LOGO_DATA_URL
- voiceMode: arranca en false, VoiceModePanel solo renderiza on demand (ya correcto)

## Story 4.1 + 4.2 — Sesión de Consejo (COMPLETO ✓)

- src/lib/prompts.ts — NEXO_SESSION_QUESTION_SYSTEM, NEXO_CONSTRUCTIVO_SYSTEM, NEXO_CRITICO_SYSTEM, NEXO_SYNTHESIS_SYSTEM añadidos ✓
- src/app/api/session/turn/route.ts — Motor Nexo Dual con acciones start/debate/resolve ✓
  - start: crea Session + SessionPhases, genera preguntas para primer documento
  - debate: Constructivo → Crítico → Síntesis, guarda NexoDualResponse
  - resolve: registra resolución, avanza question_index, detecta phase/session completa
- src/app/project/[id]/sesion-consejo/page.tsx — Server component: fetch proyecto + council + documentos + sesión activa ✓
- src/components/sesion-consejo/SesionConsejoView.tsx — UI 3 columnas completa ✓
  - Left sidebar: consejo por nivel + cofounders
  - Center: pregunta activa + cards Constructivo vs Crítico + historial
  - Right sidebar: botones de acción, progreso por documento, momentum, preview en vivo
  - Modos: Normal / Autopiloto / Levantar Mano
  - Estados: init → starting → question_ready → debating → debate_ready → resolving → phase_complete → session_complete

## Story 4.3 — Preview en vivo + Aprobación de documentos (COMPLETO ✓)

- src/lib/prompts.ts — NEXO_SECTION_WRITER_SYSTEM añadido ✓
- src/app/api/session/turn/route.ts — actualizado ✓
  - handleResolve: genera sección con Haiku tras cada resolución, upsert content_json, retorna generatedSection
  - handleApprove (nueva acción): marca doc como aprobado, avanza a siguiente fase
  - generateSection(): Haiku genera JSON {section_name, content, key_points} mapeado a spec sections
  - upsertDocumentSection(): upsert en project_documents.content_json
- src/components/sesion-consejo/DocumentPreview.tsx — nuevo ✓
  - Secciones expandibles con checkmark verde + key points como bullets
  - Indicador pulsante mientras genera
  - Placeholders grises para secciones pendientes
  - Auto-scroll a última sección
- src/components/sesion-consejo/SesionConsejoView.tsx — actualizado ✓
  - documentSections state (Record<docId, DocumentSection[]>)
  - isGeneratingSection, pendingApprovalDocId/PhaseIndex, isApproving
  - phase_complete reemplazado por awaiting_approval — muestra documento completo + "Aprobar documento →"
  - Preview en Vivo en sidebar derecho usa DocumentPreview real

## Story 5.1 — Documents Viewer + Export Center (COMPLETO ✓)

- /project/[id]/documento/[docId] — viewer 3 tabs (💬 Ajustar / ✏️ Contenido / 🎨 Identidad) ✓
  - Header: breadcrumb + dots nav + export buttons (PDF/PPT/Slides)
  - Left: slide sidebar (40px) + main slide viewer (section cards)
  - Right: tabbed panel (chat mock / section list + nav / branding)
- /project/[id]/export — Centro de Exportación ✓
  - Progress bar (X/Y listos), table con estado/fecha/acciones, bulk PDF download
- POST /api/export/pdf — jspdf dark-theme PDF (cover + section slides) ✓
- POST /api/export/pptx — pptxgenjs WIDE PPTX con paleta Reason ✓
- jspdf + pptxgenjs instalados ✓

## Story 6.1 — Consultoría Activa (COMPLETO ✓)

- /project/[id]/consultoria — gate (current_phase !== 'completado' → locked view) ✓
- Layout 3 columnas: sidebar consejo (280px, #070E20) | chat (fill) | sidebar docs/contexto/acciones (300px) ✓
- Chat: burbujas Nexo (azul), Advisor (gold border), User (gold bg, derecha) ✓
- Input: text + 📎 🎙 + botón gold enviar ✓
- Acciones rápidas: 4 chips clicables que envían directamente ✓
- POST /api/consultoria/chat ✓
  - Verifica project.current_phase === 'completado'
  - Fetch documentos aprobados como contexto
  - Fetch consejeros del council
  - Genera respuesta multi-advisor con NEXO_CONSULTORIA_SYSTEM (Sonnet)
  - Persiste en consultations.messages (JSONB)
  - Soporta crear nueva consulta o continuar existente
- NEXO_CONSULTORIA_SYSTEM prompt añadido a src/lib/prompts.ts ✓

## Story 7.1 — Settings funcionales (COMPLETO ✓)

- Settings layout reescrito: full-width, sidebar #070E20 (220px) + main con padding correcto ✓
- SettingsSidebar actualizado: design tokens correctos (#070E20 bg, #B8860B active, #8B9DB7 inactivo) ✓
- Settings Account (/settings/cuenta) ✓
  - Fetch profiles (name, avatar_url, language, timezone)
  - Form editable: nombre + idioma + timezone
  - Email readonly + badge "Verificado"
  - Toggles notificaciones/voz
  - Seguridad: cambiar contraseña + cerrar sesiones
  - Zona de Peligro: botón eliminar con modal confirmación
  - PATCH /api/settings/profile — UPDATE profiles ✓
- Settings Billing (/settings/facturacion) ✓
  - Fetch token_balances, subscriptions, token_usage, invoices, payment_methods
  - Saldo + plan actual + historial consumo + método de pago + facturas
  - Todo readonly (pagos post-MVP)
- Settings Team (/settings/equipo) ✓
  - Tabla miembros (owner + council advisors como proxy)
  - Modal "Invitar colaborador" con email + rol + descripción de permisos
  - Confirmación inline eliminación por fila

## Story 3.1 — Advisory Board (COMPLETO ✓)

- /project/[id]/consejo — MyBoard con hat tracker, LIDERA/APOYA/OBSERVA, especialistas, buyer personas ✓
- foundersSidebar (280px, rounded-xl): cofounders IA + humanos, totales, CTA "Consultar al consejo →" ✓
- Hat dots 6 sombreros (blanco/negro/rojo/amarillo/verde/azul) con cobertura calculada ✓
- LIDERA cards: border #C5A55A (gold), hat dots, "Cambiar ↗" button ✓
- src/app/project/[id]/consejo/page.tsx + src/components/consejo/MyBoard.tsx ✓

## Story 8.1 — Landing Page (COMPLETO ✓)

- src/app/page.tsx — estática server component, 10 secciones ✓
  - Nav (logo + Características/Precio + Comenzar →)
  - Hero (headline + subtítulo + 2 CTAs + product mockup)
  - Problema (headline + 3 stat cards)
  - Para Quién (4 ICP cards)
  - Cómo Funciona (5 step cards)
  - Consejo IA (6 advisor cards)
  - Documentos (8 doc cards)
  - Nexo Dual (constructivo vs crítico)
  - Suite AVA (3 product cards, Reason gold border)
  - CTA Final + Footer
- Redirect a /dashboard si autenticado ✓
- middleware.ts actualizado: / como ruta pública, redirect auth a /dashboard ✓
- Dashboard movido a /dashboard (src/app/(dashboard)/dashboard/page.tsx) ✓
- Links href="/" actualizados a href="/dashboard" en 4 archivos ✓

## Story 7.x — Settings restantes (COMPLETO ✓)

- /settings/planes — 3 cards Core/Pro/Enterprise con features y botones de acción ✓
- /settings/notificaciones — toggles por categoría (Actividad + Email) ✓
- /settings/conexiones — GitHub disponible + 4 próximamente ✓

## Epic 9.6 — Nomenclatura + Persistencia + Fix TS (COMPLETO ✓)

- Rename `/incubadora` → `/seed-session`: nueva página + redirect backwards-compat ✓
- Nomenclatura UI: "Incubadora"/"Semilla" → "Seed Session" (Nexo chat), "Sesión de Consejo" (pasos 2-7) ✓
  - IncubadoraChat.tsx: header, sidebar h2, banner, pending text ✓
  - SeedSessionFlow.tsx: header, sidebar h2 ✓
  - AuthBrandPanel.tsx: feature label ✓
  - DashboardClient.tsx: phase label ✓
  - ProjectView page.tsx: tile label + JOURNEY_STAGES ✓
  - semilla/page.tsx: redirect target actualizado ✓
  - GitHubOnboardingWizard.tsx: push URL actualizado ✓
- SeedSessionFlow localStorage persistence: estado persiste entre page refreshes (key: `sesion_consejo_${projectId}`) ✓
- ConsejoListo: onComplete? → clearStorage antes de redirect ✓
- TypeScript fix: `Set<string>` spread → `Array.from()` en settings/notificaciones ✓
- E2E test 5: URL `/incubadora` → `/seed-session`, texto `Sesión Semilla` → detecta `Seed Session` o `Sesión de Consejo` ✓
- TypeScript check: 0 errores ✓

## Epic 9 — Polish pre-demo (COMPLETO ✓)

- 9.1 Screenshots Pencil — BLOQUEADO (MCP Pencil no respondía en sesión). Pendiente para siguiente sesión.
- 9.2 Known fixes verificados: Register AuthBrandPanel variant="register" ✓, CTAs landing → /register ✓, token balance lee de BD ✓, settings sidebar 6 tabs + active state ✓
- 9.3 Copy consistency:
  - DashboardClient: 'Incubadora' → 'Sesión Semilla' ✓
  - planes/page.tsx: 'venture' → 'proyecto' ✓
  - seed-session: ConsejoListo/ConsejoPrincipal/Entregables/ICPs — 'venture' → 'proyecto'/'negocio' ✓
  - page.tsx landing: 7 instancias 'venture' → 'proyecto'/'negocio' ✓
  - github/init: 'Venture creado' → 'Proyecto creado' ✓
- 9.4 UX: favicon añadido a layout.tsx (/branding/favicon-claro-reason.png) ✓, loading.tsx creados para (dashboard) y project/[id] ✓, empty states existentes verificados (dashboard ✓, export ✓, MyBoard ✓)
- 9.5 Cleanup: console.logs solo en _archive (no acción) ✓, .env.example actualizado con todas las variables ✓, README.md actualizado (rutas, setup, stack, E2E) ✓

## Epic 9.1 continuación — Responsive + Route fix (COMPLETO ✓)

- Tarea 1 — Responsive landing page: breakpoints 375/768/1024/1440px
  - nav: links hidden en mobile, px-4/md:px-8/lg:px-16 ✓
  - hero: text-[32px] md:text-[48px], CTAs flex-col → sm:flex-row, full-width en xs ✓
  - secciones: grids 1→2→3/4 cols con sm:/md: breakpoints ✓
  - footer: flex-col en mobile ✓
- Tarea 2 — Auth responsive: AuthBrandPanel ya tiene `hidden lg:flex`, form panel toma full-width en mobile ✓
- Tarea 3 — Dashboard responsive: DashboardClient header flex-wrap gap-3 ✓
- Tarea 4 — Off-palette colors: auth/confirm/page.tsx — #0F0F11→#0A1128, #C9A84C→#B8860B, #1A1B1E→#0D1535, #2a2b30→#1E2A4A ✓
- Tarea 5 — Rutas restauradas:
  - export: ExportCenter con fetch real documents ✓
  - consultoria: ConsultoriaView con fetch real (advisors, docs, consultations) ✓
  - sesion-consejo: SesionConsejoView con fetch real (council, session, phases) ✓
  - consejo: MyBoard con fetch real (advisors, cofounders, specialists, buyerPersonas) ✓
  - documento/[docId]: DocumentoViewer con fetch real ✓
  - ConsultoriaView import path: project/[id]/ → (dashboard)/project/[id]/ ✓
  - MyBoard import path: project/[id]/ → (dashboard)/project/[id]/ ✓
  - Eliminado project/[id]/documento/[docId]/page.tsx (duplicado) ✓

## Epic 9.7 — Build limpio + polish final (COMPLETO ✓)

- ESLint: 18 errores → 0 errores (unescaped entities + @typescript-eslint disable comments) ✓
- .eslintrc.json creado con next/core-web-vitals ✓
- Accesibilidad axe/forms: aria-label/htmlFor en 4 inputs (GitHubOnboardingWizard, ProjectCard, ConsultoriaView, SesionConsejoView) ✓
- Microsoft Edge Tools no-inline-styles: .hintrc + .vscode/settings.json (webhint off) ✓
- markdownlint aurum_brain.md: MD012 + MD032 corregidos ✓
- extract-text route: import dinámico pdf-parse + force-dynamic (fix DOM APIs en build) ✓
- **npm run build → EXIT:0** ✓ — build de producción limpio
- TypeScript: 0 errores ✓
- ESLint: 0 errores, 4 warnings intencionales ✓

## Fix no-inline-styles (COMPLETO ✓)

- page.tsx: stat colors + advisor hat dots → propiedades `colorClass`/`hatBg` con Tailwind completo ✓
- MyBoard.tsx: `HAT_BG_CLASSES` map con strings Tailwind estáticos + `opacity-*` en className ✓
- ExportCenter.tsx: progress bar → `useRef` + `useEffect` elimina `style=` del JSX ✓
- 5 errores PROBLEMS panel → 0 ✓

## Fix bug — project_documents columnas inexistentes (COMPLETO ✓)

- `created_at` no existe en `project_documents` — corregido en 4 archivos → `.order('generated_at', nullsFirst: true)` ✓
  - `sesion-consejo/page.tsx`, `api/session/turn/route.ts` (fix anterior)
  - `export/page.tsx`, `consultoria/page.tsx`, `documento/[docId]/page.tsx` (fix actual)
- `updated_at` no existe en `project_documents` — corregido → `last_edited_at` en `export/page.tsx` + `ExportCenter.tsx` ✓
- `create-user.js` actualizado con `fixFinTrackDocuments()` — asegura docs `status: aprobado` + `content_json` para tests ✓

## Fix bug — project_documents order('created_at') (COMPLETO — incluido arriba)

- `sesion-consejo/page.tsx` + `api/session/turn/route.ts`: `.order('created_at')` → `.order('generated_at', nullsFirst: true)` ✓
  - `project_documents` no tiene columna `created_at` — query fallaba silenciosamente → "No hay documentos configurados"
  - Detectado via E2E smoke test de Sesión de Consejo

## Smoke test — Debate completo + Export PDF E2E (COMPLETO ✓)

- `tests/e2e/sesion-consejo.spec.ts` — 2 tests, **2/2 PASS** ✓
- **Test 1 — Full debate flow**: Iniciar → pregunta IA → Iniciar Debate → Constructivo + Crítico → Elegir Constructiva → sección generada → progreso sidebar ✓
- **Test 2 — Export PDF**: Centro de Exportación 4/4 Listo → Descargar → `Value_Proposition_Canvas.pdf` descargado ✓
- `create-user.js` actualizado: `fixFinTrackDocuments()` + `setupSessionTest()` ✓

## Fix crítico — Session persistence (COMPLETO ✓)

- seed-session/page.tsx: `.single()` → `.order('updated_at').limit(1)` + `conversations?.[0] ?? null` ✓
  - Causa raíz: `.single()` retorna null cuando existen 2+ filas (race conditions) → creaba conversación vacía
  - Fix: obtener la conversación más reciente ordenando por `updated_at DESC LIMIT 1`
- SeedSessionFlow localStorage persistence: ya estaba implementado correctamente ✓
  - Restaura step guardado en mount, persiste en cada cambio, limpia en ConsejoListo

## Estado final del proyecto

**DEMO-READY** — 9 Epics completos, build limpio, deploy activo en Railway.

- 9/9 rutas funcionales con datos reales
- TypeScript + ESLint limpios
- Nomenclatura consistente (Seed Session / Sesión de Consejo)
- Responsive 375/768/1024/1440px
- Persistencia localStorage en SeedSessionFlow
- Auth completo (login/register/verify/forgot)

## Epic Stripe — Pagos integrados (COMPLETO ✓)

- `npm install stripe @stripe/stripe-js` ✓
- `src/lib/stripe.ts` — cliente lazy (getStripe()) para evitar error build sin env var ✓
- `src/app/api/stripe/checkout/route.ts` — POST: crea Stripe Checkout session (subscription/payment) ✓
- `src/app/api/stripe/webhook/route.ts` — POST: verifica firma, maneja checkout.session.completed + subscription.updated/deleted ✓
- `src/app/(dashboard)/settings/planes/page.tsx` — cliente, botones "Cambiar a Pro/Enterprise" → checkout real ✓
- `src/components/settings/SettingsBilling.tsx` — "Recargar saldo" expande selector $10/$50/$100 → checkout payment ✓
- `src/components/ui/Toast.tsx` — global toast system (ToastProvider en layout) ✓
- `.env.example` — STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET añadidas ✓
- `npm run build` → EXIT:0 ✓

Acciones pendientes para Juan:

1. Crear Products + Prices en Stripe Dashboard (test mode) → reemplazar placeholders en planes/page.tsx + SettingsBilling.tsx
2. Configurar webhook endpoint en Stripe → URL: `https://<railway-url>/api/stripe/webhook`
3. Copiar `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` a Railway env vars
4. SQL migration en Supabase: `ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id text; ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id text;`

## Epic Toast + Dead Buttons — UI funcional (COMPLETO ✓)

- Toast system global: Toast.tsx + ToastProvider en layout.tsx ✓
- 16/19 botones muertos resueltos: toasts contextuales + handlers reales ✓
- GitHub OAuth: conexiones/page.tsx → /api/auth/github ✓
- Cambiar contraseña: supabase.auth.resetPasswordForEmail ✓
- Fuentes locales: Outfit + OpenSans woff2 en public/fonts (fix Railway build) ✓

## Fix crítico — conversations.phase constraint (COMPLETO ✓)

- `phase: 'semilla'` violaba CHECK constraint — corregido a `phase: 'seed'` en 3 archivos ✓

## Epic Session Engine — Rediseño motor Sesión de Consejo (COMPLETO ✓)

Kira 12-fix session engine redesign + Porfirio feedback fixes + Fix 13 ProjectView.

**Porfirio Feedback (7 fixes):**

- Preguntas 3→6 por documento ✓
- Pre-aceptar todos los especialistas/personas por defecto ✓
- AdvisorProfileDrawer — "Ver perfil" en 3 pasos del seed session ✓
- "Cambiar" → "Quitar"/"Agregar" con estado visual ✓
- /api/seed-session/generate — Claude genera especialistas/personas adicionales ✓
- Markdown en debate cards + DocumentPreview (react-markdown + @tailwindcss/typography) ✓
- Prompts Constructivo/Crítico: perspectivas independientes (no se responden entre sí) ✓

**Kira 12-fix (aplicados):**

- Fix 2: session-questions.ts — preguntas canónicas por documento (Game Theory: Players/Rules/Incentives) ✓
- Fix 2 (cont.): adaptQuestionsToContext() — personaliza al contexto del founder ✓
- Fix 3: generateSection prompt mejorado — debate completo, mín 300 palabras ✓
- Fix 4: handleApprove detecta secciones faltantes y las genera antes de aprobar ✓
- Fix 6: max_tokens aumentados — debate 4096, sections 8192, synthesis 2048 ✓
- Fix 10: Constructivo y Crítico responden INDEPENDIENTEMENTE a la pregunta (en paralelo) ✓
- Fix 11: racional detrás de números obligatorio en prompts ✓
- Fix 12: find\_common\_ground — síntesis como resolutionContent cuando el founder busca punto medio ✓
- Decision #48: Game Theory meta-framework registrado en aurum_decisions.md ✓

**Fix 13 — ProjectView post-sesión:**

- Fix 13.1: founder\_brief preview strips raw markdown (\#\#, \*\*, \_, \`) ✓
- Fix 13.2: advisor\_count desde council\_advisors JOIN (fix RLS 0 asesores) ✓
- Fix 13.3: docsReady desde project\_documents.status === 'aprobado' (no project columns) ✓
- Fix 13.4: Consultoría se desbloquea si session.status === 'completada' (no solo consultation) ✓

**Fixes adicionales (sesión 2):**

- Fix 1: Advisors en el debate — Haiku selecciona 2-3 consejeros relevantes, genera respuestas; cards antes de cofounders ✓
- Fix 5: Pedir revisión — input inline en awaiting\_approval; genera pregunta de revisión para sección específica ✓
- Fix 7: Momentum UI — localMomentum state que se actualiza en cada resolve sin esperar DB ✓
- Fix 12 UI: "Buscar punto medio" en sidebar debate\_ready → find\_common\_ground resolution ✓
- Fix 8: Nombres en sidebar ya correctos (spread ca.advisors en page.tsx) — no requería fix

## Refactor 3 tiers de modelo — fast/strong/reasoning (COMPLETO ✓)

- `src/lib/claude.ts` — nueva interfaz `callClaude({ system, messages, max_tokens?, tier? })` ✓
- `fast` (Haiku): Semilla chat, preguntas canónicas, adaptQuestionsToContext, voice, topics, seed-session/generate ✓
- `strong` (Sonnet): debate constructivo/crítico, síntesis, advisors, secciones de documentos, consultoría, extract ✓
- `reasoning` (Opus): founder_brief + game_analysis (2 llamadas por proyecto) ✓
- 11 archivos actualizados (10 callers + archive) — TypeScript 0 errores ✓
- `aurum_decisions.md` — decisión #49 registrada ✓

## Epic Game Analysis — Nexo mapea el juego estratégico post-Semilla (COMPLETO ✓)

- `NEXO_GAME_ANALYSIS_SYSTEM` prompt añadido a `src/lib/prompts.ts` ✓
- `game_analysis` field añadido a `Project` type en `src/lib/types.ts` ✓
- `/api/chat/route.ts` — genera `game_analysis` (Haiku 4096 tokens) al completar Semilla ✓
  - Ambas rutas: streaming (`[CONSEJO:...]`) y non-streaming
  - Guarda `founder_brief` + `game_analysis` juntos en `projects`
- `/api/session/turn/route.ts` ✓
  - `generateQuestions` → `adaptQuestionsToContext` recibe `gameAnalysis` y lo inyecta en el prompt
  - `handleDebate` fetches `game_analysis` y construye `gameContext` (players + tensiones + conflictos)
  - Contexto del juego inyectado en prompts de constructivo y crítico
- `ProjectView` sidebar: muestra las 3 primeras tensiones clave si existe `game_analysis` ✓
- `aurum_decisions.md` — decisión #48 extendida con implementación Game Analysis ✓

Acción requerida de Juan:

```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS game_analysis jsonb;
```

## Siguiente paso

Configurar Google OAuth en Supabase Dashboard (Google Cloud Console) + confirmar reason.guru CNAME en Railway

---

## Entornos

| Entorno | URL |
| --- | --- |
| Local | `http://localhost:3000` |
| Railway | `https://aurum-production-e205.up.railway.app` |
| Vercel | `https://aurum-navy.vercel.app` |

---

## Commits recientes

| Hash | Descripción |
| --- | --- |
| e5da846 | docs: FREEZE Settings__Team / Plans / Notifications / Connections |
| 7a8058b | feat: Settings — 6 frames completos (Account, Billing, Team, Plans, Notifications, Connections) |
| 2c78c3f | feat: sistema personalidad consejeros + fixes visuales — 8 tareas |
| a56a531 | fix: AdvisorSelector + ConsejoPrincipalPropuesta + MyBoard — 7 correcciones |
| f002b67 | fix: ConsejoPrincipalPropuesta + MyBoard + AdvisorSelector — 6 correcciones |
| 3e65985 | fix: EntregablesPropuesta — secciones reales, paginación restaurada, textos spec |
| 31461c0 | fix: EntregablesPropuesta — detail expandible, botón renombrado, Paso X de 7 |
| ea96e7c | refactor: renombrar CatalogDrawerModal → CofounderSelector__Drawer + eliminar modal redundante |
| fc2a1da | fix: CatalogDrawerModal — segunda ronda paleta (slots, hats, sliders, tooltip) |
| 33350a3 | fix: CatalogDrawerModal — tonos negros y campos fantasma |
| 4008ab4 | feat: SeedSession__CambiarCofounder__Modal rebuild paleta correcta |
| 1b876fa | fix: CofoundersPropuesta + CatalogDrawerModal — 6 correcciones |
| 4532428 | fix: ConsejoPrincipalPropuesta — NEXO + ASESORES; feat: CofoundersPropuesta |
| d8093cb | fix: SeedSession__EntregablesPropuesta — paginación, Responde, Ver detalle, Pedir ajuste |
| b0d342f | feat: SeedSession — 5 variantes (ConsejoPrincipal, Especialistas, ICPs, Entregables, ConsejoListo) |
| 4cb78ac | fix: SeedSession — Etapa 1 de 5, 1:1 con Nexo, pill Idea cruda eliminada |
| 3b6e380 | fix: ProjectView — badge 40% exportación sin traslape, topRow separado |
| 485713c | fix: ProjectView — header, terminología, pipeline 6 etapas, docs, consumo, sidebar |
| aba441f | docs: freeze Projects__Dashboard__Default |
| e7c74ec | fix: Dashboard — cards con solo ícono ⋯, sin dropdown |
| 5a6b995 | feat: Dashboard — menú CRUD (⋯) en project cards, dropdown abierto en FinTrack |
| 342112a | fix: Dashboard — dropdown removido, nav muestra saldo en estado cerrado |
| dbaec90 | fix: Dashboard — saldo dropdown integrado en saldoWrapper dentro del nav |
| 36564af | fix: Dashboard — header completo con notif, saldo dropdown y avatar |
| b1877d1 | fix: Dashboard — stats Documentos/Sesiones + pills de etapa restaurados |
| 2aa9a70 | fix: Dashboard — subtítulo, En progreso, denominador 6, tokens y filtros |
| 6ed8918 | docs: freeze Auth — 5 frames |
| 922d7ef | feat: Auth — VerifyEmail, ForgotPassword, ForgotPasswordSent frames |
| 93fe396 | fix: Auth__Login__Default — pill tabs, panel izquierdo reconstruido |
| 2279030 | fix: Auth frames — stat3 eliminado, stat2 icon users, Register headline semanas |
| 3798a6d | fix: Auth__Login__Default — stats alignment |
| 76d0b64 | fix: Auth__Login__Default — stat2 icon users, stat3 label Por sesión |
| f754f9d | fix: Auth__Login__Default — icono Consejo IA, alineación cards, stat3 |
| 017d3f2 | iterate: Auth paneles izquierdos — Login icons + Register headline + checklist |
| 120eae0 | fix: Auth__Login__Default — reemplazar stack por tabs (Contraseña / Enlace mágico) |
| 5b41181 | iterate: Auth__Login__Default, Auth__Register__Default — copy y magic link |
| b4bcebf | docs: CLAUDE.md — reglas obligatorias permanentes |
| 86dde3e | docs: update CLAUDE.md — STATUS.md replaces aurum_current_status.md |
| 4c26bef | docs: scope update completo — AVA suite, journey definitivo, todas las specs |
| 35f6e7c | docs: scope update completo — AVA suite, journey definitivo |
| b4eec51 | docs: scope update — AVA suite, journey definitivo, document specs |
| 9b7f006 | feat: semilla fixes — voice ws, topics, progress, pdf reading |
| 99a5de4 | feat: founder brief generation on semilla complete |
| 1946d4c | fix: voice — Alejandro (Calm Mentor) replaces Manuel as Nexo voice |
