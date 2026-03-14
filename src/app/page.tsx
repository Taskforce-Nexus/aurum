import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

export default async function LandingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="bg-[#0A1128] text-white min-h-screen font-sans">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-16 border-b border-[#1E2A4A] bg-[#0A1128]/95 backdrop-blur-sm">
        <Link href="/" className="shrink-0">
          <Image src="/branding/logo-claro-reason.png" alt="Reason" width={90} height={28} />
        </Link>
        <div className="flex items-center gap-8">
          <a href="#caracteristicas" className="text-[14px] text-[#8B9DB7] hover:text-white transition-colors">
            Características
          </a>
          <a href="#precio" className="text-[14px] text-[#8B9DB7] hover:text-white transition-colors">
            Precio
          </a>
          <Link
            href="/login"
            className="text-[14px] text-[#8B9DB7] hover:text-white transition-colors"
          >
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
      <section className="pt-40 pb-24 px-16 bg-[#0A1128]">
        <div className="max-w-[900px] mx-auto text-center space-y-8">
          <p className="text-[11px] text-[#B8860B] uppercase tracking-[3px] font-semibold">
            Sistema de Creación de Proyectos
          </p>
          <h1 className="text-[48px] font-bold font-outfit leading-[1.15] text-white">
            Los negocios no mueren en el campo de batalla.
            <br />
            <span className="text-[#B8860B]">Mueren en la imaginación.</span>
          </h1>
          <p className="text-[18px] text-[#8B9DB7] leading-relaxed max-w-[680px] mx-auto font-open-sans">
            Reason transforma tu idea en un proyecto estructurado con consejo asesor, documentos estratégicos y arquitectura de producto lista para construir.
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <Link
              href="/register"
              className="px-6 py-3 bg-[#B8860B] hover:bg-[#A07710] text-black font-semibold text-[15px] rounded-lg transition-colors"
            >
              Crear cuenta gratis →
            </Link>
            <a
              href="#como-funciona"
              className="px-6 py-3 border border-[#1E2A4A] hover:border-[#4A5568] text-[#8B9DB7] hover:text-white text-[15px] rounded-lg transition-colors"
            >
              Ver cómo funciona
            </a>
          </div>

          {/* Product mockup */}
          <div className="mt-12 rounded-2xl border border-[#1E2A4A] bg-[#0D1535] overflow-hidden shadow-2xl">
            <div className="h-8 bg-[#070E20] flex items-center px-4 gap-1.5 border-b border-[#1E2A4A]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#E53E3E]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#B8860B]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#48BB78]" />
            </div>
            <div className="h-[320px] flex items-center justify-center">
              <div className="space-y-3 w-full max-w-[600px] px-8">
                <div className="flex gap-3">
                  <div className="w-[120px] h-[80px] bg-[#0A1128] border border-[#1E2A4A] rounded-lg flex flex-col items-center justify-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-[#B8860B]/20 border border-[#B8860B]/40" />
                    <div className="w-16 h-1.5 bg-[#1E2A4A] rounded" />
                    <div className="w-10 h-1 bg-[#1E2A4A] rounded" />
                  </div>
                  <div className="w-[120px] h-[80px] bg-[#0A1128] border border-[#1E2A4A] rounded-lg flex flex-col items-center justify-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-[#4299E1]/20 border border-[#4299E1]/40" />
                    <div className="w-16 h-1.5 bg-[#1E2A4A] rounded" />
                    <div className="w-10 h-1 bg-[#1E2A4A] rounded" />
                  </div>
                  <div className="w-[120px] h-[80px] bg-[#0A1128] border border-[#C5A55A]/30 rounded-lg flex flex-col items-center justify-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-[#48BB78]/20 border border-[#48BB78]/40" />
                    <div className="w-16 h-1.5 bg-[#1E2A4A] rounded" />
                    <div className="w-10 h-1 bg-[#1E2A4A] rounded" />
                  </div>
                  <div className="flex-1 h-[80px] bg-[#0A1128] border border-[#1E2A4A] rounded-lg p-3 space-y-1.5">
                    <div className="w-full h-1.5 bg-[#1E2A4A] rounded" />
                    <div className="w-3/4 h-1.5 bg-[#1E2A4A] rounded" />
                    <div className="w-full h-1.5 bg-[#1E2A4A] rounded" />
                    <div className="w-1/2 h-1.5 bg-[#1E2A4A] rounded" />
                  </div>
                </div>
                <div className="h-[140px] bg-[#0A1128] border border-[#1E2A4A] rounded-lg p-4 space-y-2">
                  <div className="flex gap-2 items-center">
                    <div className="w-6 h-6 rounded-full bg-[#B8860B]/20 border border-[#B8860B]/40 shrink-0" />
                    <div className="space-y-1 flex-1">
                      <div className="w-full h-1.5 bg-[#1E2A4A] rounded" />
                      <div className="w-3/4 h-1.5 bg-[#1E2A4A] rounded" />
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="w-6 h-6 rounded-full bg-[#4299E1]/20 border border-[#4299E1]/40 shrink-0" />
                    <div className="space-y-1 flex-1">
                      <div className="w-full h-1.5 bg-[#1E2A4A] rounded" />
                      <div className="w-2/3 h-1.5 bg-[#1E2A4A] rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEMA */}
      <section id="caracteristicas" className="py-24 px-16 bg-[#0D1535]">
        <div className="max-w-[900px] mx-auto space-y-12">
          <div className="space-y-4">
            <p className="text-[11px] text-[#B8860B] uppercase tracking-[3px] font-semibold">El problema real</p>
            <h2 className="text-[36px] font-bold font-outfit text-white leading-tight">
              La mayoría de founders piensan que fracasan
              <br className="hidden md:block" /> por falta de capital. No es así.
            </h2>
            <p className="text-[16px] text-[#8B9DB7] leading-relaxed max-w-[660px]">
              Fracasan porque nunca tuvieron la estructura mental para validar su idea antes de construirla.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {[
              { stat: '90%', label: 'de startups fracasan en los primeros 3 años', color: '#E53E3E' },
              { stat: '42%', label: 'mueren por falta de mercado — idea sin validar', color: '#B8860B' },
              { stat: '6×', label: 'más caro arreglar el rumbo después de lanzar', color: '#4299E1' },
            ].map((item) => (
              <div key={item.stat} className="bg-[#0A1128] border border-[#1E2A4A] rounded-xl p-6 space-y-2">
                <p className="text-[40px] font-bold font-outfit" style={{ color: item.color }}>
                  {item.stat}
                </p>
                <p className="text-[13px] text-[#8B9DB7] leading-relaxed">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARA QUIÉN */}
      <section className="py-24 px-16 bg-[#0A1128]">
        <div className="max-w-[900px] mx-auto space-y-10">
          <div className="space-y-3">
            <p className="text-[11px] text-[#B8860B] uppercase tracking-[3px] font-semibold">Para quién es Reason</p>
            <h2 className="text-[32px] font-bold font-outfit text-white">
              Diseñado para founders que piensan antes de construir
            </h2>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { title: 'Emprendedor con idea', desc: 'Tienes una idea clara pero no sabes cómo estructurarla ni validarla.' },
              { title: 'Fundador técnico', desc: 'Sabes construir pero necesitas claridad estratégica antes de escribir código.' },
              { title: 'Fundador no técnico', desc: 'Tienes visión y mercado. Necesitas un sistema que te dé estructura.' },
              { title: 'Equipo early-stage', desc: 'Un cofundador o equipo pequeño que quiere alinear su visión antes de ejecutar.' },
            ].map((icp) => (
              <div key={icp.title} className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-5 space-y-2">
                <p className="text-[14px] text-white font-semibold font-outfit">{icp.title}</p>
                <p className="text-[12px] text-[#6E8EAD] leading-relaxed">{icp.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" className="py-24 px-16 bg-[#0D1535]">
        <div className="max-w-[900px] mx-auto space-y-10">
          <div className="space-y-3">
            <p className="text-[11px] text-[#B8860B] uppercase tracking-[3px] font-semibold">Cómo funciona</p>
            <h2 className="text-[32px] font-bold font-outfit text-white">
              De idea a proyecto estructurado en 5 pasos
            </h2>
          </div>
          <div className="flex gap-4">
            {[
              { n: '01', title: 'Incubación', desc: 'Nexo te entrevista y extrae la esencia de tu idea con preguntas estratégicas.' },
              { n: '02', title: 'Tu Consejo', desc: 'Seleccionas 6-9 consejeros especializados que guiarán tu proyecto.' },
              { n: '03', title: 'Sesión de Consejo', desc: 'Sesión de trabajo guiada por IA donde el consejo analiza tu propuesta.' },
              { n: '04', title: 'Documentos', desc: '15 documentos estratégicos generados: VPC, plan de negocio, arquitectura técnica.' },
              { n: '05', title: 'Consultoría', desc: 'Chatea con tu consejo cuando quieras para tomar decisiones informadas.' },
            ].map((step) => (
              <div key={step.n} className="flex-1 bg-[#0A1128] border border-[#1E2A4A] rounded-xl p-5 space-y-2">
                <p className="text-[28px] font-bold font-outfit text-[#B8860B]/30">{step.n}</p>
                <p className="text-[14px] text-white font-semibold">{step.title}</p>
                <p className="text-[12px] text-[#6E8EAD] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONSEJO */}
      <section className="py-24 px-16 bg-[#0A1128]">
        <div className="max-w-[900px] mx-auto space-y-10">
          <div className="space-y-3">
            <p className="text-[11px] text-[#B8860B] uppercase tracking-[3px] font-semibold">Tu consejo asesor</p>
            <h2 className="text-[32px] font-bold font-outfit text-white">
              Un equipo de expertos IA siempre disponible
            </h2>
            <p className="text-[16px] text-[#8B9DB7] leading-relaxed max-w-[560px]">
              Cada consejero tiene especialidad, estilo de comunicación y perspectiva única. Juntos cubren todos los ángulos de tu proyecto.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { specialty: 'Investigación de Mercado', name: 'Dr. Maya Singh', style: 'Analítica y basada en datos', hat: '#F5F5F5' },
              { specialty: 'Estrategia de Negocios', name: 'Carlos Mendez', style: 'Directo y orientado a resultados', hat: '#B8860B' },
              { specialty: 'UX & Producto', name: 'Sofia Chen', style: 'Empática y centrada en usuario', hat: '#4299E1' },
              { specialty: 'Tecnología & Arquitectura', name: 'Arjun Patel', style: 'Pragmático y escalable', hat: '#48BB78' },
              { specialty: 'Finanzas & Modelos', name: 'Elena Vasquez', style: 'Rigurosa y conservadora', hat: '#374151' },
              { specialty: 'Legal & Compliance', name: 'Marco Rossi', style: 'Preciso y preventivo', hat: '#EF4444' },
            ].map((advisor) => (
              <div key={advisor.name} className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-4 space-y-1.5">
                <p className="text-[10px] text-[#6E8EAD] uppercase tracking-wider font-medium">{advisor.specialty}</p>
                <p className="text-[14px] text-white font-bold font-outfit">{advisor.name}</p>
                <p className="text-[11px] text-[#4A5568]">{advisor.style}</p>
                <div
                  className="w-[6px] h-[6px] rounded-sm mt-1"
                  style={{ backgroundColor: advisor.hat }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DOCUMENTOS */}
      <section className="py-24 px-16 bg-[#0D1535]">
        <div className="max-w-[900px] mx-auto space-y-10">
          <div className="space-y-3">
            <p className="text-[11px] text-[#B8860B] uppercase tracking-[3px] font-semibold">Documentos estratégicos</p>
            <h2 className="text-[32px] font-bold font-outfit text-white">
              15 documentos que definen tu negocio
            </h2>
            <p className="text-[16px] text-[#8B9DB7] leading-relaxed max-w-[560px]">
              Generados por tu consejo con IA, editables y exportables a PDF y PowerPoint.
            </p>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { name: 'Value Proposition Canvas', category: 'Estrategia' },
              { name: 'Business Model Canvas', category: 'Negocio' },
              { name: 'Plan de Negocio', category: 'Planificación' },
              { name: 'Arquitectura Técnica', category: 'Tecnología' },
              { name: 'Customer Journey Map', category: 'UX' },
              { name: 'Análisis Competitivo', category: 'Mercado' },
              { name: 'Modelo de Precios', category: 'Negocio' },
              { name: 'Estrategia de Go-to-Market', category: 'Crecimiento' },
            ].map((doc) => (
              <div key={doc.name} className="bg-[#0A1128] border border-[#1E2A4A] rounded-xl p-4 space-y-1.5">
                <p className="text-[9px] text-[#B8860B] uppercase tracking-wider font-medium">{doc.category}</p>
                <p className="text-[13px] text-white font-medium leading-tight">{doc.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEXO DUAL */}
      <section className="py-24 px-16 bg-[#0A1128]">
        <div className="max-w-[900px] mx-auto space-y-10">
          <div className="space-y-3">
            <p className="text-[11px] text-[#B8860B] uppercase tracking-[3px] font-semibold">Nexo</p>
            <h2 className="text-[32px] font-bold font-outfit text-white">
              El moderador que no tiene miedo de disentir
            </h2>
            <p className="text-[16px] text-[#8B9DB7] leading-relaxed max-w-[560px]">
              Nexo opera en dos modos simultáneos para darte perspectiva completa.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-[#0D1535] border border-[#48BB78]/30 rounded-xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#48BB78]" />
                <p className="text-[12px] text-[#48BB78] uppercase tracking-wider font-semibold">Nexo Constructivo</p>
              </div>
              <p className="text-[15px] text-white font-medium">&ldquo;Tu idea tiene potencial — aquí el camino más rápido al mercado.&rdquo;</p>
              <p className="text-[13px] text-[#6E8EAD] leading-relaxed">
                Sintetiza oportunidades, estructura el plan de acción y da forma al mejor escenario posible.
              </p>
            </div>
            <div className="bg-[#0D1535] border border-[#E53E3E]/30 rounded-xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#E53E3E]" />
                <p className="text-[12px] text-[#E53E3E] uppercase tracking-wider font-semibold">Nexo Crítico</p>
              </div>
              <p className="text-[15px] text-white font-medium">&ldquo;Antes de seguir — estos son los riesgos que no has considerado.&rdquo;</p>
              <p className="text-[13px] text-[#6E8EAD] leading-relaxed">
                Identifica gaps, supuestos sin validar y escenarios adversos antes de que cuesten dinero.
              </p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-[14px] text-[#4A5568]">Nexo sintetiza → Tú decides</p>
          </div>
        </div>
      </section>

      {/* SUITE AVA */}
      <section className="py-24 px-16 bg-[#0D1535]">
        <div className="max-w-[900px] mx-auto space-y-10">
          <div className="space-y-3">
            <p className="text-[11px] text-[#B8860B] uppercase tracking-[3px] font-semibold">Parte de la Suite AVA</p>
            <h2 className="text-[32px] font-bold font-outfit text-white">
              Reason es el primer módulo del sistema AVA
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-5">
            {[
              {
                name: 'Reason',
                desc: 'Estrategia, consejo asesor y documentos para tu negocio.',
                active: true,
              },
              {
                name: 'Build',
                desc: 'De los documentos al backlog técnico y arquitectura de sistema.',
                active: false,
              },
              {
                name: 'Launch',
                desc: 'Go-to-market, métricas y estrategia de crecimiento.',
                active: false,
              },
            ].map((product) => (
              <div
                key={product.name}
                className={`rounded-xl p-6 space-y-3 border ${
                  product.active
                    ? 'bg-[#0A1128] border-[#C5A55A]'
                    : 'bg-[#0A1128] border-[#1E2A4A] opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[18px] font-bold font-outfit text-white">{product.name}</p>
                  {product.active ? (
                    <span className="text-[9px] px-2 py-0.5 bg-[#B8860B]/10 border border-[#B8860B]/30 text-[#B8860B] rounded font-semibold uppercase tracking-wider">
                      Disponible
                    </span>
                  ) : (
                    <span className="text-[9px] px-2 py-0.5 bg-[#1E2A4A] text-[#4A5568] rounded font-semibold uppercase tracking-wider">
                      Próximamente
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-[#6E8EAD] leading-relaxed">{product.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section id="precio" className="py-32 px-16 bg-[#0A1128]">
        <div className="max-w-[700px] mx-auto text-center space-y-8">
          <h2 className="text-[36px] font-bold font-outfit text-white leading-tight">
            Tu próxima decisión estratégica
            <br />
            <span className="text-[#B8860B]">merece estructura.</span>
          </h2>
          <p className="text-[16px] text-[#8B9DB7] leading-relaxed">
            Empieza gratis. Sin tarjeta de crédito. Tu primer proyecto estructurado en menos de una hora.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center px-8 py-4 bg-[#B8860B] hover:bg-[#A07710] text-black font-bold text-[16px] rounded-xl transition-colors"
          >
            Crear Cuenta Gratis →
          </Link>
          <p className="text-[12px] text-[#4A5568]">Sin límites de tiempo · Exporta tus documentos · Cancela cuando quieras</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-16 border-t border-[#1E2A4A] bg-[#0A1128]">
        <div className="max-w-[900px] mx-auto flex items-center justify-between">
          <Link href="/">
            <Image src="/branding/logo-claro-reason.png" alt="Reason" width={70} height={22} />
          </Link>
          <div className="flex items-center gap-6">
            <a href="#caracteristicas" className="text-[13px] text-[#4A5568] hover:text-[#8B9DB7] transition-colors">
              Características
            </a>
            <a href="#precio" className="text-[13px] text-[#4A5568] hover:text-[#8B9DB7] transition-colors">
              Precio
            </a>
            <Link href="/login" className="text-[13px] text-[#4A5568] hover:text-[#8B9DB7] transition-colors">
              Contacto
            </Link>
          </div>
          <p className="text-[12px] text-[#374151]">© 2025 AVA Suite</p>
        </div>
      </footer>
    </div>
  )
}
