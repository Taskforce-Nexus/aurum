# AURUM — STATUS

Este archivo es la fuente de verdad del estado actual del proyecto.
Faber lo actualiza después de cada sesión de trabajo.

---

## Estado general

Fecha última actualización: 2026-03-10
Etapa actual: Desarrollo activo — ProjectView iterado (6 fixes Kira)

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

- Projects__ProjectView__Default iterado — card Semilla + 4 cards row — `31be0bc`
- Fixes de Semilla (voice ws, temas IA, progreso, PDF) — `9b7f006` — pendiente verificación en Railway

## Siguiente paso

Verificar Semilla en Railway → avanzar a Propósito del Consejo

---

## Entornos

| Entorno | URL |
|---|---|
| Local | http://localhost:3000 |
| Railway | https://aurum-production-e205.up.railway.app |
| Vercel | https://aurum-navy.vercel.app |

---

## Commits recientes

| Hash | Descripción |
|---|---|
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
