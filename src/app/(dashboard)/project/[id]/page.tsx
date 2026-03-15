import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Project } from '@/lib/types'

const JOURNEY_STAGES = [
  'Sesión Semilla',
  'Selección de Consejeros',
  'Definición de Entregables',
  'Sesión de Consejo',
  'Entrega',
]

// ICP Founder documents (no Branding — that's AVA)
const EXPORT_DOCS = [
  { key: 'aurum_value_proposition' as const, label: 'Propuesta de Valor' },
  { key: 'aurum_business_model' as const, label: 'Modelo de Negocio' },
  { key: 'aurum_customer_journey' as const, label: 'Recorrido del Cliente' },
  { key: 'aurum_business_plan' as const, label: 'Plan de Negocio' },
]

function getActiveStage(p: Project, hasCouncil: boolean, hasDocs: boolean, hasConsultation: boolean): number {
  if (!p.founder_brief) return 0
  if (!hasCouncil) return 1
  if (!hasDocs) return 2
  if (!hasConsultation) return 3
  return 4
}

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!project) notFound()
  const p = project as Project & { description?: string | null; purpose?: string | null }

  const [councilRes, docsRes, consultationRes] = await Promise.all([
    supabase.from('councils').select('*').eq('project_id', params.id).maybeSingle(),
    supabase.from('project_documents').select('id, status').eq('project_id', params.id),
    supabase.from('consultations').select('*').eq('project_id', params.id)
      .order('updated_at', { ascending: false }).limit(1),
  ])

  const council = councilRes.data
  const docs = docsRes.data ?? []
  const consultation = consultationRes.data?.[0] ?? null

  const activeStage = getActiveStage(p, !!council, docs.length > 0, !!consultation)
  const progressPct = Math.round((activeStage / (JOURNEY_STAGES.length - 1)) * 100)

  const docsReady = EXPORT_DOCS.filter(d => !!p[d.key]).length
  const exportPct = Math.round((docsReady / EXPORT_DOCS.length) * 100)
  const completedAurum = docsReady

  const purpose = p.purpose ?? council?.purpose ?? null
  const lastActive = p.last_active_at
    ? formatDistanceToNow(new Date(p.last_active_at), { addSuffix: true, locale: es })
    : null

  const PHASE_DESCRIPTIONS: Record<number, string> = {
    0: 'Captura el contexto de tu decisión con Nexo.',
    1: 'Configura los consejeros IA para tu proyecto.',
    2: 'Define los entregables de la sesión de consejo.',
    3: 'Tu consejo está trabajando en los documentos.',
    4: 'Todos los documentos han sido aprobados.',
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      {/* Main content */}
      <main className="flex-1 overflow-y-auto px-8 py-7">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#8892A4] mb-4">
          <Link href="/dashboard" className="hover:text-[#B8860B] transition-colors">← Proyectos</Link>
          <span>/</span>
          <span className="text-white">{p.name}{p.description ? ` — ${p.description}` : ''}</span>
        </div>

        {/* Project title */}
        <h1 className="font-outfit text-3xl font-bold text-white mb-1">
          {p.name}
          {p.description && <span className="text-[#8892A4] font-normal"> — {p.description}</span>}
        </h1>
        {lastActive && (
          <p className="text-xs text-[#8892A4] mb-4">Última actividad: {lastActive}</p>
        )}

        {/* Propósito del Consejo */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-[#B8860B] uppercase tracking-widest">Propósito del Consejo</span>
            <button type="button" title="Editar propósito" className="text-[#8892A4] hover:text-white transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          </div>
          <p className="text-sm text-[#C8D0E0]">
            {purpose ?? <span className="text-[#3A4560] italic">Define el propósito de tu consejo</span>}
          </p>
        </div>

        {/* Journey progress */}
        <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-5 mb-5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-[#8892A4] uppercase tracking-widest">Progreso del Journey</span>
            <span className="text-2xl font-bold text-[#B8860B] font-outfit">{activeStage + 1} de {JOURNEY_STAGES.length}</span>
          </div>
          <p className="font-outfit font-bold text-white text-lg mb-3">{JOURNEY_STAGES[activeStage]}</p>

          {/* Continuous progress bar */}
          <div className="h-1.5 bg-[#1E2A4A] rounded-full mb-4 overflow-hidden">
            <div className="h-full bg-[#B8860B] rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>

          {/* Stage labels row */}
          <div className="flex items-start">
            {JOURNEY_STAGES.map((stage, i) => (
              <div key={stage} className="flex-1 flex flex-col items-center gap-1">
                <span className={`text-[9px] text-center leading-tight ${
                  i < activeStage ? 'text-[#B8860B]' : i === activeStage ? 'text-white font-semibold' : 'text-[#3A4560]'
                }`}>
                  {i < activeStage ? `✓ ${stage}` : i === activeStage ? `● ${stage}` : `○ ${stage}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top 3 tiles */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Semilla */}
          <div className={`bg-[#0D1535] border border-[#1E2A4A] rounded-xl overflow-hidden flex flex-col ${p.founder_brief ? 'border-t-0' : ''}`}>
            {p.founder_brief && <div className="h-0.5 bg-[#22c55e]" />}
            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold uppercase tracking-widest ${p.founder_brief ? 'text-green-400' : 'text-[#8892A4]'}`}>Sesión Semilla</span>
                {p.founder_brief
                  ? <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />Completada</span>
                  : <span className="flex items-center gap-1 text-xs text-[#8892A4]"><span className="w-1.5 h-1.5 rounded-full bg-[#3A4560] inline-block" />Pendiente</span>
                }
              </div>
              <p className="text-xs text-[#8892A4] mb-4 flex-1 line-clamp-4 leading-relaxed">
                {p.founder_brief ?? 'Inicia la conversación con Nexo para capturar el contexto de tu decisión.'}
              </p>
              <Link href={`/project/${p.id}/semilla`}
                className="block w-full border border-[#1E2A4A] hover:border-[#B8860B] text-[#8892A4] hover:text-white text-xs font-medium py-2 rounded-lg text-center transition-colors">
                Ver sesión completa →
              </Link>
            </div>
          </div>

          {/* Sesión de Consejo */}
          <div className={`bg-[#0D1535] border border-[#1E2A4A] rounded-xl overflow-hidden flex flex-col ${activeStage >= 3 ? 'border-t-0' : ''}`}>
            {activeStage >= 3 && <div className="h-0.5 bg-[#B8860B]" />}
            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold uppercase tracking-widest ${activeStage >= 3 ? 'text-[#B8860B]' : 'text-[#8892A4]'}`}>Sesión de Consejo</span>
                {activeStage >= 3
                  ? <span className="flex items-center gap-1 text-xs text-[#B8860B] bg-[#B8860B]/10 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-[#B8860B] inline-block" />Activa</span>
                  : <span className="flex items-center gap-1 text-xs text-[#8892A4]"><span className="w-1.5 h-1.5 rounded-full bg-[#3A4560] inline-block" />Pendiente</span>
                }
              </div>
              <p className="text-sm text-white font-semibold mb-1">{council?.current_doc ?? 'Modelo de Negocio'}</p>
              <p className="text-xs text-[#8892A4] mb-4 flex-1">
                {activeStage >= 3
                  ? `hace 2 horas · ${council?.message_count ?? 47} mensajes`
                  : 'Se activa tras configurar el consejo asesor.'}
              </p>
              {activeStage >= 3 ? (
                <Link href={`/project/${p.id}/sesion-consejo`}
                  className="block w-full bg-[#B8860B] hover:bg-[#a07509] text-white text-xs font-semibold py-2 rounded-lg text-center transition-colors">
                  Continuar sesión →
                </Link>
              ) : (
                <button type="button" disabled className="w-full border border-[#1E2A4A] text-[#3A4560] text-xs font-medium py-2 rounded-lg cursor-not-allowed">
                  Continuar sesión →
                </button>
              )}
            </div>
          </div>

          {/* Consultoría Activa */}
          <div className={`bg-[#0D1535] border border-[#1E2A4A] rounded-xl overflow-hidden flex flex-col ${consultation ? 'border-t-0' : ''}`}>
            {consultation && <div className="h-0.5 bg-[#B8860B]" />}
            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold uppercase tracking-widest ${consultation ? 'text-[#B8860B]' : 'text-[#8892A4]'}`}>Consultoría Activa</span>
                {consultation
                  ? <span className="flex items-center gap-1 text-xs text-[#B8860B] bg-[#B8860B]/10 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-[#B8860B] inline-block" />{consultation.message_count ?? 3} consultas</span>
                  : <span className="flex items-center gap-1 text-xs text-[#8892A4]"><span className="w-1.5 h-1.5 rounded-full bg-[#3A4560] inline-block" />Pendiente</span>
                }
              </div>
              {consultation ? (
                <>
                  <p className="text-xs text-[#8892A4] mb-1">Última consulta hace {formatDistanceToNow(new Date(consultation.updated_at ?? consultation.created_at), { locale: es })}</p>
                  <p className="text-xs text-white italic mb-1 line-clamp-2">&ldquo;{consultation.last_question ?? '¿Cómo ajusto el pricing si mi CAC subió 30%?'}&rdquo;</p>
                  <p className="text-xs text-[#8892A4] mb-4 flex-1">— Respondido por: {consultation.last_advisor ?? 'Estratega de Negocio'}</p>
                </>
              ) : (
                <p className="text-xs text-[#8892A4] mb-4 flex-1">Disponible una vez completada la Sesión de Consejo.</p>
              )}
              {consultation ? (
                <Link href={`/project/${p.id}/consultoria`}
                  className="block w-full bg-[#B8860B] hover:bg-[#a07509] text-white text-xs font-semibold py-2 rounded-lg text-center transition-colors">
                  Abrir consultoría →
                </Link>
              ) : (
                <button type="button" disabled className="w-full border border-[#1E2A4A] text-[#3A4560] text-xs font-medium py-2 rounded-lg cursor-not-allowed">
                  Abrir consultoría →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom 2 tiles */}
        <div className="grid grid-cols-5 gap-4">
          {/* Consejo Asesor — 3 cols */}
          <div className="col-span-3 bg-[#0D1535] border border-[#1E2A4A] rounded-xl overflow-hidden">
            <div className="h-0.5 bg-blue-500" />
            <div className="p-5">
              <span className="text-xs font-semibold text-[#5B9BD5] uppercase tracking-widest">Consejo Asesor</span>
              <p className="text-sm text-white font-semibold mt-2 mb-1">
                {council?.advisor_count ? `${council.advisor_count} asesores configurados` : '0 asesores configurados'}
              </p>
              {/* Advisor avatars */}
              <div className="flex gap-2 my-3">
                {Array.from({ length: Math.min(council?.advisor_count ?? 0, 5) }).map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: ['#B8860B','#5B9BD5','#22c55e','#a855f7','#f97316'][i] }}>
                    {['M','V','R','F','A'][i]}
                  </div>
                ))}
                {(!council?.advisor_count || council.advisor_count === 0) && (
                  <div className="w-8 h-8 rounded-full bg-[#1E2A4A] border border-dashed border-[#3A4560] flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3A4560" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-xs text-[#8892A4] mb-4">
                {lastActive ? `Última actividad ${lastActive}` : 'Sin actividad reciente'}
              </p>
              <Link href={`/project/${p.id}/consejo`}
                className="inline-block border border-[#1E2A4A] hover:border-[#B8860B] text-[#8892A4] hover:text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors">
                Ver Board →
              </Link>
            </div>
          </div>

          {/* Exportación — 2 cols */}
          <div className="col-span-2 bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#8892A4] uppercase tracking-widest">Exportación</span>
              <span className="text-xs font-semibold text-[#B8860B] bg-[#B8860B]/10 px-2 py-0.5 rounded-full">{exportPct}%</span>
            </div>
            <p className="text-sm text-white font-semibold mb-2">{docsReady} de {EXPORT_DOCS.length} documentos listos</p>
            {/* Progress bar */}
            <div className="h-1 bg-[#1E2A4A] rounded-full mb-3 overflow-hidden">
              <div className="h-full bg-[#B8860B] rounded-full transition-all" style={{ width: `${exportPct}%` }} />
            </div>
            {/* Summary text */}
            <p className="text-xs text-[#8892A4] mb-3 leading-relaxed">
              {(() => {
                const done = EXPORT_DOCS.filter(d => !!p[d.key]).map(d => d.label)
                const pending = EXPORT_DOCS.filter(d => !p[d.key]).map(d => d.label)
                if (done.length === 0) return 'Ningún documento listo aún.'
                if (pending.length === 0) return 'Todos los documentos listos para exportar.'
                return `${done.join(' · ')} ${done.length > 1 ? 'listos' : 'listo'}. ${pending.join(', ')} pendiente${pending.length > 1 ? 's' : ''}.`
              })()}
            </p>
            <Link href={`/project/${p.id}/export`}
              className="block w-full border border-[#1E2A4A] hover:border-[#B8860B] text-[#8892A4] hover:text-white text-xs font-medium py-2 rounded-lg text-center transition-colors">
              Ir al Export Center →
            </Link>
          </div>
        </div>
      </main>

      {/* Right sidebar */}
      <aside className="w-72 border-l border-[#1E2A4A] px-6 py-7 shrink-0 overflow-y-auto">
        <h3 className="font-outfit font-semibold text-white text-sm mb-4">Resumen del Proyecto</h3>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: 'Etapas', value: `${activeStage + 1}/5` },
            { label: 'Mensajes', value: council?.message_count ? String(council.message_count) : '—' },
            { label: 'Tiempo', value: '—' },
          ].map(stat => (
            <div key={stat.label} className="bg-[#0D1535] border border-[#1E2A4A] rounded-lg p-3 text-center">
              <p className="text-base font-bold text-[#B8860B] font-outfit">{stat.value}</p>
              <p className="text-[10px] text-[#8892A4] mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Fase actual */}
        <div className="mb-4">
          <p className="text-[10px] font-semibold text-[#8892A4] uppercase tracking-widest mb-2">Fase Actual</p>
          <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-lg p-3">
            <p className="text-sm font-semibold text-white mb-1">{JOURNEY_STAGES[activeStage]}</p>
            <p className="text-xs text-[#8892A4] leading-relaxed">{PHASE_DESCRIPTIONS[activeStage]}</p>
          </div>
        </div>

        {/* Último insight */}
        {(council?.last_insight || p.founder_brief) && (
          <div className="mb-4">
            <p className="text-[10px] font-semibold text-[#8892A4] uppercase tracking-widest mb-2">Último Insight</p>
            <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-lg p-3 border-l-2 border-l-[#B8860B]">
              <p className="text-xs text-[#C8D0E0] italic leading-relaxed line-clamp-4 mb-2">
                &ldquo;{council?.last_insight ?? p.founder_brief}&rdquo;
              </p>
              {council?.last_insight_source && (
                <p className="text-[10px] text-[#8892A4]">— {council.last_insight_source}</p>
              )}
            </div>
          </div>
        )}

        {/* Documents summary */}
        <div>
          <p className="text-[10px] font-semibold text-[#8892A4] uppercase tracking-widest mb-2">Documentos Reason</p>
          <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-lg p-3">
            <p className="font-outfit text-2xl font-bold text-white">{completedAurum}<span className="text-sm text-[#8892A4] font-normal"> / {EXPORT_DOCS.length}</span></p>
            <p className="text-xs text-[#8892A4] mt-0.5">aprobados</p>
          </div>
        </div>
      </aside>
    </div>
  )
}
