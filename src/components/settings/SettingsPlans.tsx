'use client'

import { useState } from 'react'
import { toast } from '@/components/ui/Toast'

interface Subscription {
  plan_id: string | null
  status: string | null
  current_period_end: string | null
}

interface PriceIds {
  core?: string
  pro?: string
  enterprise?: string
}

interface Props {
  subscription: Subscription | null
  priceIds: PriceIds
}

const plans = [
  {
    id: 'core',
    name: 'Core',
    price: '$29',
    period: '/mes',
    description: 'Para founders que están comenzando.',
    features: [
      '3 proyectos activos',
      '10 sesiones de consejo/mes',
      '7 consejeros por sesión',
      'Export PDF',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$79',
    period: '/mes',
    description: 'Para founders en modo ejecución.',
    features: [
      '10 proyectos activos',
      '50 sesiones de consejo/mes',
      '15 consejeros por sesión',
      'Export PDF + PPTX',
      'Consultoría Activa',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$199',
    period: '/mes',
    description: 'Para equipos y aceleradoras.',
    features: [
      'Proyectos ilimitados',
      'Sesiones ilimitadas',
      'Consejeros ilimitados',
      'Export completo',
      'API access',
      'Soporte prioritario',
    ],
  },
]

export default function SettingsPlans({ subscription, priceIds }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [alertThreshold, setAlertThreshold] = useState('5')
  const [alertEmail, setAlertEmail] = useState(true)
  const [alertApp, setAlertApp] = useState(true)

  const currentPlanId = subscription?.status === 'activo' || subscription?.status === 'active'
    ? subscription.plan_id
    : null

  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('es', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null

  async function handleSubscribe(planId: string) {
    const priceId = priceIds[planId as keyof PriceIds]
    setLoading(planId)
    try {
      const body = priceId
        ? { price_id: priceId, mode: 'subscription' }
        : { priceId: `price_${planId}_monthly`, mode: 'subscription' }
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

  async function handlePortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const { url, error } = await res.json()
      if (error) { toast(error || 'Error abriendo portal'); return }
      if (url) window.location.href = url
    } catch {
      toast('Error abriendo portal. Intenta de nuevo.')
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* SECCIÓN 1 — TU PLAN ACTUAL */}
      <section className="space-y-3">
        <p className="text-[11px] text-[#B8860B] uppercase tracking-[2px] font-semibold">Tu plan actual</p>
        <div className="bg-[#0D1535] border border-[#1E2A40] rounded-lg p-5 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-3">
              <span className="text-[16px] text-white font-semibold font-outfit">
                {currentPlanId ? plans.find(p => p.id === currentPlanId)?.name ?? currentPlanId : 'Free'}
              </span>
              {currentPlanId ? (
                <span className="text-[9px] px-2 py-0.5 bg-[#B8860B]/10 border border-[#B8860B]/30 text-[#B8860B] rounded font-semibold uppercase tracking-wider">
                  Activo
                </span>
              ) : (
                <span className="text-[9px] px-2 py-0.5 bg-[#1E2A4A] text-[#4A5568] rounded font-semibold uppercase tracking-wider">
                  Sin plan
                </span>
              )}
            </div>
            {periodEnd && (
              <p className="text-[12px] text-[#4A5568]">Renovación: {periodEnd}</p>
            )}
          </div>
          {currentPlanId && (
            <button
              type="button"
              onClick={handlePortal}
              disabled={portalLoading}
              className="text-[13px] text-[#E53E3E] hover:text-red-300 border border-[#E53E3E]/20 hover:border-[#E53E3E]/40 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
            >
              {portalLoading ? 'Abriendo...' : 'Cancelar plan'}
            </button>
          )}
        </div>
      </section>

      {/* SECCIÓN 2 — COMPARA PLANES */}
      <section className="space-y-3">
        <p className="text-[11px] text-[#B8860B] uppercase tracking-[2px] font-semibold">Compara planes</p>
        <div className="grid grid-cols-3 gap-5">
          {plans.map(plan => {
            const isCurrent = plan.id === currentPlanId
            return (
              <div
                key={plan.id}
                className={`rounded-xl p-6 space-y-5 border ${
                  isCurrent
                    ? 'bg-[#0D1535] border-[#B8860B]'
                    : 'bg-[#0D1535] border-[#1E2A4A]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[18px] text-white font-bold font-outfit">{plan.name}</p>
                    {isCurrent && (
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

                {isCurrent ? (
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
                    onClick={() => handleSubscribe('enterprise')}
                    disabled={loading === 'enterprise'}
                    className="w-full py-2.5 border border-[#1E2A4A] hover:border-[#4A5568] rounded-lg text-[13px] text-[#8B9DB7] hover:text-white transition-colors disabled:opacity-50"
                  >
                    {loading === 'enterprise' ? 'Redirigiendo...' : 'Suscribirme'}
                  </button>
                ) : currentPlanId ? (
                  <button
                    type="button"
                    onClick={handlePortal}
                    disabled={portalLoading}
                    className="w-full py-2.5 border border-[#B8860B]/40 hover:border-[#B8860B] rounded-lg text-[13px] text-[#B8860B] hover:text-white transition-colors disabled:opacity-50"
                  >
                    {portalLoading ? 'Abriendo...' : 'Cambiar plan'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loading === plan.id}
                    className="w-full py-2.5 bg-[#B8860B] hover:bg-[#A07710] text-black font-semibold text-[13px] rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading === plan.id ? 'Redirigiendo...' : 'Suscribirme'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <p className="text-[12px] text-[#4A5568] text-center">
          Los planes se facturan mensualmente · Puedes cambiar o cancelar en cualquier momento
        </p>
      </section>

      {/* SECCIÓN 3 — ALERTAS DE CONSUMO */}
      <section className="space-y-3">
        <p className="text-[11px] text-[#B8860B] uppercase tracking-[2px] font-semibold">Alertas de consumo</p>
        <div className="bg-[#0D1535] border border-[#1E2A40] rounded-lg p-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-[14px] text-white font-medium">Avisarme cuando mi saldo baje de</p>
              <p className="text-[12px] text-[#4A5568]">Recibirás una alerta cuando tu saldo esté bajo</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[#8892A4] text-[13px]">$</span>
              <input
                type="number"
                min="1"
                max="100"
                value={alertThreshold}
                onChange={e => setAlertThreshold(e.target.value)}
                className="w-20 px-3 py-1.5 bg-[#0A1128] border border-[#1E2A4A] rounded-lg text-[#F8F8F8] text-[13px] focus:outline-none focus:border-[#B8860B]/50"
              />
              <span className="text-[12px] text-[#4A5568]">USD</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-[13px] text-[#8892A4]">Alerta por email</span>
              <button
                type="button"
                onClick={() => { setAlertEmail(!alertEmail); toast('Próximamente — las alertas se configurarán pronto.') }}
                className={`relative w-10 h-5 rounded-full transition-colors ${alertEmail ? 'bg-[#B8860B]' : 'bg-[#1E2A4A]'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${alertEmail ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-[13px] text-[#8892A4]">Alerta en app</span>
              <button
                type="button"
                onClick={() => { setAlertApp(!alertApp); toast('Próximamente — las alertas se configurarán pronto.') }}
                className={`relative w-10 h-5 rounded-full transition-colors ${alertApp ? 'bg-[#B8860B]' : 'bg-[#1E2A4A]'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${alertApp ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </label>
          </div>
        </div>
      </section>
    </div>
  )
}
