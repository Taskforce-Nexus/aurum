# AURUM — Sesión de Consejo

La Sesión de Consejo es el corazón de AURUM. Es donde el usuario convierte
su decisión estratégica en documentos estructurados con ayuda de un consejo IA especializado.

No está limitada a founders. El consejo y los documentos se adaptan al ICP y al propósito.

---

## Flujo completo previo a la Sesión de Consejo

### 1. Semilla (1:1 Nexo / Usuario)

Nexo extrae contexto completo:
- La decisión o problema que necesita resolver
- Experiencia y contexto del usuario
- Recursos disponibles
- Visión y expectativas
- Restricciones

Output: Resumen del Fundador — documento de referencia para todo lo que sigue.

### 2. Propósito del Consejo

El usuario declara para qué necesita su consejo. Ejemplos:
- Validar mi modelo de negocio
- Diseñar una estrategia de crecimiento
- Lanzar un producto interno
- Entrar a un mercado nuevo

### 3. Marketplace de Consejeros

Nexo recomienda perfiles IA relevantes basándose en propósito + Resumen.
El usuario confirma o ajusta el consejo.

### 4. Definición de Documentos

Nexo revisa la Document Specification Library:
- Si existe spec → propone documentos directamente
- Si no existe spec → activa Sesión de Clarificación de Expectativas

#### Sesión de Clarificación de Expectativas
Nexo co-construye la spec con el usuario:
- ¿Qué decisión resuelve cada documento?
- ¿Qué secciones necesita?
- ¿Cómo se ve un output de calidad?
La spec resultante entra a la biblioteca.

El usuario valida los documentos propuestos antes de continuar.

---

## La Sesión de Consejo

Una vez definidos los documentos, comienza la Sesión de Consejo.
N fases según los documentos definidos. Cada fase produce un documento aprobado.

En cada fase: el consejo hace preguntas y plantea retos. Solo 2-3 roles hablan por turno.

---

## Mecanismo Nexo Dual

El sistema no expone directamente la respuesta de IA al usuario. Primero debate internamente:

```
Nexo Constructivo → redacta respuesta optimista basada en hechos
        ↓
Nexo Crítico → critica, identifica riesgos y debilidades
        ↓
Síntesis → produce resultado final
```

Si coinciden: el usuario ve UN borrador mejorado.
Si no coinciden: el usuario ve DOS posiciones y elige.

---

## Modos de operación

| Modo | Descripción |
|------|-------------|
| Normal | Nexo Dual completo — debate + revisión del usuario |
| Autopiloto | Nexo Constructivo solo, sin debate (velocidad) |
| Levantar Mano | El usuario habla directo al consejo, saltando el proxy |

---

## Consejo Asesor — Marketplace de Consejeros IA

100% agentes IA. Sin consejeros humanos reales en v1.

### Especialidades core del catálogo

| Especialidad | Enfoque |
|---|---|
| Estrategia de negocio | visión general, modelo de ingresos, orquestación |
| Finanzas | economía unitaria, P&L, monetización |
| Marketing y crecimiento | adquisición, posicionamiento, canales |
| Ventas | modelo comercial, incentivos, pipeline |
| Producto / UX | experiencia de usuario, features, encaje |
| Tecnología | arquitectura, viabilidad técnica, alcance MVP |
| Legal / Regulatorio | riesgos, estructura, cumplimiento |
| Operaciones | ejecución, procesos, escala |
| Industria específica | contexto vertical del venture |

Regla: solo 2-3 roles hablan por turno.

---

## Ruta en la app

Semilla: `/project/[id]/semilla`
Sesión de Consejo: `/project/[id]/sesion-consejo`
Componentes en: `src/components/incubadora/`
Prompts del sistema en: `src/lib/prompts.ts`
Configuración de consejeros en: `src/lib/advisors.ts`
