import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Precios — Reason',
  description: 'Planes para founders, CEOs y equipos early-stage. Empieza gratis, escala cuando lo necesites.',
}

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/mes',
    description: 'Para explorar Reason y estructurar tu primera idea.',
    cta: 'Comenzar gratis',
    ctaHref: '/register',
    ctaStyle: 'border border-[#1E2A4A] text-white hover:border-[#4A5568]',
    popular: false,
    features: [
      { label: '1 proyecto', included: true },
      { label: '1 sesión/mes', included: true },
      { label: '3 consejeros', included: true },
      { label: '2 entregables', included: true },
      { label: 'Modelo Haiku', included: true },
      { label: 'Export PDF', included: true },
      { label: 'Export PPTX', included: false },
      { label: 'Consultoría Activa', included: false },
      { label: 'Advisor personalizado', included: false },
      { label: 'Voice mode', included: false },
      { label: 'API access', included: false },
      { label: '$1 saldo inicial', included: true },
    ],
  },
  {
    id: 'core',
    name: 'Core',
    price: '$29',
    period: '/mes',
    description: 'Para founders que necesitan estructura seria y velocidad.',
    cta: 'Suscribirme',
    ctaHref: '/register?plan=core',
    ctaStyle: 'bg-[#1E2A4A] hover:bg-[#2E3A5A] text-white',
    popular: false,
    features: [
      { label: '3 proyectos', included: true },
      { label: '10 sesiones/mes', included: true },
      { label: '7 consejeros', included: true },
      { label: '4 entregables', included: true },
      { label: 'Modelo Sonnet', included: true },
      { label: 'Export PDF', included: true },
      { label: 'Export PPTX', included: true },
      { label: 'Consultoría Activa', included: false },
      { label: 'Advisor personalizado', included: false },
      { label: 'Voice mode', included: true },
      { label: 'API access', included: false },
      { label: '$5 saldo inicial', included: true },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$79',
    period: '/mes',
    description: 'Para fundadores que quieren el sistema completo.',
    cta: 'Suscribirme',
    ctaHref: '/register?plan=pro',
    ctaStyle: 'bg-[#B8860B] hover:bg-[#A07710] text-[#0A1128] font-bold',
    popular: true,
    features: [
      { label: '10 proyectos', included: true },
      { label: '50 sesiones/mes', included: true },
      { label: '15 consejeros', included: true },
      { label: 'Entregables ilimitados', included: true },
      { label: 'Modelo Sonnet', included: true },
      { label: 'Export PDF', included: true },
      { label: 'Export PPTX', included: true },
      { label: 'Consultoría Activa', included: true },
      { label: 'Advisor personalizado', included: true },
      { label: 'Voice mode', included: true },
      { label: 'API access', included: false },
      { label: '$20 saldo inicial', included: true },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$199',
    period: '/mes',
    description: 'Para equipos y organizaciones con requerimientos avanzados.',
    cta: 'Contactar',
    ctaHref: 'mailto:juan@taskforce.fyi',
    ctaStyle: 'border border-[#B8860B]/50 text-[#B8860B] hover:bg-[#B8860B]/10',
    popular: false,
    features: [
      { label: 'Proyectos ilimitados', included: true },
      { label: 'Sesiones ilimitadas', included: true },
      { label: 'Consejeros ilimitados', included: true },
      { label: 'Entregables ilimitados', included: true },
      { label: 'Modelo Opus (core)', included: true },
      { label: 'Export PDF', included: true },
      { label: 'Export PPTX', included: true },
      { label: 'Consultoría Activa', included: true },
      { label: 'Advisor personalizado', included: true },
      { label: 'Voice mode', included: true },
      { label: 'API access', included: true },
      { label: '$50 saldo inicial', included: true },
    ],
  },
]

const FAQ = [
  {
    q: '¿Puedo cambiar de plan?',
    a: 'Sí, en cualquier momento desde Configuración → Facturación. El cambio aplica en el siguiente ciclo de facturación.',
  },
  {
    q: '¿Qué son los tokens?',
    a: 'Los tokens se consumen con cada interacción con IA. Cada plan incluye saldo inicial y puedes recargar desde $10 USD en cualquier momento desde tu panel.',
  },
  {
    q: '¿Los documentos generados son míos?',
    a: 'Sí, 100% tuyos. Reason no reclama ningún derecho sobre el contenido que generas. Puedes exportar y usar todo libremente.',
  },
  {
    q: '¿Puedo cancelar?',
    a: 'Sí, sin compromisos. Cancela desde el portal de cliente en cualquier momento. Tu plan se mantiene activo hasta el final del período ya pagado.',
  },
  {
    q: '¿Qué modelo de IA usa cada plan?',
    a: 'Free usa Haiku (rápido, respuestas competentes). Core y Pro usan Sonnet (profundo, análisis de alta calidad). Enterprise usa Opus para las tareas core — máxima profundidad disponible en Claude.',
  },
]

export default function PricingPage() {
  return (
    <div className="bg-[#0A1128] text-white min-h-screen font-sans">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 md:px-8 lg:px-16 border-b border-[#1E2A4A] bg-[#0A1128]/95 backdrop-blur-sm">
        <Link href="/" className="shrink-0">
          <Image src="/branding/logo-claro-reason.png" alt="Reason" width={90} height={28} />
        </Link>
        <div className="flex items-center gap-4 md:gap-8">
          <Link href="/" className="hidden md:block text-[14px] text-[#8B9DB7] hover:text-white transition-colors">
            Producto
          </Link>
          <Link href="/pricing" className="hidden md:block text-[14px] text-white font-medium transition-colors">
            Precios
          </Link>
          <Link href="/login" className="hidden md:block text-[14px] text-[#8B9DB7] hover:text-white transition-colors">
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 bg-[#B8860B] hover:bg-[#A07710] text-black font-semibold text-[14px] rounded-lg transition-colors"
          >
            Comenzar →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-12 px-4 md:px-8 lg:px-16 text-center">
        <p className="text-[11px] text-[#B8860B] uppercase tracking-[3px] font-semibold mb-4">Planes y precios</p>
        <h1 className="text-[32px] md:text-[44px] font-bold font-outfit leading-tight mb-4">
          Estructura tu negocio.
          <br />
          <span className="text-[#B8860B]">En el plan que te corresponde.</span>
        </h1>
        <p className="text-[16px] text-[#8B9DB7] max-w-[560px] mx-auto">
          Empieza gratis sin tarjeta de crédito. Escala cuando tu proyecto lo pida.
        </p>
      </section>

      {/* CARDS */}
      <section className="pb-16 px-4 md:px-8 lg:px-16">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map(plan => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl p-6 border ${
                plan.popular
                  ? 'bg-[#0D1535] border-[#B8860B]'
                  : 'bg-[#0D1535] border-[#1E2A4A]'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-[#B8860B] text-[#0A1128] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Más popular
                  </span>
                </div>
              )}

              <div className="mb-5">
                <p className="text-[12px] text-[#8B9DB7] uppercase tracking-wider font-medium mb-1">{plan.name}</p>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-[36px] font-bold font-outfit text-white">{plan.price}</span>
                  <span className="text-[14px] text-[#4A5568] mb-1.5">{plan.period}</span>
                </div>
                <p className="text-[12px] text-[#6E8EAD] leading-relaxed">{plan.description}</p>
              </div>

              <ul className="space-y-2.5 mb-7 flex-1">
                {plan.features.map(f => (
                  <li key={f.label} className="flex items-center gap-2.5 text-[12px]">
                    {f.included ? (
                      <span className="text-[#48BB78] shrink-0 text-[14px]">✓</span>
                    ) : (
                      <span className="text-[#1E2A4A] shrink-0 text-[14px]">—</span>
                    )}
                    <span className={f.included ? 'text-[#E2E8F0]' : 'text-[#4A5568]'}>{f.label}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={`block text-center py-2.5 rounded-lg text-[14px] transition-colors ${plan.ctaStyle}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 md:px-8 lg:px-16 bg-[#0D1535]">
        <div className="max-w-[700px] mx-auto">
          <h2 className="text-[24px] md:text-[28px] font-bold font-outfit text-white mb-10 text-center">
            Preguntas frecuentes
          </h2>
          <div className="space-y-6">
            {FAQ.map(item => (
              <div key={item.q} className="border-b border-[#1E2A4A] pb-6 last:border-0">
                <p className="text-[15px] text-white font-medium mb-2">{item.q}</p>
                <p className="text-[14px] text-[#8B9DB7] leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 md:px-8 lg:px-16 text-center">
        <h2 className="text-[26px] md:text-[32px] font-bold font-outfit text-white mb-4">
          Empieza hoy, sin tarjeta de crédito.
        </h2>
        <p className="text-[15px] text-[#8B9DB7] mb-8">
          Tu primer proyecto estructurado en menos de una hora.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center px-8 py-3.5 bg-[#B8860B] hover:bg-[#A07710] text-black font-bold text-[15px] rounded-xl transition-colors"
        >
          Crear cuenta gratis →
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-4 md:px-8 lg:px-16 border-t border-[#1E2A4A] bg-[#0A1128]">
        <div className="max-w-[900px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/">
            <Image src="/branding/logo-claro-reason.png" alt="Reason" width={70} height={22} />
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-[13px] text-[#4A5568] hover:text-[#8B9DB7] transition-colors">Precios</Link>
            <Link href="/privacy" className="text-[13px] text-[#4A5568] hover:text-[#8B9DB7] transition-colors">Privacidad</Link>
            <Link href="/terms" className="text-[13px] text-[#4A5568] hover:text-[#8B9DB7] transition-colors">Términos</Link>
          </div>
          <p className="text-[12px] text-[#374151]">© 2025 AVA Suite</p>
        </div>
      </footer>
    </div>
  )
}
