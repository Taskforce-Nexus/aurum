# Reason — STATUS

Este archivo es la fuente de verdad del estado actual del proyecto.
Faber lo actualiza después de cada sesión de trabajo.

---

## Estado general

Fecha última actualización: 2026-03-13
Etapa actual: IMPLEMENTATION — Story 2.2 COMPLETA. SeedSession pasos 2-7 implementados. Siguiente: verificar en browser + Story 2.x

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

## Siguiente paso

Story 2.2 — TBD por Kira

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
