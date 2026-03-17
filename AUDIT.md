# Reason — Auditoría Completa
**Fecha:** 2026-03-16
**Método:** Revisión estática de código (grep) + Playwright E2E contra localhost:3000
**Cobertura:** 8 pantallas, 21 rutas API, todos los componentes principales

---

## 1. Botones muertos (sin handler / sin implementación)

| Pantalla | Botón | Componente | Severidad | Notas |
|---|---|---|---|---|
| Settings / Facturación | "Recargar saldo →" | SettingsBilling.tsx | Alta | Sin onClick handler |
| Settings / Facturación | "Cambiar plan" | SettingsBilling.tsx | Alta | Sin onClick handler |
| Settings / Facturación | "Hablar con ventas" | SettingsBilling.tsx | Alta | Sin onClick handler |
| Settings / Facturación | "Cancelar suscripción" | SettingsBilling.tsx | Alta | Sin onClick handler |
| Settings / Facturación | "+ Agregar método de pago" | SettingsBilling.tsx | Alta | Sin onClick handler |
| Settings / Equipo | "Enviar invitación" (modal) | SettingsTeam.tsx | Alta | Formulario recoge email pero no hace fetch |
| Settings / Equipo | "Sí" (confirmar eliminar miembro) | SettingsTeam.tsx | Alta | Modal se abre pero no ejecuta delete |
| Settings / Cuenta | "Cambiar contraseña" | SettingsAccount.tsx | Alta | Sin onClick handler |
| Settings / Cuenta | "Cerrar todas las sesiones" | SettingsAccount.tsx | Alta | Sin onClick handler |
| Settings / Cuenta | "Sí, eliminar" (modal) | SettingsAccount.tsx | Alta | Modal se abre pero no ejecuta delete |
| Settings / Planes | "Cambiar a Pro" | planes/page.tsx | Alta | Sin onClick handler |
| Settings / Planes | "Hablar con ventas" | planes/page.tsx | Alta | Sin onClick handler |
| Settings / Conexiones | "Conectar" (GitHub) | conexiones/page.tsx | Alta | Sin onClick handler — GitHub auth route existe pero no se llama |
| Settings / Conexiones | "Sugerir integración →" | conexiones/page.tsx | Media | Sin onClick handler |
| Advisory Board | "Cambiar ↗" (por advisor) | MyBoard.tsx | Alta | ~6 instancias, ninguna con handler; swap de advisor no implementado |
| Export Center | "Exportar paquete ↑" | ExportCenter.tsx | Alta | Sin onClick handler visible en runtime |
| Export Center | "←" / "→" (paginación) | ExportCenter.tsx | Baja | `disabled` hardcoded — post-MVP by design |
| Document Viewer | Botón send "→" (panel Ajustar) | DocumentoViewer.tsx | Alta | Campo captura texto en state pero botón sin onClick |
| Project View | "Editar propósito" (icono) | project/[id]/page.tsx | Media | Sin onClick handler; sin modal de edición |

---

## 2. Secciones sin implementar / stubs

| Pantalla | Sección | Estado | Notas |
|---|---|---|---|
| Settings / Conexiones | Notion, Linear, Slack, Figma | `status: 'coming_soon'` | Marcadas `available: false`; muestran "Próximamente" |
| Settings / Notificaciones | "Guardar preferencias" | Stub | `handleSave()` solo setea estado local, sin fetch a ningún endpoint |
| Settings / Equipo | Lista de colaboradores | Proxy | Usa `council_advisors` como proxy; no existe tabla `team_members` real |
| Sesión de Consejo | "Pedir revisión" | Post-MVP | Botón `disabled` con `title="Post-MVP"` |
| Document Viewer | Panel "Ajustar" | Incompleto | Input funciona (captura texto) pero envío no está implementado |
| Document Viewer | "↓ Google Slides" | Stub | Apunta a `/export` pero export-to-slides no existe como flujo |
| Landing page | Productos sin lanzar | "Próximamente" | Chips decorativos en sección producto; no interactivos |
| DocumentPreview.tsx | Secciones pendientes | Placeholder | Comentario `{/* Pending section placeholders */}` — secciones vacías |

---

## 3. Modales referenciados que funcionan parcialmente

| Pantalla | Modal | Estado |
|---|---|---|
| Settings / Cuenta | Modal "Eliminar cuenta" | Se abre ✓ — botón "Sí, eliminar" sin handler ✗ |
| Settings / Equipo | Modal "Invitar colaborador" | Se abre ✓ — botón "Enviar invitación" sin fetch ✗ |
| Settings / Equipo | Confirmación eliminar miembro | Se abre ✓ — botón "Sí" sin handler ✗ |

---

## 4. Botones gated por estado (disabled by design — no son bugs)

| Pantalla | Botón | Condición para activarse |
|---|---|---|
| Project View | "Abrir consultoría →" | Se activa cuando existe una consultoría activa (`consultation !== null`) |
| Project View | "Continuar sesión →" | Se activa cuando `activeStage >= 3` |
| Settings / Planes | "Plan actual" | Disabled decorativo en plan activo |

---

## 5. Errores de manejo / fetch sin error handling

| Archivo | Función | Problema |
|---|---|---|
| SettingsAccount.tsx:48 | `handleSave()` | `fetch('/api/settings/profile')` sin `.catch()` — si falla, muestra "Guardando..." infinito |
| SettingsNotifications.tsx:69 | `handleSave()` | No hace ningún fetch — solo `setSaved(true)` |

---

## 6. Resultados E2E por pantalla

| Pantalla | URL | Carga | Elementos interactivos | Observaciones |
|---|---|---|---|---|
| Dashboard | /dashboard | ✓ | "+ Nuevo Proyecto" visible, menú ⋯ visible | OK |
| Project View | /project/[id] | ✓ | 11 elementos | "Abrir consultoría →" disabled por estado (no bug) |
| Seed Session (SeedSessionFlow) | /project/[id]/seed-session | ✓ | 13 elementos | "Aprobar todos →", "Agregar o quitar documentos" — requieren verificación |
| Settings / Cuenta | /settings/cuenta | ✓ | 10 botones | "Cambiar contraseña", "Cerrar sesiones", "Eliminar cuenta" — sin handlers |
| Settings / Facturación | /settings/facturacion | ✓ | 9 botones | 5 botones sin handler |
| Settings / Equipo | /settings/equipo | ✓ | 5 botones | "+ Invitar colaborador" — modal se abre pero no envía |
| Settings / Planes | /settings/planes | ✓ | 7 botones | "Cambiar a Pro", "Hablar con ventas" — sin handler |
| Settings / Notificaciones | /settings/notificaciones | ✓ | 12 botones | Guardar no persiste al backend |
| Settings / Conexiones | /settings/conexiones | ✓ | 6 botones | "Conectar" sin handler, 4 integraciones como Próximamente |
| Export Center | /project/[id]/export | ✓ | 12 elementos | "Exportar paquete ↑" sin handler, paginación disabled |
| Advisory Board | /project/[id]/consejo | ✓ | 6 elementos | Sin advisors en test user; "Cambiar ↗" aparece cuando hay advisors |
| Consultoría | /project/[id]/consultoria | ✓ | — | Carga correctamente |
| Document Viewer | /project/[id]/documento/[id] | — | — | Sin documentos generados en test user — no se pudo auditar |

---

## 7. TODOs en código fuente

| Archivo | Tipo | Descripción |
|---|---|---|
| sesion-consejo/SesionConsejoView.tsx:491 | Post-MVP marker | `title="Post-MVP"` en botón "Pedir revisión" |
| sesion-consejo/DocumentPreview.tsx:62 | Placeholder comment | `{/* Pending section placeholders */}` |
| settings/equipo/page.tsx | Proxy comment | `// Use council_advisors as team members proxy (future: real team_members table)` |

---

## 8. Priorización de fixes

### P0 — Crítico (rompe flujos de usuario)
1. **Advisory Board "Cambiar ↗"** — usuario no puede cambiar advisor una vez asignado
2. **Document Viewer panel Ajustar** — botón de envío muerto; feature aparece implementada visualmente
3. **Settings Team "Enviar invitación"** — el modal dice que funcionará, silenciosamente no hace nada

### P1 — Alto (settings esperados que no funcionan)
4. Settings / Cuenta: Cambiar contraseña, Cerrar sesiones, Eliminar cuenta (modal)
5. Settings / Facturación: todos los botones de billing
6. Settings / Planes: Cambiar a Pro, Hablar con ventas
7. Settings / Conexiones: Conectar GitHub

### P2 — Medio (UX degradada)
8. Settings / Notificaciones: guardar no persiste
9. Project View: "Editar propósito" sin handler
10. Export Center: "Exportar paquete ↑" sin handler

### P3 — Bajo / Post-MVP (intencional)
11. Paginación Export Center (disabled by design)
12. "Pedir revisión" en Sesión de Consejo (title="Post-MVP")
13. Integraciones Notion/Linear/Slack/Figma (Próximamente)
14. team_members real vs proxy

---

*Generado por Faber — auditoría estática + E2E — 2026-03-16*
