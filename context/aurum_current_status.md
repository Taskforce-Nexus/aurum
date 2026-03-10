# AURUM — Current Project Status

---

## Current Phase

**Etapa: MVP en construcción**

MVP scope: flujo completo Semilla → Propósito del Consejo → Sesión de Consejo → Export Center.
El usuario debe poder completar una sesión estratégica end-to-end sin intervención manual.

Pipeline position:

```text
SEMILLA ← current stage → PROPÓSITO DEL CONSEJO → MARKETPLACE → DEFINICIÓN DE DOCUMENTOS
→ SESIÓN DE CONSEJO → EXPORT CENTER
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

---

## Voice Mode — estado actualizado (sesión 8)

Stack: Deepgram Nova-3 WebSocket (STT es-419) + Cartesia Sonic-3 (TTS)
Voz de Nexo: Alejandro - Calm Mentor (`a1d1c72d-35e6-4520-a38b-a4fcff57e982`)
Sesión 8: migración a Deepgram WebSocket Live Transcription completada — speech_final dispara processMessage, keepalive 8s, auto-reconexión.

---

# Decisiones de scope — sesión con Porfirio Lima (2026-03-10)

- AURUM es Producto 1 de la AVA Suite
- Journey definitivo cerrado — ver decisión #33
- Document Specification Library definida — ver decisión #34
- Sesión de Clarificación de Expectativas definida — ver decisión #35
- Spec completa ICP Founder (4 documentos) — ver decisión #38
- Marketplace de Consejeros 100% IA — ver decisión #37
- Export Center: PDF + PPTX en MVP, Google Slides en v2 — ver decisión #39
- Branding se hace a mano hasta que AURUM esté terminado
- Agile Bot es Producto 3 — se construye después de AURUM
- No más cambios de scope hasta terminar AURUM
