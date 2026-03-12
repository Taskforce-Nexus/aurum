# Reason — STATUS

Este archivo es la fuente de verdad del estado actual del proyecto.
Faber lo actualiza después de cada sesión de trabajo.

---

## Estado general

Fecha última actualización: 2026-03-12
Etapa actual: ITERATE — Projects__Incubator__Default iterado (12 fixes aplicados). Pendiente: FREEZE Incubator

---

## Lo que funciona

- Login / Registro
- Crear y gestionar proyectos
- Conexión GitHub repo por proyecto
- Semilla con Nexo — conversación persiste en Supabase
- Resumen del Fundador generado al terminar Semilla
- Banner de Semilla completada
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

## Siguiente paso

Diseñar siguiente frame del pipeline (Documents o Export)

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
