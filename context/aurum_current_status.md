# AURUM — Current Project Status

---

## Current Phase

**Etapa: MVP en construcción**

MVP scope: flujo completo Semilla → Resumen del Fundador → Documentos → Project View.
El founder debe poder completar una incubación end-to-end sin intervención manual.

Pipeline position:

```text
IDEA → INCUBADORA ← current stage → BUSINESS → PRODUCT CONCEPT → UX ARCHITECTURE
→ DEFAULT FRAMES → ITERATE → FREEZE → EXPAND → SCAFFOLD → SYSTEM DESIGN → BACKLOG → REPO
```

---

## Infraestructura

| Plataforma | Estado |
| ---------- | ------ |
| Railway (API/backend) | ✅ Operativo |
| Vercel (frontend) | ✅ Operativo |
| Supabase | ✅ Operativo |
| Deepgram STT | ✅ Activo |
| Cartesia TTS | ✅ Activo |
| Tavus CVI | 🗄️ Archivado — diferido post-MVP |

---

## Frame Iteration Status

| Frame | Estado |
| ----- | ------ |
| Projects__ProjectView__Default | ✅ Aprobado — listo para freeze |
| Projects__Incubator__Default | ✅ Aprobado — listo para freeze |
| Projects__SeedSession__Default | ✅ Aprobado — listo para freeze |
| Projects__SeedSession__UploadModal | 🔲 Pendiente |
| Documents__Branding__Default | 🔄 Iterado — pendiente revisión Kira |
| Export__Center__Default | 🔲 Pendiente |

Frames en paralelo con MVP — no bloqueantes.

---

## Voice Mode — estado actual

Stack: Deepgram Nova-3 (STT es-419) + Cartesia Sonic-3 (TTS)
Voz de Nexo: Manuel - Newsman (`948196a7-fe02-417b-9b6d-c45ee0803565`)
Fixes sesión 7: mic mute durante TTS, turn ID con Date.now(), text reveal delay 100ms, INTERRUPT_THRESHOLD=20.
Pendiente post-MVP: migración a Deepgram WebSocket.

---

## Next Planned Step

1. **Flujo Semilla completo** — auditoría del estado actual del flujo (en progreso)
2. Implementar lo que falta: Resumen del Fundador → guardado en Supabase → aparece en sidebar
3. Frames pendientes en Pencil.dev (en paralelo)

---

## Commits recientes (sesión 7)

| Hash | Descripción |
| ---- | ----------- |
| pendiente | context: sync sesión 7 — tavus spike, voice mode, mvp scope |
| `6b71e42` | chore: auto-save sync aurum.pen |
| `cad7689` | iterate: Projects__SeedSession__Default — bubble containment |
| `dc2c450` | docs: add aurum_design_principles.md |

---

## Bugs conocidos

| Síntoma | Estado |
| ------- | ------ |
| console.logs de debug en VoiceModePanel | Intencional — remover post-confirmación |
| Voz sin acento Monterrey | Limitación Cartesia — documentada en decisión #26 |
