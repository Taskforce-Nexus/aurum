# AURUM — STATUS

Este archivo es la fuente de verdad del estado actual del proyecto.
Faber lo actualiza después de cada sesión de trabajo.

---

## Estado general

Fecha última actualización: 2026-03-10
Etapa actual: Desarrollo activo — Auth frames iterados, Semilla pendiente verificación

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

- Fixes de Semilla (voice ws, temas IA, progreso, PDF) — `9b7f006`
- Pendiente verificación en Railway

## Siguiente paso

Aprobar Auth frames iterados → freeze Auth → verificar Semilla en Railway → avanzar a Propósito del Consejo

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
| 5b41181 | iterate: Auth__Login__Default, Auth__Register__Default — copy y magic link |
| b4bcebf | docs: CLAUDE.md — reglas obligatorias permanentes |
| 86dde3e | docs: update CLAUDE.md — STATUS.md replaces aurum_current_status.md |
| 4c26bef | docs: scope update completo — AVA suite, journey definitivo, todas las specs |
| 35f6e7c | docs: scope update completo — AVA suite, journey definitivo |
| b4eec51 | docs: scope update — AVA suite, journey definitivo, document specs |
| 9b7f006 | feat: semilla fixes — voice ws, topics, progress, pdf reading |
| 99a5de4 | feat: founder brief generation on semilla complete |
| 1946d4c | fix: voice — Alejandro (Calm Mentor) replaces Manuel as Nexo voice |
