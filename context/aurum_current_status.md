# AURUM — Current Project Status

---

# Current Phase

El proyecto opera en dos frentes paralelos:

1. **UX Design Iteration Phase** — frames en Pencil.dev (ITERATE stage)
2. **Incubadora funcional** — código de la app en desarrollo activo

Pipeline position:

IDEA → INCUBADORA → BUSINESS → PRODUCT CONCEPT → UX ARCHITECTURE → DEFAULT FRAMES → ITERATE ← current stage → FREEZE → EXPAND → SCAFFOLD → SYSTEM DESIGN → BACKLOG → REPO

---

# Frame Iteration Status

| Frame | Estado |
|---|---|
| Projects__ProjectView__Default | ✅ Aprobado — listo para freeze |
| Projects__Incubator__Default | ✅ Aprobado — listo para freeze |
| Projects__SeedSession__Default | ✅ Aprobado — listo para freeze |
| Projects__SeedSession__UploadModal | 🔲 Pendiente de iteración |
| Documents__Branding__Default | 🔄 Iterado — pendiente revisión Kira |
| Export__Center__Default | 🔲 Pendiente de iteración |

---

# Cambios aplicados en Projects__ProjectView__Default

- Pipeline completo 13 etapas en español
- Counter 3 de 13 / stat card 3/13
- Control tiles: Incubadora · Consejo Asesor · Exportación
- Documentos agrupados: Negocio (5) / Producto (7) / Ingeniería (3) — total 15
- Sidebar limpio sin duplicados

---

# Cambios aplicados en Projects__Incubator__Default

- Top bar: Fase 3 de 13
- Panel derecho fusionado en columna única
- Botones de acción con jerarquía: gold / secundario / ghost
- Próximas preguntas con candados
- Autopilot pill con punto dorado
- Momentum completamente visible

---

# Commits de las últimas sesiones (voz + linter)

| Hash | Descripción |
|------|-------------|
| `d9e48da` | fix: voice silence restart + VoiceModePanel debug logs |
| `172b401` | fix: voice defensive checks — mediaDevices null guard + specific error messages |
| `7bebf06` | fix: voice mode — request mic permission before SpeechRecognition, add Haiku correction |
| `87a3d80` | feat: /api/extract, council flow, persistence fix, Nexo prompt |
| `af90237` | feat: GitHub onboarding wizard — 3-step flow |

---

# SQL ejecutado

Ninguna migración nueva en estas sesiones.

---

# Bugs resueltos

- VoiceModePanel cae a "paused" inmediatamente → resuelto con `getUserMedia` check + `requestPermissionAndStart()`
- Chrome auto-detiene SpeechRecognition en silencio → resuelto con `keepListeningRef` pattern
- `navigator.mediaDevices` undefined en contexto no-HTTPS → null guard explícito
- Transcripción sin corrección → nuevo endpoint `/api/voice/correct` con Haiku
- Linter: 9 warnings en IncubadoraChat → resueltos (progress bar nativa, divs sin role, Tailwind arbitrary variants)
- Progress bar con `style={}` dinámico → reemplazado por `<progress value max>` con pseudo-element CSS

---

# Bugs pendientes

| Síntoma | Causa probable | Estado |
|---------|---------------|--------|
| VoiceModePanel — no confirmado si funciona en browser real | Pendiente test de Juan | Esperando reporte |
| console.logs `[VoiceMode] 1-6` en producción | Debug temporal, intencional | Remover después de confirmar voz |

---

# Document System

15 documentos canónicos:

Negocio (5): Value Proposition · Business Model · Customer Journey · Branding · Business Plan
Producto (7): Product Concept · PRD · UX Architecture · Default Frames Inventory · Frame Expansion · Frame Scaffolding · Design System
Ingeniería (3): System Design · Backlog · Repo Blueprint

---

# Next Planned Step

1. Juan confirma que voz funciona → Faber remueve console.logs de `VoiceModePanel.tsx`
2. Continuar iteración de 3 frames pendientes en Pencil.dev → FREEZE → EXPAND → SCAFFOLD
