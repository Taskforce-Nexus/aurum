

const FEATURES = [
  {
    label: 'Semilla',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B8860B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22V12"/>
        <path d="M12 12C8.5 12 5 9.5 5 5c0 0 3-1.5 7 1 4-2.5 7-1 7-1 0 4.5-3.5 7-7 7z"/>
      </svg>
    ),
  },
  {
    label: 'Consejo IA',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B8860B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    label: 'Documentos',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B8860B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    label: 'Exportar',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B8860B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="7" y1="17" x2="17" y2="7"/>
        <polyline points="7 7 17 7 17 17"/>
      </svg>
    ),
  },
]

const REGISTER_BENEFITS = [
  'Basa tus decisiones en datos y análisis probados',
  'Tu consejo IA automatiza algunos de los mayores KPIs',
  'Clona a analistas y asesores con propietario real',
  'Lleva tus proyectos de idea a mercado en semanas',
]

type Variant = 'default' | 'register'

export default function AuthBrandPanel({ variant = 'default' }: { variant?: Variant }) {
  return (
    <div className="hidden lg:flex flex-col justify-between w-[600px] shrink-0 bg-[#0D1535] px-14 py-16">
      {/* Top: Logo + headline */}
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_DATA_URL}
          alt="Reason"
          className="h-8 w-auto mb-8"
        />
        <div className="w-10 h-0.5 bg-[#B8860B] mb-8" />

        {variant === 'default' ? (
          <>
            <h1 className="font-outfit text-4xl font-bold text-white leading-tight mb-5">
              Tu idea no merece morir<br />en la imaginación
            </h1>
            <p className="text-sm text-[#8892A4] leading-relaxed">
              Tu consejo IA reúne expertos, cofounders y perspectivas de cliente en una sala. No se van hasta que tu decisión esté estructurada.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-outfit text-4xl font-bold text-white leading-tight mb-5">
              Estructura cualquier decisión estratégica.
              <br />En semanas, no meses.
            </h1>
            <p className="text-sm text-[#8892A4] leading-relaxed">
              Tu consejo IA — con los expertos, experiencia y perspectivas de clientes — hacer las preguntas difíciles por ti.
            </p>
          </>
        )}
      </div>

      {/* Middle section */}
      {variant === 'default' ? (
        <div>
          <p className="text-xs font-outfit font-semibold text-[#8892A4] uppercase tracking-widest mb-5">
            Tu suite completa
          </p>
          <div className="flex gap-6 mb-8">
            {FEATURES.map(f => (
              <div key={f.label} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-[#0A1128] border border-[#1E2A4A] flex items-center justify-center">
                  {f.icon}
                </div>
                <span className="text-xs text-[#8892A4]">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {REGISTER_BENEFITS.map(benefit => (
            <div key={benefit} className="flex items-start gap-3">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0">
                <circle cx="8" cy="8" r="8" fill="#B8860B" fillOpacity="0.2" />
                <path d="M5 8l2 2 4-4" stroke="#B8860B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm text-[#8892A4]">{benefit}</span>
            </div>
          ))}
        </div>
      )}

      {/* Bottom: testimonial (default only) */}
      {variant === 'default' && (
        <div className="bg-[#0A1128] border border-[#1E2A4A] rounded-xl p-5">
          <p className="text-sm text-[#C8D0E0] leading-relaxed mb-4">
            "Tenía la idea hace meses pero no sabía por dónde empezar. Reason me sentó con los expertos que necesitaba y en horas tenía un plan que habría tomado meses."
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1E2A4A] flex items-center justify-center text-xs font-semibold text-[#B8860B]">
              C
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Carlos M.</p>
              <p className="text-xs text-[#8892A4]">Fundador — SaaS B2B</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
