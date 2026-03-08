# AURUM Architectural Decisions

This file stores important architectural and product decisions already made for AURUM.

Its purpose is to preserve consistency across conversations and avoid re-opening already decided topics unless explicitly requested.

---

## 1. Core Product Identity

AURUM is not just a chatbot or a code generator.

AURUM is an AI-guided venture creation system that transforms a founder's idea into:
- business documentation
- product architecture
- UX structure
- system design
- backlog
- repository-ready outputs

---

## 2. Founder Role

The founder provides:
- the seed idea
- context
- constraints
- approvals

The founder should not be forced to produce heavy documentation manually.
AURUM must reduce friction and preserve momentum.

---

## 3. Seed Session Philosophy

The seed session is essential. It exists to capture the founder's Eureka moment before motivation and clarity are lost.

The system should help the founder externalize:
- the idea
- frustrations
- founder experience
- constraints
- opportunities

This is handled through conversation with Nexo.

---

## 4. Nexo Role

Nexo is the moderator of the incubation process.

Nexo is responsible for:
- guiding the seed session
- extracting venture context
- orchestrating the advisory system
- deciding which advisors speak during incubation
- maintaining focus and flow

Nexo is not just another advisor. Nexo is the orchestrator.

---

## 5. Advisory Board Decision

The advisory board is not configured manually by default.

Nexo configures the advisory board automatically after the seed session.

Nexo may:
- select advisors from the library
- generate missing advisors if necessary
- select invited specialists if needed
- select or create buyer personas based on the seed session

Manual modification of the advisory board is allowed later.

---

## 6. Human and AI Participants

The system includes:
- founder
- optional human cofounders
- AI cofounders
- advisors
- invited specialists
- buyer personas / voice of customer

AI cofounders are distinct from advisors.

AI cofounders act as internal strategic counterparts:
- one constructive
- one critical

---

## 7. Venture Creation Pipeline

The canonical AURUM pipeline has 13 stages:

IDEA
↓
INCUBADORA
↓
BUSINESS
↓
PRODUCT CONCEPT
↓
UX ARCHITECTURE
↓
DEFAULT FRAMES
↓
ITERATE
↓
FREEZE
↓
EXPAND
↓
SCAFFOLD
↓
SYSTEM DESIGN
↓
BACKLOG
↓
REPO

Notes:
- ITERATE and FREEZE are explicit stages, not implicit steps
- EXPAND replaces the former FRAME EXPANSION
- SCAFFOLD replaces the former FRAME SCAFFOLDING
- DESIGN SYSTEM is absorbed into SCAFFOLD and not a visible pipeline stage
- This pipeline should be preserved unless explicitly redesigned by Juan

---

## 8. Business vs Product vs Engineering

### Business
- value proposition
- business model
- customer journey
- branding
- business plan

### Product
- product concept
- UX architecture
- default frames
- frame expansion
- frame scaffolding
- design system

### Engineering
- system design
- backlog
- repo outputs

---

## 9. Branding Decision

Branding belongs to the BUSINESS layer.

Branding includes:
- purpose, mission, vision, values
- positioning, voice, naming, identity direction

Branding informs Product and Design System later.

---

## 10. UI Design Workflow Decision

The UI workflow is: default → iterate → freeze → expand → scaffold

Rules:
- never generate hundreds of frames in the first pass
- always start with default frames
- freeze before expansion
- expansion derives from approved defaults
- scaffolding prepares the UI for engineering

---

## 11. Pencil Decision

Pencil.dev is used to generate and iterate product UI frames.
Pencil is a design execution layer, not the source of truth.
The source of truth is the structured inventory and project docs.

---

## 12. Default Frame Strategy

Do not generate before freeze:
- loading states
- error states
- empty states
- responsive variants
- hover/microinteraction variants

---

## 13. Existing UI Decision

ProjectView is the main project hub. No duplicate hub screens.
Document Hub logic lives inside ProjectView.

---

## 14. Export Center Decision

Export Center evolves into a handoff center.

Supports:
- documents
- markdown bundles
- repo package
- slides / pitch deck
- investor materials

---

## 15. Build Scope Decision

AURUM v1 generates:
- strategy
- business docs
- product structure
- system design
- backlog
- repo-ready artifacts

Full autonomous build is a future milestone, not v1.

---

## 16. Documentation Strategy

Important knowledge must be extracted into markdown files.
Claude Project files and /context in the repo are the core memory layers.

---

## 17. Language Decision

Conversation with Nexo happens in Spanish when requested.
Technical documentation may remain in English.

---

## 18. Product Experience Principle

AURUM should feel: premium, serious, clear, structured, energizing.
It should never feel like a chaotic prompt toy.

---

## 19. Incubation Phase Model

The INCUBADORA stage contains 5 internal sub-phases:

1. Semilla — initial idea capture with Nexo
2. Propuesta de Valor — value proposition exploration
3. Modelo de Negocio — business model definition
4. Recorrido del Cliente — customer journey mapping
5. Plan de Negocio — business plan synthesis

These sub-phases are internal to INCUBADORA and do not appear as separate stages in the main pipeline.

The Nexo Dual mechanism operates across all sub-phases:
- Constructive cofounder proposes
- Critical cofounder challenges
- Nexo synthesizes and advances

Three operating modes: Normal, Autopilot, Levantar Mano (raise hand).

The advisory board is activated and configured by Nexo after Semilla is complete.

---

## 20. Modelo de Monetización y Retención

**Ingresos:**

Suscripción mensual fija — acceso a la plataforma.
Saldo de tokens prepagado — consumo variable por uso real.
El usuario nunca conecta su propia API key. AURUM controla el acceso al modelo y aplica margen sobre costo Anthropic.

El costo es variable por diseño: founders con más contexto, más archivos y más conversación consumen más tokens. El saldo captura esa variabilidad sin friccionar la experiencia.

**Upsells por módulo:**

- Branding — identidad visual, naming, dirección de marca
- Frames — generación de UI con Pencil para founders de producto
- Consejo Premium — advisors especializados por industria
- Consultoría — acceso solo al Consejo sin pipeline completo

**Modelo de retención estructural:**

El Consejo Asesor es el switching cost principal de AURUM.

El Consejo acumula:

- advisors configurados para el venture específico
- buyer personas del mercado objetivo
- historial de decisiones y razonamiento
- inteligencia del negocio construida sesión a sesión

Abandonar AURUM significa abandonar la memoria institucional del negocio.
Ese costo de salida es el ancla de retención a largo plazo — no el hábito ni la interfaz.

El Consejo no es producto separado — es una capa presente en todos los tiers
con diferente profundidad según el plan.
