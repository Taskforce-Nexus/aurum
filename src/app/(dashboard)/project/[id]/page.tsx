import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Project } from '@/lib/types'

const PIPELINE_STAGES = [
  'Idea', 'Incubadora', 'Negocio', 'Producto', 'UX',
  'Frames', 'Iteración', 'Freeze', 'Expansión',
  'Scaffolding', 'Sistema', 'Backlog', 'Repo'
]

const DOCS_NEGOCIO = [
  { name: 'Propuesta de Valor', key: 'aurum_value_proposition' },
  { name: 'Modelo de Negocio', key: 'aurum_business_model' },
  { name: 'Recorrido del Cliente', key: 'aurum_customer_journey' },
  { name: 'Marca y Posicionamiento', key: 'aurum_branding' },
  { name: 'Plan de Negocio', key: 'aurum_business_plan' },
]

const DOCS_PRODUCTO = [
  'Concepto de Producto', 'PRD', 'Arquitectura UX',
  'Inventario de Frames', 'Expansión de Frames',
  'Scaffolding de Frames', 'Sistema de Diseño'
]

const DOCS_INGENIERIA = ['Diseño de Sistema', 'Backlog', 'Repositorio Blueprint']

function getPhaseIndex(phase: string | null): number {
  if (!phase) return 0
  const idx = PIPELINE_STAGES.findIndex(s => s.toLowerCase() === phase.toLowerCase())
  return idx >= 0 ? idx : 0
}

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!project) notFound()

  const p = project as Project
  const phaseIdx = getPhaseIndex(p.current_phase)
  const completedDocs = DOCS_NEGOCIO.filter(d => p[d.key as keyof Project]).length

  return (
    <div className="min-h-screen bg-[#0F0F11] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#2a2b30] px-6 py-3 flex items-center justify-between shrink-0">
        <span className="text-base font-bold tracking-widest text-[#C9A84C]">AURUM</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#6b6d75]">{user.email}</span>
          <div className="w-8 h-8 rounded-full bg-[#C9A84C] flex items-center justify-center text-[#0F0F11] text-xs font-bold">
            {user.email?.[0]?.toUpperCase()}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-[#6b6d75] mb-4">
            <Link href="/" className="hover:text-white transition-colors">← Proyectos</Link>
            <span>/</span>
            <span className="text-white">{p.name}</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold mb-1">{p.name}</h1>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/30 px-2.5 py-0.5 rounded-full font-medium">
              {p.current_phase ?? 'Semilla'}
            </span>
            <span className="text-xs text-[#6b6d75]">Última actividad: hace un momento</span>
          </div>

          {/* Pipeline progress */}
          <div className="bg-[#1A1B1E] border border-[#2a2b30] rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#6b6d75] uppercase tracking-wider font-medium">Progreso de Incubación</span>
              <span className="text-2xl font-bold text-[#C9A84C]">{phaseIdx + 1} de 13</span>
            </div>
            <p className="font-semibold mb-4">{PIPELINE_STAGES[phaseIdx]}</p>
            {/* Stage track */}
            <div className="flex items-center gap-0 mb-3">
              {PIPELINE_STAGES.map((stage, i) => (
                <div key={stage} className="flex items-center flex-1">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    i < phaseIdx ? 'bg-[#C9A84C]' : i === phaseIdx ? 'bg-[#C9A84C] ring-2 ring-[#C9A84C]/30' : 'bg-[#2a2b30]'
                  }`} />
                  {i < PIPELINE_STAGES.length - 1 && (
                    <div className={`h-px flex-1 ${i < phaseIdx ? 'bg-[#C9A84C]' : 'bg-[#2a2b30]'}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              {PIPELINE_STAGES.map((stage, i) => (
                <span key={stage} className={`text-[9px] ${i === phaseIdx ? 'text-[#C9A84C]' : 'text-[#3a3b40]'}`}>
                  {stage}
                </span>
              ))}
            </div>
          </div>

          {/* Control tiles */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {/* Incubadora tile */}
            <div className="bg-[#1A1B1E] border border-[#C9A84C]/30 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#6b6d75] uppercase tracking-wider">Incubadora</span>
                <span className="w-2 h-2 rounded-full bg-green-500" />
              </div>
              <p className="font-semibold mb-1">{p.current_phase ?? 'Semilla'}</p>
              <p className="text-xs text-[#6b6d75] mb-4">Activa</p>
              <Link href={`/project/${p.id}/incubadora`}
                className="block w-full bg-[#C9A84C] hover:bg-[#b8963f] text-[#0F0F11] font-semibold py-2 rounded-lg text-sm text-center transition-colors">
                Continuar sesión →
              </Link>
            </div>

            {/* Consejo Asesor tile */}
            <div className="bg-[#1A1B1E] border border-[#2a2b30] rounded-xl p-5">
              <div className="mb-2">
                <span className="text-xs text-[#6b6d75] uppercase tracking-wider">Consejo Asesor</span>
              </div>
              <p className="font-semibold mb-1">Pendiente de configuración</p>
              <p className="text-xs text-[#6b6d75] mb-4">Se activa tras la Semilla</p>
              <button disabled className="w-full border border-[#2a2b30] text-[#6b6d75] py-2 rounded-lg text-sm cursor-not-allowed">
                Ver Board →
              </button>
            </div>

            {/* Exportación tile */}
            <div className="bg-[#1A1B1E] border border-[#2a2b30] rounded-xl p-5">
              <div className="mb-2">
                <span className="text-xs text-[#6b6d75] uppercase tracking-wider">Exportación</span>
              </div>
              <p className="font-semibold mb-1">{completedDocs} de 15 documentos</p>
              <p className="text-xs text-[#6b6d75] mb-4">listos</p>
              <button disabled className="w-full border border-[#2a2b30] text-[#6b6d75] py-2 rounded-lg text-sm cursor-not-allowed">
                Ir al Export Center →
              </button>
            </div>
          </div>

          {/* Documents */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-[#6b6d75] uppercase tracking-wider font-medium">Documentos AURUM</span>
              <span className="text-xs text-[#6b6d75]">· {completedDocs} / 15</span>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-xs text-[#6b6d75] uppercase tracking-wider mb-2">Negocio</p>
                <div className="space-y-1">
                  {DOCS_NEGOCIO.map(doc => {
                    const hasDoc = !!p[doc.key as keyof Project]
                    return (
                      <div key={doc.name} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[#1A1B1E] transition-colors">
                        <div className={`w-3.5 h-3.5 rounded-sm border ${hasDoc ? 'bg-[#C9A84C] border-[#C9A84C]' : 'border-[#3a3b40]'}`} />
                        <span className="text-sm">{doc.name}</span>
                        {hasDoc && <span className="text-xs text-green-400 ml-auto">✓ Aprobado</span>}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs text-[#6b6d75] uppercase tracking-wider mb-2">Producto</p>
                <div className="space-y-1">
                  {DOCS_PRODUCTO.map(doc => (
                    <div key={doc} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[#1A1B1E] transition-colors">
                      <div className="w-3.5 h-3.5 rounded-sm border border-[#3a3b40]" />
                      <span className="text-sm text-[#6b6d75]">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-[#6b6d75] uppercase tracking-wider mb-2">Ingeniería</p>
                <div className="space-y-1">
                  {DOCS_INGENIERIA.map(doc => (
                    <div key={doc} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[#1A1B1E] transition-colors">
                      <div className="w-3.5 h-3.5 rounded-sm border border-[#3a3b40]" />
                      <span className="text-sm text-[#6b6d75]">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Right sidebar */}
        <aside className="w-72 border-l border-[#2a2b30] p-6 overflow-y-auto shrink-0">
          <h3 className="text-sm font-semibold mb-4">Resumen del Proyecto</h3>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[
              { label: 'Fases', value: `${phaseIdx + 1}/13` },
              { label: 'Mensajes', value: '—' },
              { label: 'Tiempo', value: '—' },
            ].map(stat => (
              <div key={stat.label} className="bg-[#1A1B1E] border border-[#2a2b30] rounded-lg p-3 text-center">
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-xs text-[#6b6d75]">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <p className="text-xs text-[#6b6d75] uppercase tracking-wider mb-2">Fase Actual</p>
            <div className="bg-[#1A1B1E] border border-[#2a2b30] rounded-lg p-3">
              <p className="font-semibold text-sm mb-1">{p.current_phase ?? 'Semilla'}</p>
              <p className="text-xs text-[#6b6d75]">
                {p.current_phase === 'Semilla'
                  ? 'Capturando la idea y el contexto del fundador con Nexo.'
                  : 'En progreso.'}
              </p>
            </div>
          </div>

          {p.founder_brief && (
            <div>
              <p className="text-xs text-[#6b6d75] uppercase tracking-wider mb-2">Último Insight</p>
              <div className="bg-[#1A1B1E] border border-[#2a2b30] rounded-lg p-3">
                <p className="text-xs text-[#6b6d75] italic line-clamp-4">{p.founder_brief}</p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
