'use client'

import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

export function shouldShowTour(key: string): boolean {
  return !localStorage.getItem(`reason-tour-${key}`)
}

export function startDashboardTour() {
  const d = driver({
    showProgress: true,
    animate: true,
    overlayColor: '#0A1128',
    overlayOpacity: 0.75,
    popoverClass: 'reason-tour',
    nextBtnText: 'Siguiente →',
    prevBtnText: '← Anterior',
    doneBtnText: 'Entendido',
    steps: [
      {
        popover: {
          title: 'Bienvenido a Reason',
          description: 'Tu Strategic Reasoning Partner. Te guío rápidamente por las funciones principales.',
        },
      },
      {
        element: '[data-tour="create-project"]',
        popover: {
          title: 'Crea tu primer proyecto',
          description: 'Cada proyecto es una decisión estratégica. Describe tu idea o problema y Reason arma un consejo IA especializado para ti.',
        },
      },
      {
        element: '[data-tour="balance"]',
        popover: {
          title: 'Tu saldo',
          description: 'Cada interacción con IA consume tokens. Tu plan incluye saldo inicial. Puedes recargar cuando quieras.',
        },
      },
      {
        element: '[data-tour="support-widget"]',
        popover: {
          title: 'Aria, tu asistente',
          description: 'Si necesitas ayuda en cualquier momento, haz clic aquí. Aria puede resolver dudas, crear tickets de soporte, o registrar sugerencias.',
        },
      },
    ],
    onDestroyStarted: () => {
      localStorage.setItem('reason-tour-dashboard', 'done')
      d.destroy()
    },
  })

  d.drive()
}

export function startSeedTour() {
  const d = driver({
    showProgress: true,
    animate: true,
    overlayColor: '#0A1128',
    overlayOpacity: 0.75,
    popoverClass: 'reason-tour',
    nextBtnText: 'Siguiente →',
    prevBtnText: '← Anterior',
    doneBtnText: 'Empezar',
    steps: [
      {
        element: '[data-tour="seed-chat"]',
        popover: {
          title: 'Conversa con Nexo',
          description: 'Cuéntale todo sobre tu proyecto o decisión. Entre más contexto le des, mejor será tu consejo asesor y los documentos que genere.',
        },
      },
      {
        element: '[data-tour="seed-upload"]',
        popover: {
          title: 'Sube documentos',
          description: 'Si tienes un pitch deck, plan de negocio, o cualquier documento relevante, súbelo aquí. Nexo lo lee y lo incorpora al contexto.',
        },
      },
      {
        element: '[data-tour="seed-steps"]',
        popover: {
          title: '7 pasos',
          description: 'Después de la conversación, Nexo compone tus entregables, arma tu consejo, y te prepara para la Sesión de Consejo.',
        },
      },
    ],
    onDestroyStarted: () => {
      localStorage.setItem('reason-tour-seed', 'done')
      d.destroy()
    },
  })

  d.drive()
}

export function startSessionTour() {
  const d = driver({
    showProgress: true,
    animate: true,
    overlayColor: '#0A1128',
    overlayOpacity: 0.75,
    popoverClass: 'reason-tour',
    nextBtnText: 'Siguiente →',
    prevBtnText: '← Anterior',
    doneBtnText: 'Iniciar sesión',
    steps: [
      {
        element: '[data-tour="session-phases"]',
        popover: {
          title: 'Fases del consejo',
          description: 'Cada fase produce un documento. El consejo te hace preguntas y debate hasta tener suficiente información para generarlo.',
        },
      },
      {
        element: '[data-tour="session-debate"]',
        popover: {
          title: 'Debate Nexo Dual',
          description: 'Un cofundador construye sobre tu idea. Otro la cuestiona. Tú decides cuál posición adoptar, o respondes directamente.',
        },
      },
      {
        element: '[data-tour="session-advisors"]',
        popover: {
          title: 'Tu consejo',
          description: 'Estos expertos contribuyen desde su especialidad. Sus perspectivas se integran en el debate automáticamente.',
        },
      },
    ],
    onDestroyStarted: () => {
      localStorage.setItem('reason-tour-session', 'done')
      d.destroy()
    },
  })

  d.drive()
}
