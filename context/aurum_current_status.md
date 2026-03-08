# AURUM — Current Project Status

---

## Current Phase

El proyecto opera en dos frentes paralelos:

1. **UX Design Iteration Phase** — frames en Pencil.dev (ITERATE stage)
2. **Incubadora funcional** — código de la app en desarrollo activo

Pipeline position:

```text
IDEA → INCUBADORA → BUSINESS → PRODUCT CONCEPT → UX ARCHITECTURE
→ DEFAULT FRAMES → ITERATE ← current stage → FREEZE → EXPAND
→ SCAFFOLD → SYSTEM DESIGN → BACKLOG → REPO
```

---

## Frame Iteration Status

| Frame | Estado |
| ----- | ------ |
| Projects__ProjectView__Default | ✅ Aprobado — listo para freeze |
| Projects__Incubator__Default | ✅ Aprobado — listo para freeze |
| Projects__SeedSession__Default | ✅ Aprobado — listo para freeze |
| Projects__SeedSession__UploadModal | 🔲 Pendiente de iteración |
| Documents__Branding__Default | 🔄 Iterado — pendiente revisión Kira |
| Export__Center__Default | 🔲 Pendiente de iteración |

---

## Cambios aplicados en Projects__ProjectView__Default

- Pipeline completo 13 etapas en español
- Counter 3 de 13 / stat card 3/13
- Control tiles: Incubadora · Consejo Asesor · Exportación
- Documentos agrupados: Negocio (5) / Producto (7) / Ingeniería (3) — total 15
- Sidebar limpio sin duplicados

---

## Cambios aplicados en Projects__Incubator__Default

- Top bar: Fase 3 de 13
- Panel derecho fusionado en columna única
- Botones de acción con jerarquía: gold / secundario / ghost
- Próximas preguntas con candados
- Autopilot pill con punto dorado
- Momentum completamente visible

---

## Commits de las últimas sesiones (voz + linter)

| Hash | Descripción |
| ---- | ----------- |
| `45fe9b6` | feat: voice fixes — es-419 STT + sentence streaming + Pedro voice + progressive text |
| `d9e48da` | fix: voice silence restart + VoiceModePanel debug logs |
| `172b401` | fix: voice defensive checks — mediaDevices null guard + specific error messages |
| `7bebf06` | fix: voice mode — request mic permission before SpeechRecognition, add Haiku correction |
| `87a3d80` | feat: /api/extract, council flow, persistence fix, Nexo prompt |

---

## SQL ejecutado

Ninguna migración nueva en estas sesiones.

---

## Bugs resueltos

- VoiceModePanel cae a "paused" inmediatamente → resuelto con `getUserMedia` check + `requestPermissionAndStart()`
- Chrome auto-detiene SpeechRecognition en silencio → resuelto con `keepListeningRef` pattern
- `navigator.mediaDevices` undefined en contexto no-HTTPS → null guard explícito
- Transcripción sin corrección → nuevo endpoint `/api/voice/correct` con Haiku
- Linter: 9 warnings en IncubadoraChat → resueltos (progress bar nativa, divs sin role, Tailwind arbitrary variants)
- Web Speech API reemplazada por Deepgram Nova-3 (STT es-419) + Cartesia Sonic-3 (TTS)
- Alta latencia → sentence streaming: SSE stream → boundary detection → TTS queue por oración
- Texto aparece completo antes de audio → progressive token-by-token text + pulsing cursor
- Voz de baja calidad → Pedro - Formal Speaker (acento mexicano, ID: 15d0c2e2)

---

## Bugs pendientes

| Síntoma | Causa probable | Estado |
| ------- | -------------- | ------ |
| Nuevo stack voz (Deepgram+Cartesia) no confirmado en browser real | Pendiente test de Juan | Esperando reporte |
| console.logs de debug en VoiceModePanel | Debug temporal, intencional | Remover después de confirmar voz |
| Voz sin acento norteño/Monterrey | Cartesia no tiene voz de Monterrey — Pedro es el mejor disponible | Limitación de proveedor — documentada |

---

## Document System

15 documentos canónicos:

- Negocio (5): Value Proposition · Business Model · Customer Journey · Branding · Business Plan
- Producto (7): Product Concept · PRD · UX Architecture · Default Frames Inventory · Frame Expansion · Frame Scaffolding · Design System
- Ingeniería (3): System Design · Backlog · Repo Blueprint

---

## Next Planned Step

1. Juan prueba nuevo stack de voz (Deepgram + Cartesia) en browser real
2. Confirmar → Faber remueve console.logs de debug de `VoiceModePanel.tsx`
3. Continuar iteración de 3 frames pendientes en Pencil.dev → FREEZE → EXPAND → SCAFFOLD
