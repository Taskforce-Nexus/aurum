'use client'

interface Subscription {
  plan_id: string | null
  status: string | null
  current_period_end: string | null
}

interface UsageRow {
  id: string
  project_id: string | null
  activity: string | null
  tokens_used: number
  cost_usd: number
  created_at: string
}

interface Invoice {
  id: string
  concept: string | null
  amount_usd: number
  status: string | null
  created_at: string
}

interface PaymentMethod {
  id: string
  brand: string | null
  last4: string | null
  exp_month: number | null
  exp_year: number | null
}

interface Props {
  balance: number
  subscription: Subscription | null
  usage: UsageRow[]
  invoices: Invoice[]
  paymentMethod: PaymentMethod | null
}

const PLAN_NAMES: Record<string, string> = {
  core: 'Plan Core',
  pro: 'Plan Pro',
  enterprise: 'Enterprise',
}

const PLAN_PRICE: Record<string, string> = {
  core: '$29/mes',
  pro: '$79/mes',
  enterprise: 'Personalizado',
}

export default function SettingsBilling({
  balance,
  subscription,
  usage,
  invoices,
  paymentMethod,
}: Props) {
  const planId = subscription?.plan_id ?? 'core'
  const planName = PLAN_NAMES[planId] ?? 'Plan Core'
  const planPrice = PLAN_PRICE[planId] ?? '$29/mes'
  const isActive = subscription?.status === 'activo' || subscription?.status === 'active'
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('es', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <div className="space-y-8">
      {/* TU SALDO */}
      <section className="space-y-3">
        <p className="text-[11px] text-[#B8860B] uppercase tracking-[2px] font-semibold">Tu saldo</p>
        <div className="bg-[#0D1535] border border-[#B8860B] rounded-lg p-6 flex items-start justify-between">
          <div>
            <p className="text-[36px] text-white font-bold font-outfit">
              ${Number(balance).toFixed(2)}
            </p>
            <p className="text-[12px] text-[#4A5568] mt-1">
              disponible
              {usage.length > 0 && ` · ${usage.reduce((s, u) => s + u.tokens_used, 0).toLocaleString()} tokens usados`}
            </p>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 bg-[#B8860B] hover:bg-[#A07710] text-black font-semibold text-[13px] rounded-lg transition-colors"
          >
            Recargar saldo →
          </button>
        </div>
      </section>

      {/* TU PLAN */}
      <section className="space-y-3">
        <p className="text-[11px] text-[#B8860B] uppercase tracking-[2px] font-semibold">Tu plan</p>
        <div className="bg-[#0D1535] border border-[#1E2A40] rounded-lg p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <p className="text-[18px] text-white font-bold font-outfit">{planName}</p>
                {isActive && (
                  <span className="text-[10px] text-green-400 font-semibold px-2 py-0.5 bg-green-400/10 rounded uppercase tracking-wider">
                    Activo
                  </span>
                )}
              </div>
              <p className="text-[22px] text-[#B8860B] font-semibold">{planPrice}</p>
              {periodEnd && (
                <p className="text-[12px] text-[#4A5568]">Próxima renovación: {periodEnd}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className="px-4 py-2 border border-[#1E2A4A] hover:border-[#4A5568] text-[13px] text-[#8892A4] hover:text-white rounded-lg transition-colors"
            >
              Cambiar plan
            </button>
            <button
              type="button"
              className="px-4 py-2 border border-[#1E2A4A] hover:border-[#4A5568] text-[13px] text-[#8892A4] hover:text-white rounded-lg transition-colors"
            >
              Hablar con ventas
            </button>
          </div>
        </div>
      </section>

      {/* HISTORIAL DE CONSUMO */}
      <section className="space-y-3">
        <p className="text-[11px] text-[#B8860B] uppercase tracking-[2px] font-semibold">Historial de consumo</p>
        <div className="bg-[#0D1535] border border-[#1E2A40] rounded-lg overflow-hidden">
          <div className="flex items-center gap-4 px-5 py-3 border-b border-[#1E2A4A]">
            <span className="w-24 text-[10px] text-[#4A5568] uppercase tracking-wider">Fecha</span>
            <span className="flex-1 text-[10px] text-[#4A5568] uppercase tracking-wider">Proyecto · Actividad · Tokens</span>
            <span className="w-16 text-[10px] text-[#4A5568] uppercase tracking-wider text-right">Costo</span>
          </div>
          {usage.length > 0 ? (
            usage.map(row => (
              <div key={row.id} className="flex items-center gap-4 px-5 py-3 border-b border-[#1E2A4A]/50 last:border-b-0">
                <span className="w-24 text-[12px] text-[#4A5568]">
                  {new Date(row.created_at).toLocaleDateString('es', { month: 'short', day: 'numeric' })}
                </span>
                <span className="flex-1 text-[12px] text-[#8892A4]">
                  {row.activity ?? 'Actividad'} · {row.tokens_used.toLocaleString()} tokens
                </span>
                <span className="w-16 text-[12px] text-[#8892A4] text-right">
                  ${Number(row.cost_usd).toFixed(2)}
                </span>
              </div>
            ))
          ) : (
            <div className="px-5 py-6 text-center text-[13px] text-[#4A5568]">Sin consumo registrado</div>
          )}
        </div>
        {usage.length > 0 && (
          <p className="text-[12px] text-[#8B9DB7]">
            Mostrando 1-{usage.length} · ← →
          </p>
        )}
      </section>

      {/* MÉTODO DE PAGO */}
      <section className="space-y-3">
        <p className="text-[11px] text-[#B8860B] uppercase tracking-[2px] font-semibold">Método de pago</p>
        <div className="bg-[#0D1535] border border-[#1E2A40] rounded-lg p-6 flex items-center justify-between">
          {paymentMethod ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-7 bg-[#1E2A4A] rounded flex items-center justify-center">
                <span className="text-[10px] text-[#8892A4] font-mono">{paymentMethod.brand ?? 'VISA'}</span>
              </div>
              <span className="text-[14px] text-white">
                •••• •••• •••• {paymentMethod.last4}
              </span>
              <span className="text-[12px] text-[#4A5568]">
                Exp. {paymentMethod.exp_month}/{paymentMethod.exp_year}
              </span>
            </div>
          ) : (
            <span className="text-[14px] text-[#4A5568]">Sin método de pago registrado</span>
          )}
          <button
            type="button"
            className="text-[13px] text-[#E53E3E] hover:text-red-300 transition-colors"
          >
            {paymentMethod ? 'Cancelar suscripción' : 'Agregar método'}
          </button>
        </div>
        {!paymentMethod && (
          <button
            type="button"
            className="text-[13px] text-[#B8860B] hover:text-[#D4A017] transition-colors"
          >
            + Agregar método de pago
          </button>
        )}
      </section>

      {/* FACTURAS */}
      {invoices.length > 0 && (
        <section className="space-y-3">
          <p className="text-[11px] text-[#B8860B] uppercase tracking-[2px] font-semibold">Facturas</p>
          <div className="bg-[#0D1535] border border-[#1E2A40] rounded-lg overflow-hidden">
            <div className="flex items-center gap-4 px-5 py-3 border-b border-[#1E2A4A]">
              <span className="w-24 text-[10px] text-[#4A5568] uppercase tracking-wider">Fecha</span>
              <span className="flex-1 text-[10px] text-[#4A5568] uppercase tracking-wider">Concepto</span>
              <span className="w-20 text-[10px] text-[#4A5568] uppercase tracking-wider text-right">Monto</span>
              <span className="w-24 text-[10px] text-[#4A5568] uppercase tracking-wider text-right">Estado</span>
            </div>
            {invoices.map(inv => (
              <div key={inv.id} className="flex items-center gap-4 px-5 py-3 border-b border-[#1E2A4A]/50 last:border-b-0">
                <span className="w-24 text-[12px] text-[#4A5568]">
                  {new Date(inv.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: '2-digit' })}
                </span>
                <span className="flex-1 text-[12px] text-[#8892A4]">{inv.concept ?? 'Suscripción'}</span>
                <span className="w-20 text-[12px] text-white text-right">${Number(inv.amount_usd).toFixed(2)}</span>
                <span className={`w-24 text-[11px] font-medium text-right ${
                  inv.status === 'pagada' || inv.status === 'paid'
                    ? 'text-green-400'
                    : inv.status === 'pendiente' || inv.status === 'pending'
                      ? 'text-[#B8860B]'
                      : 'text-[#4A5568]'
                }`}>
                  {inv.status === 'pagada' || inv.status === 'paid' ? 'Pagada' :
                   inv.status === 'pendiente' || inv.status === 'pending' ? 'Pendiente' :
                   inv.status ?? '—'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
