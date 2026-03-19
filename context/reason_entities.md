# Reason — Entidades, Relaciones y Mapa de Datos

Documento de referencia para implementación.
Define todas las entidades del sistema, sus relaciones y en qué pantallas aparecen.

---

## 1. User

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | Supabase Auth |
| email | text | único, verificado |
| name | text | nombre completo |
| avatar_url | text | nullable |
| language | text | default: "es" |
| timezone | text | default: "America/Monterrey" |
| notifications_email | boolean | default: true |
| voice_mode_default | boolean | default: false |
| stripe_customer_id | text | nullable — Stripe customer ID (tabla profiles) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Aparece en:** Auth (login, register), Dashboard (avatar + nombre en header), Settings__Account, header global.

---

## 2. Project

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| name | text | ej. "FinTrack" |
| description | text | nullable — "App de finanzas personales" |
| owner_id | uuid FK → User | creador del proyecto |
| entry_level | text | "idea_cruda" / "algo_avanzado" / "documentacion_lista" |
| purpose | text | propósito del consejo declarado por el usuario |
| venture_profile | jsonb | perfil inferido por Nexo (venture_type, pipeline_variant, etc.) |
| current_phase | text | "semilla" / "entregables" / "consejo_principal" / "cofounders" / "especialistas" / "icps" / "consejo_listo" / "sesion_consejo" / "completado" |
| seed_completed | boolean | default: false |
| founder_brief | text | Resumen del Fundador generado post-Semilla |
| github_repo | text | nullable — URL del repo conectado |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| last_active_at | timestamptz | |

**Aparece en:** Dashboard (cards de proyectos), ProjectView (hub central), CreateProject modal, header de todas las pantallas del proyecto.

**Relaciones:**
- User (1:N) — un usuario tiene muchos proyectos
- Council (1:1) — un proyecto tiene un consejo
- Document (1:N) — un proyecto tiene muchos documentos
- Conversation (1:N) — un proyecto tiene muchas conversaciones
- Session (1:N) — un proyecto tiene muchas sesiones de consejo
- Consultation (1:N) — un proyecto tiene muchas consultas
- TeamMember (1:N) — un proyecto tiene muchos miembros

---

## 3. TeamMember

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| project_id | uuid FK → Project | |
| user_id | uuid FK → User | nullable — si invitación pendiente |
| email | text | email del invitado |
| role | text | "fundador" / "cofundador" / "asesor" / "observador" |
| participation | decimal | porcentaje de participación (ej. 0.45) |
| status | text | "activo" / "pendiente" / "rechazado" |
| invited_at | timestamptz | |
| accepted_at | timestamptz | nullable |

**Aparece en:** Settings__Team (tabla de miembros + invitaciones), ProjectView (sidebar cofounders humanos), InviteCollaborator modal.

---

## 4. Council

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| project_id | uuid FK → Project | único — 1 consejo por proyecto |
| status | text | "configurando" / "listo" / "activo" |
| hats_coverage | jsonb | { blanco: true, negro: true, rojo: true, amarillo: true, verde: true, azul: true } |
| created_at | timestamptz | |

**Aparece en:** AdvisoryBoard__MyBoard, ConsejoPrincipalPropuesta, ConsejoListo, SesionConsejo sidebar.

**Relaciones:**
- CouncilAdvisor (1:N) — consejeros asignados al consejo
- CouncilCofounder (1:N) — cofounders asignados
- CouncilSpecialist (1:N) — especialistas invitados
- CouncilBuyerPersona (1:N) — perspectivas de cliente

---

## 5. Advisor (catálogo global)

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| name | text | ej. "Dr. Maya Singh" |
| specialty | text | ej. "Investigación de Mercado" |
| category | text | "investigacion" / "ux_producto" / "negocio" / "tecnico" / "precios" |
| level | text | "lidera" / "apoya" / "observa" |
| element | text | "fuego" / "agua" / "tierra" / "aire" |
| communication_style | text | ej. "Analítica y basada en datos" |
| hats | jsonb | array de sombreros activos: ["blanco", "negro"] |
| bio | text | descripción del perfil |
| specialties_tags | jsonb | array: ["Arquitectura", "MVP", "Escalabilidad"] |
| industries_tags | jsonb | array: ["SaaS", "Fintech", "HealthTech"] |
| experience | jsonb | array de bullet points |
| language | text | ej. "Español · Inglés técnico" |
| is_native | boolean | true = nativo del catálogo, false = personalizado por Nexo |
| created_by | uuid FK → User | nullable — solo si personalizado |
| avatar_url | text | nullable |
| created_at | timestamptz | |

**Aparece en:** AdvisorSelector Drawer (catálogo completo), ConsejoPrincipalPropuesta (cards), MyBoard (cards), SesionConsejo (sidebar + burbujas).

---

## 6. CouncilAdvisor (asignación)

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| council_id | uuid FK → Council | |
| advisor_id | uuid FK → Advisor | |
| level | text | "lidera" / "apoya" / "observa" — puede diferir del default |
| participation_pct | decimal | porcentaje de participación en la sesión |
| is_favorited | boolean | default: false |
| added_at | timestamptz | |

**Aparece en:** MyBoard (posición por nivel), ConsejoPrincipalPropuesta, SesionConsejo sidebar.

---

## 7. Cofounder (catálogo global)

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| name | text | ej. "Camila Reyes" |
| role | text | "constructivo" / "critico" |
| specialty | text | ej. "Bootstrapping & Marca" |
| element | text | "fuego" / "agua" / "tierra" / "aire" |
| communication_style | text | |
| hats | jsonb | sombreros activos |
| bio | text | |
| specialties_tags | jsonb | |
| industries_tags | jsonb | |
| experience | jsonb | |
| language | text | |
| is_native | boolean | |
| created_by | uuid FK → User | nullable |
| avatar_url | text | nullable |
| created_at | timestamptz | |

**Aparece en:** CofounderSelector Drawer, CofoundersPropuesta, MyBoard sidebar, SesionConsejo (Nexo Dual cards).

---

## 8. CouncilCofounder (asignación)

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| council_id | uuid FK → Council | |
| cofounder_id | uuid FK → Cofounder | |
| role | text | "constructivo" / "critico" |
| assigned_at | timestamptz | |

**Aparece en:** CofoundersPropuesta, MyBoard sidebar, ConsejoListo, SesionConsejo.

---

## 9. Specialist (invitados de industria)

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| name | text | ej. "Dra. Carmen Vega" |
| specialty | text | ej. "Salud Digital & Regulación Sanitaria" |
| category_tag | text | ej. "Regulación" / "Legal" / "Research" |
| justification | text | por qué Nexo lo sugiere |
| bio | text | |
| specialties_tags | jsonb | |
| industries_tags | jsonb | |
| experience | jsonb | |
| language | text | |
| is_confirmed | boolean | default: false — pendiente de aprobación del founder |
| project_id | uuid FK → Project | los especialistas se crean por proyecto |
| created_at | timestamptz | |

**Aparece en:** EspecialistasPropuesta, EspecialistaSelector Drawer, MyBoard (sección Invitados), ConsejoListo.

---

## 10. BuyerPersona

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| project_id | uuid FK → Project | |
| name | text | ej. "La Emprendedora Novata" |
| archetype_label | text | "Arquetipo" |
| demographics | text | ej. "Mujer, 28-35 · Fundadora early-stage · LATAM" |
| quote | text | ej. "Tengo la idea pero no sé por dónde empezar" |
| needs | jsonb | array de necesidades |
| fears_objections | jsonb | array de miedos y objeciones |
| discovery_channels | jsonb | array de canales de descubrimiento |
| current_alternatives | jsonb | array de alternativas actuales |
| purchase_journey | jsonb | array de etapas { etapa, piensa, siente, accion } |
| behavior_tags | jsonb | array: ["Sensible al precio", "Early adopter"] |
| is_confirmed | boolean | default: false |
| created_at | timestamptz | |

**Aparece en:** ICPsPropuesta, BuyerPersonaSelector Drawer, MyBoard (sección Perspectivas de Cliente), ConsejoListo, SesionConsejo (cuando validan propuesta de valor).

---

## 11. ~~DocumentSpec~~ — ELIMINADA

Reemplazada por el Framework Engine (Decisión #48).
Nexo ya no selecciona documentos de una biblioteca estática — los compone dinámicamente.
La tabla `document_specs` no existe en producción.
El campo `spec_id` fue eliminado de ProjectDocument.

---

## 12. ProjectDocument (documentos generados por proyecto)

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| project_id | uuid FK → Project | |
| name | text | ej. "Value Proposition Canvas" |
| key_question | text | pregunta estratégica central que responde |
| deliverable_index | integer | orden dentro del proyecto (0-based) |
| composition | jsonb | estructura dinámica generada por Framework Engine: { frameworks_used, sections, advisors_needed, depends_on, feeds_into } |
| status | text | "pendiente" / "en_progreso" / "generado" / "aprobado" |
| content_json | jsonb | contenido estructurado del documento |
| content_html | text | nullable — versión renderizada |
| brand_settings | jsonb | nullable — colores, logo, tipografía aplicados |
| generated_at | timestamptz | nullable |
| approved_at | timestamptz | nullable |
| last_edited_at | timestamptz | nullable |

**Aparece en:** EntregablesPropuesta (lista), ProjectView (card Exportación), Export Center (tabla), Documents Viewer (las 3 tabs), SesionConsejo (preview en vivo + progreso).

---

## 13. Conversation

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| project_id | uuid FK → Project | |
| type | text | "semilla" / "clarificacion" / "consultoria" |
| messages | jsonb | array de { role, content, timestamp, advisor_id? } |
| metadata | jsonb | progreso de extracción, temas cubiertos, etc. |
| status | text | "activa" / "completada" / "pausada" |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Aparece en:** SeedSession (chat principal), Consultoría (chat), Sesión de Clarificación.

---

## 14. Session (Sesión de Consejo)

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| project_id | uuid FK → Project | |
| status | text | "activa" / "completada" / "pausada" |
| mode | text | "normal" / "autopiloto" / "levantar_mano" |
| current_document_index | integer | qué documento se está produciendo (0-based) |
| current_question_index | integer | qué pregunta dentro del documento |
| total_documents | integer | N documentos a producir |
| created_at | timestamptz | |
| completed_at | timestamptz | nullable |

**Aparece en:** SesionConsejo (header: Documento X de N, Pregunta Y de Z), ProjectView (card Sesión de Consejo).

---

## 15. SessionPhase (una fase = un documento siendo producido)

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| session_id | uuid FK → Session | |
| document_id | uuid FK → ProjectDocument | |
| phase_index | integer | orden dentro de la sesión |
| status | text | "pendiente" / "en_progreso" / "completada" |
| questions | jsonb | array de { pregunta, respuestas[], resolucion, modo } |
| momentum | jsonb | { total_questions, resolved, constructivo_count, critico_count } |
| started_at | timestamptz | nullable |
| completed_at | timestamptz | nullable |

**Aparece en:** SesionConsejo (progreso lateral, momentum, anteriores/próximas preguntas).

---

## 16. NexoDualResponse (debate constructivo vs crítico)

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| phase_id | uuid FK → SessionPhase | |
| question_index | integer | a qué pregunta responde |
| constructive_content | text | propuesta del constructivo |
| constructive_hat | text | sombrero usado |
| critical_content | text | objeción del crítico |
| critical_hat | text | sombrero usado |
| agreement | boolean | true si coincidieron |
| resolution | text | "constructiva" / "critico" / "responder_yo" / "acuerdo" |
| founder_response | text | nullable — si el founder respondió directo |
| synthesis | text | nullable — síntesis de Nexo |
| created_at | timestamptz | |

**Aparece en:** SesionConsejo (cards Constructivo vs Crítico, botones Elegir/Responder yo), historial de anteriores.

---

## 17. Consultation (Consultoría activa post-sesión)

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| project_id | uuid FK → Project | |
| title | text | ej. "Ajuste de pricing post-launch" |
| messages | jsonb | array de { role, content, timestamp, advisor_id?, advisor_name? } |
| participating_advisors | jsonb | array de advisor_ids que respondieron |
| status | text | "activa" / "cerrada" |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Aparece en:** Consultoría (chat completo), ProjectView (card Consultoría Activa).

---

## 18. Subscription

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → User | |
| stripe_subscription_id | text | nullable — ID de suscripción en Stripe |
| stripe_customer_id | text | nullable — ID de customer en Stripe |
| plan | text | "core" / "pro" / "enterprise" |
| price_monthly | decimal | |
| status | text | "activa" / "cancelada" / "trial" |
| current_period_start | timestamptz | |
| current_period_end | timestamptz | |
| cancel_at | timestamptz | nullable |
| created_at | timestamptz | |

**Aparece en:** Settings__Billing (Tu Plan), Settings__Plans (comparación), Dashboard header (saldo).

---

## 19. TokenBalance

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → User | |
| balance_usd | decimal | saldo disponible en dólares |
| updated_at | timestamptz | |

**Aparece en:** Dashboard header ($46.79), Settings__Billing (Tu Saldo).

---

## 20. TokenUsage

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → User | |
| project_id | uuid FK → Project | |
| activity | text | ej. "Sesión de Consejo · Modelo de Negocio" |
| tokens_used | integer | |
| cost_usd | decimal | |
| created_at | timestamptz | |

**Aparece en:** Settings__Billing (Historial de Consumo), ProjectView sidebar (Resumen del Proyecto).

---

## 21. Invoice

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → User | |
| concept | text | ej. "Suscripción Core · marzo" |
| amount_usd | decimal | |
| status | text | "pagada" / "pendiente" / "fallida" |
| pdf_url | text | nullable |
| created_at | timestamptz | |

**Aparece en:** Settings__Billing (Facturas).

---

## 22. PaymentMethod

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → User | |
| type | text | "visa" / "mastercard" / "amex" |
| last_four | text | "6411" |
| exp_month | integer | |
| exp_year | integer | |
| is_primary | boolean | default: true |
| created_at | timestamptz | |

**Aparece en:** Settings__Billing (Método de Pago).

---

## 23. Notification

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → User | |
| project_id | uuid FK → Project | nullable |
| type | text | "documento_generado" / "miembro_unido" / "saldo_bajo" / "sesion_completada" / "consejero_disponible" / "pago_procesado" / "factura_disponible" |
| title | text | texto de la notificación |
| is_read | boolean | default: false |
| created_at | timestamptz | |

**Aparece en:** Settings__Notifications (lista + configuración), Dashboard header (campanita con badge).

---

## 24. NotificationPreference

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → User | |
| type | text | mismo enum que Notification.type |
| enabled | boolean | |

**Aparece en:** Settings__Notifications (toggles de configuración).

---

## 25. Connection

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → User | |
| provider | text | "github" / "google_drive" |
| status | text | "conectado" / "desconectado" |
| provider_data | jsonb | { repo_url, account_email, last_sync, etc. } |
| connected_at | timestamptz | nullable |

**Aparece en:** Settings__Connections, ProjectView (repo info).

---

## 26. ConsumptionAlert

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → User | |
| threshold_usd | decimal | default: 10.00 |
| alert_email | boolean | default: true |
| alert_app | boolean | default: true |

**Aparece en:** Settings__Plans (Alertas de Consumo).

---

## Diagrama de relaciones principal

```
User
 ├── Project (1:N)
 │    ├── Council (1:1)
 │    │    ├── CouncilAdvisor (1:N) → Advisor
 │    │    ├── CouncilCofounder (1:N) → Cofounder
 │    │    ├── Specialist (1:N)
 │    │    └── BuyerPersona (1:N)
 │    ├── ProjectDocument (1:N) → DocumentSpec
 │    ├── Conversation (1:N) — semilla, clarificación
 │    ├── Session (1:N)
 │    │    └── SessionPhase (1:N)
 │    │         └── NexoDualResponse (1:N)
 │    ├── Consultation (1:N)
 │    └── TeamMember (1:N) → User
 ├── Subscription (1:1)
 ├── TokenBalance (1:1)
 ├── TokenUsage (1:N)
 ├── Invoice (1:N)
 ├── PaymentMethod (1:N)
 ├── Notification (1:N)
 ├── NotificationPreference (1:N)
 ├── Connection (1:N)
 └── ConsumptionAlert (1:1)

Catálogos globales (read en runtime):
 ├── Advisor (nativos del marketplace)
 ├── Cofounder (nativos del marketplace)
 └── DocumentSpec (biblioteca de specs)
```

---

## Mapa de datos por pantalla

### Auth
- Login/Register: User (create/read)

### Dashboard
- User (nombre, avatar, saldo)
- Project[] (cards con name, current_phase, last_active_at)
- TokenBalance (saldo en header)
- Notification (badge count en campanita)

### ProjectView
- Project (todo)
- Council (status, hats_coverage)
- ProjectDocument[] (status, count listos/pendientes)
- Session (current_phase, status)
- Consultation (última consulta)
- TeamMember[] (sidebar cofounders humanos)
- TokenUsage (resumen del proyecto)

### SeedSession (7 pasos)
- Conversation (type: semilla — mensajes, progreso)
- Project (founder_brief, venture_profile)
- Advisor[] (ConsejoPrincipalPropuesta)
- Cofounder[] (CofoundersPropuesta)
- Specialist[] (EspecialistasPropuesta)
- BuyerPersona[] (ICPsPropuesta)
- DocumentSpec[] (EntregablesPropuesta)
- Council (ConsejoListo — resumen completo)

### SesionConsejo
- Session (modo, documento actual, pregunta actual)
- SessionPhase (progreso, momentum)
- NexoDualResponse (debate actual + historial)
- CouncilAdvisor[] (sidebar izquierdo — participación)
- CouncilCofounder[] (cards Nexo Dual)
- ProjectDocument (preview en vivo)

### Consultoría
- Consultation (chat completo)
- Council (consejeros disponibles)
- ProjectDocument[] (documentos de referencia)
- TokenUsage (contexto acumulado)

### Documents Viewer
- ProjectDocument (contenido, brand_settings)
- DocumentSpec (estructura de referencia)

### Export Center
- ProjectDocument[] (tabla con estado, acciones)

### AdvisoryBoard MyBoard
- Council + CouncilAdvisor[] + CouncilCofounder[]
- Specialist[] + BuyerPersona[]
- TeamMember[] (sidebar humanos)

### Settings Account
- User (perfil, preferencias, seguridad)

### Settings Billing
- TokenBalance, Subscription, TokenUsage[], Invoice[], PaymentMethod

### Settings Team
- TeamMember[] (tabla + invitaciones)

### Settings Plans
- Subscription, ConsumptionAlert

### Settings Notifications
- Notification[], NotificationPreference[]

### Settings Connections
- Connection[]

### Marketing Landing
- Sin datos dinámicos — estática

---

## Catálogos seed (datos iniciales)

### Advisors nativos (MVP: 7 mínimo)
Por nivel y especialidad según ConsejoPrincipalPropuesta:
- LIDERA: Investigación de Mercado, Experto UX, Experto en Producto
- APOYA: Estratega de Negocio, Analista de Negocio
- OBSERVA: Líder Técnico, Líder de Precios

### Cofounders nativos (MVP: mínimo 4)
- 2 Constructivos + 2 Críticos con diferentes elementos/estilos

### DocumentSpecs iniciales (ICP Founder: 4)
1. Value Proposition Canvas
2. Business Model
3. Customer Journey
4. Business Plan

Specs adicionales se crean vía Sesión de Clarificación.

---

## Support System (Story 7.2)

### SupportTicket

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → auth.users | propietario del ticket |
| subject | text | asunto del ticket |
| description | text | descripción inicial |
| status | text | abierto / escalado / resuelto / cerrado |
| priority | text | urgente / normal / bajo |
| aria_resolved | boolean | true si Aria pudo resolver sin escalar |
| assigned_to | uuid FK → auth.users | admin asignado (nullable) |
| project_id | uuid FK → projects | proyecto relacionado (nullable) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Aparece en:** /soporte (lista), /soporte/[id] (chat), /admin/tickets (tabla + detalle)

### TicketMessage

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| ticket_id | uuid FK → support_tickets | |
| sender_id | uuid FK → auth.users | |
| sender_role | text | user / aria / admin |
| content | text | contenido del mensaje |
| created_at | timestamptz | |

**Aparece en:** /soporte/[id] (chat), /admin/tickets/[id] (chat admin)

### FeatureRequest

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → auth.users | |
| title | text | título de la sugerencia |
| description | text | nullable |
| status | text | recibida / evaluada / planeada / implementada / descartada |
| votes | integer | contador total de votos |
| admin_notes | text | notas internas del admin (nullable) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Aparece en:** /sugerencias (lista + voting), /admin/features (gestión)

### FeatureVote

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| feature_id | uuid FK → feature_requests | |
| user_id | uuid FK → auth.users | |
| created_at | timestamptz | |
| UNIQUE | (feature_id, user_id) | un voto por usuario por sugerencia |

**Aparece en:** /sugerencias (toggle voto), /api/features/[id]/vote
