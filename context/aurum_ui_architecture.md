# AURUM UI Architecture

El sistema debe sentirse como un sistema operativo para la toma de decisiones estratégicas,
no como un dashboard de SaaS tradicional.

---

## Dashboard
Vista general de ventures/proyectos del usuario.
Funciones: lista de proyectos, progreso, actividad, creación de proyecto.

## Project View
Hub operativo de cada proyecto. Centro de control.
Muestra: estado del venture, documentos generados, acceso a Sesión de Consejo,
consejo asesor, Export Center.

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

## Export Center
Interfaz de presentación interactiva de los resultados de la Sesión de Consejo.
El usuario navega los documentos generados en formato visual.
Exporta a PDF, PPTX o JSON.
