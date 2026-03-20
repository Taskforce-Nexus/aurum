import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import LocaleSelector from '@/components/shared/LocaleSelector'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="bg-[#0A1128] text-white min-h-screen font-sans">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 md:px-8 lg:px-16 border-b border-[#1E2A4A] bg-[#0A1128]/95 backdrop-blur-sm">
        <Link href="/" className="shrink-0">
          <Image src="/branding/logo-claro-reason.png" alt="Reason" width={90} height={28} />
        </Link>
        <div className="flex items-center gap-4 md:gap-8">
          <a href="#como-funciona" className="hidden md:block text-[14px] text-[#8B9DB7] hover:text-white transition-colors">
            Cómo funciona
          </a>
          <Link href="/pricing" className="hidden md:block text-[14px] text-[#8B9DB7] hover:text-white transition-colors">
            Precios
          </Link>
          <Link href="/login" className="hidden md:block text-[14px] text-[#8B9DB7] hover:text-white transition-colors">
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 bg-[#B8860B] hover:bg-[#A07710] text-black font-semibold text-[14px] rounded-lg transition-colors"
          >
            Crear cuenta →
          </Link>
        </div>
      </nav>

      {/* ── 1. HERO ── */}
      <section className="pt-32 md:pt-44 pb-20 md:pb-28 px-4 md:px-8 lg:px-16">
        <div className="max-w-[860px] mx-auto text-center space-y-8">
          <p className="text-[11px] text-[#B8860B] uppercase tracking-[3px] font-semibold font-outfit">
            Strategic Reasoning Partner for Consequential Decisions
          </p>
          <h1 className="text-[34px] md:text-[52px] font-bold font-outfit leading-[1.12] text-white">
            En un mundo donde construir es barato,{' '}
            <br className="hidden md:block" />
            la ventaja es{' '}
            <em className="not-italic text-[#B8860B]">razonar mejor.</em>
          </h1>
          <p className="text-[16px] md:text-[18px] text-[#8B9DB7] leading-relaxed max-w-[640px] mx-auto font-[Open_Sans]">
            Reason ayuda a founders, CEOs y operadores a tomar decisiones estratégicas más inteligentes
            antes de que la ejecución se vuelva costosa.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/register"
              className="w-full sm:w-auto px-7 py-3.5 bg-[#B8860B] hover:bg-[#A07710] text-black font-semibold text-[15px] rounded-lg transition-colors text-center"
            >
              Crear cuenta gratis →
            </Link>
            <a
              href="#como-funciona"
              className="w-full sm:w-auto px-7 py-3.5 border border-[#1E2A4A] hover:border-[#4A5568] text-[#8B9DB7] hover:text-white text-[15px] rounded-lg transition-colors text-center"
            >
              Ver cómo funciona
            </a>
          </div>

          {/* Product mockup */}
          <div className="mt-14 rounded-2xl border border-[#1E2A4A] bg-[#0D1535] overflow-hidden shadow-2xl">
            <div className="h-8 bg-[#070E20] flex items-center px-4 gap-1.5 border-b border-[#1E2A4A]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#E53E3E]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#B8860B]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#48BB78]" />
            </div>
            <div className="h-[300px] flex items-center justify-center px-8 py-6">
              <div className="space-y-3 w-full max-w-[580px]">
                <div className="flex gap-3">
                  {['#B8860B', '#4299E1', '#48BB78'].map((c) => (
                    <div key={c} className="w-[110px] h-[72px] bg-[#0A1128] border border-[#1E2A4A] rounded-lg flex flex-col items-center justify-center gap-1.5">
                      <div className="w-5 h-5 rounded-full" style={{ background: `${c}30`, border: `1px solid ${c}50` }} />
                      <div className="w-14 h-1.5 bg-[#1E2A4A] rounded" />
                      <div className="w-8 h-1 bg-[#1E2A4A] rounded" />
                    </div>
                  ))}
                  <div className="flex-1 h-[72px] bg-[#0A1128] border border-[#1E2A4A] rounded-lg p-3 space-y-1.5">
                    <div className="w-full h-1.5 bg-[#1E2A4A] rounded" />
                    <div className="w-3/4 h-1.5 bg-[#1E2A4A] rounded" />
                    <div className="w-full h-1.5 bg-[#1E2A4A] rounded" />
                    <div className="w-1/2 h-1.5 bg-[#1E2A4A] rounded" />
                  </div>
                </div>
                <div className="h-[130px] bg-[#0A1128] border border-[#1E2A4A] rounded-lg p-4 space-y-2.5">
                  {[['#B8860B', '3/4'], ['#4299E1', '2/3']].map(([c, w]) => (
                    <div key={c} className="flex gap-2 items-center">
                      <div className="w-6 h-6 rounded-full shrink-0" style={{ background: `${c}20`, border: `1px solid ${c}40` }} />
                      <div className="space-y-1 flex-1">
                        <div className="w-full h-1.5 bg-[#1E2A4A] rounded" />
                        <div className={`w-[${w}] h-1.5 bg-[#1E2A4A] rounded`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. EL PROBLEMA ── */}
      <section className="py-20 md:py-28 px-4 md:px-8 lg:px-16 bg-[#0D1535]">
        <div className="max-w-[820px] mx-auto space-y-10">
          <p className="text-[11px] text-[#B8860B] uppercase tracking-[3px] font-semibold font-outfit">El problema real</p>
          <blockquote className="border-l-4 border-[#B8860B] pl-8 space-y-4">
            <p className="text-[22px] md:text-[28px] font-outfit font-medium text-white leading-snug">
              El enemigo no es la experiencia humana ni la ambición humana.
            </p>
            <p className="text-[17px] md:text-[20px] font-outfit text-[#8B9DB7] leading-snug">
              El enemigo es el juicio sin examinar.
            </p>
          </blockquote>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {[
              'Instinto tratado como estrategia',
              'Apego de founder confundido con insight',
              'Carisma confundido con mérito',
              'Momentum confundido con validación',
              'Opinión confundida con rigor',
              'Iteración sin eliminación disciplinada',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#B8860B] mt-2 shrink-0" />
                <p className="text-[14px] text-[#8B9DB7] leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. LA TESIS ── */}
      <section className="py-20 md:py-28 px-4 md:px-8 lg:px-16 bg-[#0A1128]">
        <div className="max-w-[900px] mx-auto space-y-10">
          <div className="space-y-3">
            <p className="text-[11px] text-[#B8860B] uppercase tracking-[3px] font-semibold font-outfit">La tesis</p>
            <h2 className="text-[26px] md:text-[34px] font-bold font-outfit text-white leading-tight">
              A medida que ejecutar se vuelve más barato,
              <br className="hidden md:block" /> los ganadores son quienes mejor deciden.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                headline: 'El costo de construir colapsa.',
                body: 'El software reduce los costos de producción al mínimo. Pero no reembolsa el tiempo desperdiciado en la apuesta incorrecta.',
                color: '#E53E3E',
              },
              {
                headline: 'El tiempo es finito.',
                body: 'Cada semana construyendo sin validar es capital humano quemado. La velocidad de ejecución no reemplaza la calidad de la decisión.',
                color: '#B8860B',
              },
              {
                headline: 'El cambio supera el juicio biológico.',
                body: 'En cambio exponencial, el razonamiento a velocidad de máquina es una ventaja competitiva real.',
                color: '#4299E1',
              },
            ].map((card) => (
              <div key={card.headline} className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-6 space-y-3">
                <div className="w-8 h-0.5 rounded" style={{ background: card.color }} />
                <p className="text-[15px] font-outfit font-semibold text-white leading-snug">{card.headline}</p>
                <p className="text-[13px] text-[#6E8EAD] leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. QUÉ ES REASON ── */}
      <section className="py-20 md:py-28 px-4 md:px-8 lg:px-16 bg-[#0D1535]">
        <div className="max-w-[720px] mx-auto text-center space-y-6">
          <p className="text-[11px] text-[#B8860B] uppercase tracking-[3px] font-semibold font-outfit">Qué es Reason</p>
          <h2 className="text-[28px] md:text-[38px] font-bold font-outfit text-white leading-tight">
            No reemplazamos la ambición humana.
            <br />
            No eliminamos la responsabilidad humana.
            <br />
            No prometemos certeza.
          </h2>
          <p className="text-[18px] md:text-[22px] font-outfit font-semibold">
            <span className="text-[#B8860B]">La disciplina.</span>{' '}
            <span className="text-white">Mejoramos la calidad del pensamiento antes de la acción.</span>
          </p>
          <p className="text-[15px] text-[#8B9DB7] leading-relaxed max-w-[560px] mx-auto">
            Reason ayuda a founders, CEOs y dueños de negocios a tomar mejores decisiones estratégicas
            aplicando razonamiento disciplinado a velocidad de máquina antes de que la ejecución se vuelva costosa.
          </p>
        </div>
      </section>

      {/* ── 5. CÓMO FUNCIONA ── */}
      <section id="como-funciona" className="py-20 md:py-28 px-4 md:px-8 lg:px-16 bg-[#0A1128]">
        <div className="max-w-[900px] mx-auto space-y-10">
          <div className="space-y-3">
            <p className="text-[11px] text-[#B8860B] uppercase tracking-[3px] font-semibold font-outfit">Cómo funciona</p>
            <h2 className="text-[26px] md:text-[34px] font-bold font-outfit text-white">
              4 fases. Una mesa. Nadie se levanta hasta resolver.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                n: '01',
                title: 'Semilla',
                desc: 'Nexo te entrevista. Extrae la esencia de tu idea, supuestos ocultos y riesgos no articulados.',
              },
              {
                n: '02',
                title: 'Tu Consejo',
                desc: 'Seleccionas consejeros especializados. Cada uno con perspectiva única, estilo y agenda propia.',
              },
              {
                n: '03',
                title: 'Sesión de Consejo',
                desc: 'Sesión de trabajo estructurada. El consejo debate tu propuesta desde todos los ángulos.',
              },
              {
                n: '04',
                title: 'Documentos',
                desc: '15 documentos estratégicos generados: VPC, plan de negocio, arquitectura técnica y más.',
              },
            ].map((step) => (
              <div key={step.n} className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-5 space-y-3">
                <p className="text-[32px] font-bold font-outfit text-[#B8860B]/20">{step.n}</p>
                <p className="text-[14px] font-outfit font-semibold text-white">{step.title}</p>
                <p className="text-[12px] text-[#6E8EAD] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. NEXO DUAL ── */}
      <section className="py-20 md:py-28 px-4 md:px-8 lg:px-16 bg-[#0D1535]">
        <div className="max-w-[900px] mx-auto space-y-10">
          <div className="space-y-3">
            <p className="text-[11px] text-[#B8860B] uppercase tracking-[3px] font-semibold font-outfit">Nexo Dual</p>
            <h2 className="text-[26px] md:text-[34px] font-bold font-outfit text-white leading-tight">
              La diferencia entre una idea y un negocio
              <br className="hidden md:block" /> es quién se sienta contigo a resolverlo.
            </h2>
            <p className="text-[15px] text-[#8B9DB7] leading-relaxed max-w-[560px]">
              Nexo opera en dos modos simultáneos para darte perspectiva completa. Ninguno gana. Tú decides.
            </p>
          </div>

          {/* Debate mockup */}
          <div className="bg-[#0A1128] border border-[#1E2A4A] rounded-2xl overflow-hidden">
            {/* Topic bar */}
            <div className="border-b border-[#1E2A4A] px-6 py-3">
              <p className="text-[12px] text-[#4A5568] font-outfit">Tema en sesión: <span className="text-[#8B9DB7]">Modelo de monetización freemium vs. pago desde el inicio</span></p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#1E2A4A]">
              {/* Constructivo */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#48BB78]" />
                  <p className="text-[11px] text-[#48BB78] uppercase tracking-wider font-semibold font-outfit">Nexo Constructivo</p>
                </div>
                <p className="text-[14px] text-white leading-relaxed">
                  &ldquo;Freemium reduce la fricción de adquisición. Con tu ICP técnico, el conversion rate de free-to-paid puede superar 8% si el producto demuestra valor en la primera sesión.&rdquo;
                </p>
                <div className="space-y-1.5">
                  {['Aceleración de adquisición temprana', 'Señal de producto sobre retención real', 'Palanca para Series A'].map((p) => (
                    <div key={p} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-[#48BB78]" />
                      <p className="text-[12px] text-[#6E8EAD]">{p}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Crítico */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#E53E3E]" />
                  <p className="text-[11px] text-[#E53E3E] uppercase tracking-wider font-semibold font-outfit">Nexo Crítico</p>
                </div>
                <p className="text-[14px] text-white leading-relaxed">
                  &ldquo;Freemium sin límite claro de valor entrenará a tus early adopters a no pagar. Los usuarios que no pagan no dan feedback accionable. Cobrar desde día uno filtra al cliente real.&rdquo;
                </p>
                <div className="space-y-1.5">
                  {['Riesgo de deuda de expectativas', 'CAC oculto en soporte de usuarios free', 'Señal de precio = señal de valor'].map((p) => (
                    <div key={p} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-[#E53E3E]" />
                      <p className="text-[12px] text-[#6E8EAD]">{p}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Synthesis bar */}
            <div className="border-t border-[#1E2A4A] px-6 py-3 bg-[#B8860B]/5 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#B8860B]" />
              <p className="text-[12px] text-[#B8860B] font-outfit font-medium">
                Nexo sintetiza los dos ángulos → <span className="text-white font-normal">Tú tomas la decisión.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. PARA QUIÉN ── */}
      <section className="py-20 md:py-28 px-4 md:px-8 lg:px-16 bg-[#0A1128]">
        <div className="max-w-[900px] mx-auto space-y-10">
          <div className="space-y-3">
            <p className="text-[11px] text-[#B8860B] uppercase tracking-[3px] font-semibold font-outfit">Para quién es Reason</p>
            <h2 className="text-[26px] md:text-[34px] font-bold font-outfit text-white">
              Autoridad intelectual premium para quienes toman decisiones que importan.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { title: 'Founders', desc: 'Estructura mental antes de comprometer tiempo y capital.' },
              { title: 'CEOs', desc: 'Razonamiento riguroso antes de decisiones estratégicas de alto impacto.' },
              { title: 'Dueños de negocio', desc: 'Claridad en pivots, expansión y asignación de recursos.' },
              { title: 'Directores', desc: 'Perspectiva independiente antes de comprometerse con una dirección.' },
              { title: 'Operadores', desc: 'Disciplina de proceso para decisiones tácticas complejas.' },
            ].map((icp) => (
              <div key={icp.title} className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-5 space-y-2">
                <p className="text-[14px] text-white font-semibold font-outfit">{icp.title}</p>
                <p className="text-[12px] text-[#6E8EAD] leading-relaxed">{icp.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. PLANES ── */}
      <section className="py-20 md:py-28 px-4 md:px-8 lg:px-16 bg-[#0D1535]">
        <div className="max-w-[900px] mx-auto space-y-10">
          <div className="space-y-3 text-center">
            <p className="text-[11px] text-[#B8860B] uppercase tracking-[3px] font-semibold font-outfit">Planes</p>
            <h2 className="text-[26px] md:text-[34px] font-bold font-outfit text-white">
              Empieza gratis. Escala cuando razones más.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                name: 'Free',
                price: '$0',
                period: 'siempre',
                desc: 'Exploración y primer proyecto.',
                features: ['1 proyecto activo', 'Incubación completa', 'Consejo básico (3 consejeros)'],
                cta: 'Empezar gratis',
                highlight: false,
              },
              {
                name: 'Reason Core',
                price: '$29',
                period: '/mes',
                desc: 'Entorno de razonamiento diario.',
                features: ['Proyectos ilimitados', 'Consejo completo (hasta 9)', 'Documentos exportables'],
                cta: 'Empezar ahora',
                highlight: true,
              },
              {
                name: 'Reason Board',
                price: '$79',
                period: '/mes',
                desc: 'Multi-agente para decisiones mayores.',
                features: ['Todo lo de Core', 'Sesiones ampliadas', 'Prioridad en procesamiento'],
                cta: 'Ver plan Pro',
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl p-6 space-y-5 border ${
                  plan.highlight
                    ? 'bg-[#0A1128] border-[#B8860B]'
                    : 'bg-[#0A1128] border-[#1E2A4A]'
                }`}
              >
                <div className="space-y-1">
                  <p className="text-[12px] text-[#8B9DB7] font-outfit font-medium">{plan.name}</p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-[32px] font-bold font-outfit text-white">{plan.price}</p>
                    <p className="text-[13px] text-[#4A5568]">{plan.period}</p>
                  </div>
                  <p className="text-[12px] text-[#6E8EAD]">{plan.desc}</p>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#B8860B] mt-1.5 shrink-0" />
                      <p className="text-[12px] text-[#8B9DB7]">{f}</p>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/pricing"
                  className={`block w-full text-center py-2.5 text-[13px] font-semibold rounded-lg transition-colors ${
                    plan.highlight
                      ? 'bg-[#B8860B] hover:bg-[#A07710] text-black'
                      : 'border border-[#1E2A4A] hover:border-[#4A5568] text-[#8B9DB7] hover:text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-[12px] text-[#4A5568]">
            También disponible Reason Command ($199/mes) para equipos ejecutivos.{' '}
            <Link href="/pricing" className="text-[#B8860B] hover:underline">Ver todos los planes →</Link>
          </p>
        </div>
      </section>

      {/* ── 9. LA LÍNEA MAESTRA ── */}
      <section className="py-24 md:py-36 px-4 md:px-8 lg:px-16 bg-[#0A1128]">
        <div className="max-w-[800px] mx-auto text-center space-y-8">
          <p className="text-[11px] text-[#B8860B] uppercase tracking-[3px] font-semibold font-outfit">La premisa</p>
          <blockquote className="text-[24px] md:text-[36px] font-outfit font-medium text-white leading-[1.2]">
            &ldquo;In a world where almost anything can be built,{' '}
            <span className="text-[#B8860B]">Reason helps you decide what is actually worth building.</span>&rdquo;
          </blockquote>
          <Link
            href="/register"
            className="inline-flex items-center px-8 py-4 bg-[#B8860B] hover:bg-[#A07710] text-black font-bold text-[16px] rounded-xl transition-colors"
          >
            Crear Cuenta Gratis →
          </Link>
          <p className="text-[12px] text-[#4A5568]">Sin tarjeta de crédito · Sin límite de tiempo en el plan Free</p>
        </div>
      </section>

      {/* ── 10. FOOTER ── */}
      <footer className="py-12 px-4 md:px-8 lg:px-16 border-t border-[#1E2A4A] bg-[#0A1128]">
        <div className="max-w-[900px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Logo col */}
            <div className="col-span-2 md:col-span-1 space-y-3">
              <Link href="/">
                <Image src="/branding/logo-claro-reason.png" alt="Reason" width={80} height={25} />
              </Link>
              <p className="text-[12px] text-[#4A5568] leading-relaxed">
                Strategic Reasoning Partner for Consequential Decisions.
              </p>
            </div>
            {/* Producto */}
            <div className="space-y-3">
              <p className="text-[12px] text-white font-semibold font-outfit uppercase tracking-wider">Producto</p>
              <ul className="space-y-2">
                {[{ label: 'Cómo funciona', href: '#como-funciona' }, { label: 'Precios', href: '/pricing' }].map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-[13px] text-[#4A5568] hover:text-[#8B9DB7] transition-colors">{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
            {/* Legal */}
            <div className="space-y-3">
              <p className="text-[12px] text-white font-semibold font-outfit uppercase tracking-wider">Legal</p>
              <ul className="space-y-2">
                {[{ label: 'Privacidad', href: '/privacy' }, { label: 'Términos', href: '/terms' }].map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-[13px] text-[#4A5568] hover:text-[#8B9DB7] transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            {/* Cuenta */}
            <div className="space-y-3">
              <p className="text-[12px] text-white font-semibold font-outfit uppercase tracking-wider">Cuenta</p>
              <ul className="space-y-2">
                {[{ label: 'Iniciar sesión', href: '/login' }, { label: 'Crear cuenta', href: '/register' }].map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-[13px] text-[#4A5568] hover:text-[#8B9DB7] transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-[#1E2A4A] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[12px] text-[#374151]">© 2026 Taskforce Global, LLC. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <LocaleSelector />
              <p className="text-[11px] text-[#2C3244]">Reason · Strategic Reasoning Partner</p>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
