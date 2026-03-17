/**
 * Preguntas canónicas por documento para la Sesión de Consejo.
 * Derivadas del framework de Game Theory: Players, Rules/Constraints, Incentives.
 * Claude las adapta al contexto del founder sin cambiar su enfoque.
 */

export interface CanonicalQuestion {
  section: string
  question: string
}

export const DOCUMENT_QUESTIONS: Record<string, CanonicalQuestion[]> = {
  'Value Proposition Canvas': [
    {
      section: 'Perfil del Cliente',
      question: '¿Quién es tu cliente? Descríbelo: qué hace, qué rol tiene, en qué contexto opera, y cómo se ve su día a día cuando enfrenta el problema que quieres resolver.',
    },
    {
      section: 'Perfil del Cliente',
      question: '¿Qué alternativas usa tu cliente HOY para resolver esto? ¿Qué le funciona y qué no de esas alternativas?',
    },
    {
      section: 'Propuesta de Valor',
      question: '¿Qué ofreces tú que las alternativas actuales no pueden hacer? ¿Cuál es la diferencia concreta?',
    },
    {
      section: 'Propuesta de Valor',
      question: '¿En qué momento exacto tu cliente diría "necesito esto"? ¿Cuál es el detonante?',
    },
    {
      section: 'Encaje Problema-Solución',
      question: '¿Qué evidencia tienes de que alguien pagaría por esto? ¿Has hablado con clientes potenciales, tienes datos, o es hipótesis?',
    },
    {
      section: 'Encaje Problema-Solución',
      question: '¿Qué tendría que ser verdad sobre tu mercado para que tu solución funcione? ¿Qué supuestos estás haciendo?',
    },
    {
      section: 'Customer Personas',
      question: 'Si tuvieras que describir a tu cliente ideal como persona real — nombre, edad, situación, frustraciones — ¿cómo se ve? ¿Cómo describe el problema en sus propias palabras?',
    },
    {
      section: 'Customer Personas',
      question: '¿Qué objeciones tendría esa persona al ver tu producto por primera vez? ¿Qué le haría dudar?',
    },
  ],

  'Business Model': [
    {
      section: 'Modelo de Ingresos',
      question: '¿Cómo piensas cobrar? ¿Suscripción, por uso, one-time, freemium? ¿Por qué ese modelo y no otro?',
    },
    {
      section: 'Modelo de Ingresos',
      question: '¿Cuánto estaría dispuesto a pagar tu cliente? ¿Qué paga hoy por las alternativas? ¿Cuál es tu referencia de precio?',
    },
    {
      section: 'Canales y Adquisición',
      question: '¿Cómo van a encontrarte tus primeros 100 clientes? ¿Dónde están y cómo llegas a ellos?',
    },
    {
      section: 'Economía Unitaria',
      question: '¿Cuánto estimas que cuesta adquirir un cliente (CAC)? ¿Y cuánto vale ese cliente a lo largo de su vida (LTV)?',
    },
    {
      section: 'Estructura de Costos',
      question: '¿Cuáles son tus costos fijos y variables principales? ¿Qué necesitas gastar antes de generar el primer peso?',
    },
    {
      section: 'Estructura de Costos',
      question: '¿En qué punto llegas a break-even? ¿Cuántos clientes o cuánto volumen necesitas?',
    },
    {
      section: 'Palancas de Crecimiento',
      question: '¿Qué hace que tu negocio crezca más rápido conforme avanza? ¿Hay efecto de red, viralidad, o economías de escala?',
    },
    {
      section: 'Palancas de Crecimiento',
      question: '¿Cuál es el riesgo principal que puede romper tu modelo? ¿Qué pasa si un supuesto clave resulta falso?',
    },
  ],

  'Customer Journey': [
    {
      section: 'Descubrimiento',
      question: '¿Cómo se entera tu cliente de que tiene un problema que necesita resolver? ¿Dónde busca soluciones?',
    },
    {
      section: 'Evaluación',
      question: '¿Qué criterios usa para evaluar opciones? ¿Precio, features, recomendaciones, marca?',
    },
    {
      section: 'Decisión y Activación',
      question: '¿Qué lo convence de probar tu producto? ¿Qué fricción hay entre "lo descubro" y "lo uso por primera vez"?',
    },
    {
      section: 'Activación',
      question: '¿Cuál es el momento "aha" — cuando el cliente siente que tomó la decisión correcta?',
    },
    {
      section: 'Retención',
      question: '¿Qué hace que tu cliente se quede? ¿Qué lo haría irse? ¿Cuáles son los puntos de fuga?',
    },
    {
      section: 'Expansión',
      question: '¿Cómo logras que un cliente satisfecho te traiga más clientes o compre más?',
    },
  ],

  'Business Plan': [
    {
      section: 'Dirección Estratégica',
      question: 'En una oración: ¿cuál es la apuesta estratégica de este negocio? ¿Qué estás apostando que será verdad en 12 meses?',
    },
    {
      section: 'Evaluación de Preparación',
      question: '¿Qué tan preparado estás para ejecutar? ¿Tienes equipo, dinero, acceso al cliente, conocimiento técnico?',
    },
    {
      section: 'Riesgos',
      question: '¿Cuáles son los 3 riesgos que pueden matar este proyecto? ¿Qué harías si alguno se materializa?',
    },
    {
      section: 'Riesgos',
      question: '¿Hay algún riesgo regulatorio, legal o de mercado que no hayas considerado?',
    },
    {
      section: 'Impulsos Estratégicos',
      question: '¿Qué es lo PRIMERO que necesitas hacer? No en general — la acción concreta de esta semana que mueve la aguja.',
    },
    {
      section: 'Impulsos Estratégicos',
      question: '¿Cómo sabes que vas bien? ¿Cuál es la métrica o señal que te dice "sigo adelante" vs "necesito pivotar"?',
    },
  ],
}

/**
 * Maps document spec names (from DB) to the canonical keys above.
 * Add aliases if the DB name differs from the canonical key.
 */
export const DOCUMENT_NAME_MAP: Record<string, string> = {
  'Value Proposition Canvas': 'Value Proposition Canvas',
  'VPC': 'Value Proposition Canvas',
  'Propuesta de Valor': 'Value Proposition Canvas',
  'Business Model': 'Business Model',
  'Modelo de Negocio': 'Business Model',
  'Business Model Canvas': 'Business Model',
  'Customer Journey': 'Customer Journey',
  'Customer Journey Map': 'Customer Journey',
  'Business Plan': 'Business Plan',
  'Plan de Negocio': 'Business Plan',
}

export function getQuestionsForDocument(docName: string): CanonicalQuestion[] | null {
  const canonical = DOCUMENT_NAME_MAP[docName] ?? docName
  return DOCUMENT_QUESTIONS[canonical] ?? null
}
