'use client'

import { useState } from 'react'
import { toast } from '@/components/ui/Toast'

const PRICE_IDS: Record<string, string> = {
  pro: 'price_pro_monthly',
  enterprise: 'price_enterprise_monthly',
}

const plans = [
  {
    id: 'core',
    name: 'Core',
    price: '$29',
    period: '/mes',
    description: 'Para founders que están comenzando su primer proyecto.',
    features: [
      '1 proyecto activo',
      'Sesión de Consejo completa',
      'Hasta 6 consejeros IA',
      '10 documentos generados',
      'Export PDF',
      'Consultoría básica (50 consultas/mes)',
    ],
    current: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$79',
    period: '/mes',
    description: 'Para founders en modo ejecución con múltiples proyectos.',
    features: [
      'Proyectos ilimitados',
      'Sesiones de Consejo ilimitadas',
      'Hasta 12 consejeros IA',
      '15 documentos + personalizados',
      'Export PDF y PowerPoint',
      'Consultoría avanzada (ilimitada)',
      'Prioridad en modelos IA',
    ],
    current: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Personalizado',
    period: '',
    description: 'Para equipos y aceleradoras con necesidades específicas.',
    features: [
      'Todo lo de Pro',
      'Múltiples usuarios por cuenta',
      'Consejeros personalizados',
      'Integraciones con herramientas externas',
      'SLA garantizado',
      'Onboarding dedicado',
    ],
    current: false,
  },
]

export default function PlanesPage() {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleUpgrade(planId: string) {
    const priceId = PRICE_IDS[planId]
    if (!priceId) {
      toast('Próximamente — escríbenos a hola@reason.dev para hablar con ventas.')
      return
    }
    setLoading(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, mode: 'subscription' }),
      })
      const { url, error } = await res.json()
      if (error) { toast('Error iniciando checkout. Intenta de nuevo.'); return }
      if (url) window.location.href = url
    } catch {
      toast('Error iniciando checkout. Intenta de nuevo.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-[11px] text-[#B8860B] uppercase tracking-[2px] font-semibold">Planes</p>
        <p className="text-[13px] text-[#4A5568]">Escoge el plan que mejor se adapte a tu etapa.</p>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {plans.map(plan => (
          <div
            key={plan.id}
            className={`rounded-xl p-6 space-y-5 border ${
              plan.current
                ? 'bg-[#0D1535] border-[#B8860B]'
                : 'bg-[#0D1535] border-[#1E2A4A]'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-[18px] text-white font-bold font-outfit">{plan.name}</p>
                {plan.current && (
                  <span className="text-[9px] px-2 py-0.5 bg-[#B8860B]/10 border border-[#B8860B]/30 text-[#B8860B] rounded font-semibold uppercase tracking-wider">
                    Tu plan
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-[28px] text-[#B8860B] font-bold font-outfit">{plan.price}</span>
                <span className="text-[13px] text-[#4A5568]">{plan.period}</span>
              </div>
              <p className="text-[12px] text-[#6E8EAD] leading-relaxed">{plan.description}</p>
            </div>

            <ul className="space-y-2">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-[#8B9DB7]">
                  <span className="text-[#48BB78] shrink-0 mt-0.5">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            {plan.current ? (
              <button
                type="button"
                disabled
                className="w-full py-2.5 border border-[#1E2A4A] rounded-lg text-[13px] text-[#4A5568] cursor-default"
              >
                Plan actual
              </button>
            ) : plan.id === 'enterprise' ? (
              <button
                type="button"
                onClick={() => handleUpgrade('enterprise')}
                disabled={loading === 'enterprise'}
                className="w-full py-2.5 border border-[#1E2A4A] hover:border-[#4A5568] rounded-lg text-[13px] text-[#8B9DB7] hover:text-white transition-colors disabled:opacity-50"
              >
                {loading === 'enterprise' ? 'Redirigiendo...' : 'Hablar con ventas'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleUpgrade(plan.id)}
                disabled={loading === plan.id}
                className="w-full py-2.5 bg-[#B8860B] hover:bg-[#A07710] text-black font-semibold text-[13px] rounded-lg transition-colors disabled:opacity-50"
              >
                {loading === plan.id ? 'Redirigiendo...' : `Cambiar a ${plan.name}`}
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="text-[12px] text-[#4A5568] text-center">
        Los planes se facturan mensualmente · Puedes cambiar o cancelar en cualquier momento
      </p>
    </div>
  )
}
