'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const FEATURE_LABELS: Record<string, { plan: string; description: string }> = {
  consultation: { plan: 'Core', description: 'Consultoría activa con tu consejo asesor' },
  generate_custom_advisor: { plan: 'Core', description: 'Creación de consejeros personalizados' },
  edit_document: { plan: 'Core', description: 'Edición de documentos con IA' },
  session_question: { plan: 'Core', description: 'Sesión de Consejo completa' },
  session_resolve: { plan: 'Core', description: 'Resolución de documentos en sesión' },
  compose: { plan: 'Core', description: 'Composición de entregables estratégicos' },
  seed_chat: { plan: 'Core', description: 'Chat de Semilla con Nexo' },
}

export default function UpgradeModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [feature, setFeature] = useState<string>('')

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<string>).detail
      setFeature(detail ?? '')
      setOpen(true)
    }
    window.addEventListener('upgrade-required', handler)
    return () => window.removeEventListener('upgrade-required', handler)
  }, [])

  if (!open) return null

  const info = FEATURE_LABELS[feature] ?? { plan: 'Core', description: 'Esta función' }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={() => setOpen(false)} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[400px] bg-[#0D1535] border border-[#1E2A4A] rounded-2xl p-8 shadow-2xl">
        <div className="mb-6">
          <div className="w-10 h-10 rounded-full bg-[#B8860B]/10 border border-[#B8860B]/30 flex items-center justify-center mb-4">
            <span className="text-[#B8860B] text-lg">↑</span>
          </div>
          <h2 className="text-white text-[18px] font-bold mb-2">
            Función disponible en plan {info.plan}
          </h2>
          <p className="text-[#8892A4] text-sm leading-relaxed">
            {info.description} requiere plan {info.plan} o superior. Actualiza tu plan para desbloquear esta y todas las funciones avanzadas.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => { setOpen(false); router.push('/settings/planes') }}
            className="w-full py-2.5 bg-[#B8860B] hover:bg-[#A07710] text-[#0A1128] text-sm font-semibold rounded-lg transition-colors"
          >
            Ver planes →
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full py-2.5 border border-[#1E2A4A] text-[#8892A4] hover:text-white text-sm rounded-lg transition-colors"
          >
            Continuar con plan actual
          </button>
        </div>
      </div>
    </>
  )
}
