# Reason UI Architecture

El sistema debe sentirse como un sistema operativo para la toma de decisiones estratégicas,
no como un dashboard de SaaS tradicional.

---

## Dashboard
Vista general de ventures/proyectos del usuario.
Funciones: lista de proyectos, progreso, actividad, creación de proyecto.

## Project View
Hub operativo de cada proyecto. Centro de control.
Muestra: propósito del consejo, journey de 5 etapas (Semilla → Selección de Consejeros → Definición de Entregables → Sesión de Consejo → Entrega), acceso a Sesión de Consejo, consejo asesor, Export Center, link a resumen de Semilla.

## Semilla
Conversación 1:1 entre el usuario y Nexo.
Propósito: extraer contexto completo del usuario y su decisión.
Output: Resumen del Fundador.

## Propósito del Consejo
Pantalla donde el usuario declara para qué necesita su consejo.
Nexo procesa el propósito y prepara recomendaciones.

## Marketplace de Consejeros
Catálogo de agentes IA disponibles.
Nexo recomienda perfiles relevantes.
El usuario puede aceptar la recomendación o explorar el catálogo completo.

## Definición de Documentos
Nexo propone los documentos a producir en la Sesión de Consejo.
Si no hay spec previa, se activa la Sesión de Clarificación de Expectativas.
El usuario valida antes de continuar.

## Sesión de Clarificación de Expectativas
Conversación corta donde Nexo co-construye la spec del documento con el usuario.
Solo se activa cuando no existe spec en la biblioteca para el propósito declarado.

## Sesión de Consejo
Panel de conversación con el consejo IA activo.
N fases según documentos definidos. Cada fase produce un documento aprobado.
Mecanismo Nexo Dual operando en cada fase.
Layout de 3 columnas:

- Sidebar izquierdo (260px): lista de fases/entregables con estado (completada: check verde, en_progreso: dot pulsante azul + pregunta clave, pendiente: gris), progreso general "Entregable X de N".
- Área central (fill): header de fase (nombre + pregunta clave + sección actual), chat con burbujas de Nexo (izquierda) y usuario (derecha, fondo gold sutil), skeleton de deliberación, cards Nexo Dual (acuerdo: card verde unificada; desacuerdo: dos cards lado a lado verde/rojo), botones de resolución (normal) o auto-resolve (autopiloto/levantar_mano), textarea de respuesta con botón "Enviar →".
- Sidebar derecho (280px): consejeros activos con avatar + nombre + especialidad (gold si relevante al entregable), cofounders constructivo/crítico, secciones del entregable con estado (completada/en_progreso/pendiente), preview vivo de secciones generadas (expandibles).

Toggle de modo en header: Normal / Autopiloto / Levantar Mano.
Estados: init → starting → answering → submitting → debate_ready → resolving → phase_complete → session_complete.
Ruta: `/project/[id]/sesion-consejo`
Componente: `src/components/sesion-consejo/SesionConsejoView.tsx`

## Export Center
Interfaz de presentación interactiva de los resultados de la Sesión de Consejo.
El usuario navega los documentos generados en formato visual.
Exporta a PDF, PPTX o JSON.

## Consultoría Activa
Chat post-sesión entre el usuario y su consejo IA configurado.
Disponible una vez completada la Sesión de Consejo. Principal driver de retención y consumo recurrente.
Layout de 3 columnas:

- Sidebar izquierdo (280px): lista de consejeros disponibles, cofounders, historial de consultas anteriores.
- Área central (fill): chat con Nexo como moderador, burbujas de asesores con nombre y especialidad, burbuja del founder diferenciada, input con botón enviar gold.
- Sidebar derecho (300px): documentos de referencia citables, contexto acumulado (nº consultas, temas, consejeros activos), chips de acciones rápidas.

El consejo acumula inteligencia sesión a sesión. Abandonar Reason = perder esa memoria.
