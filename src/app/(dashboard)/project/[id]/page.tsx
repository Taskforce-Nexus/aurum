import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Project } from '@/lib/types'

const PIPELINE_STAGES = ['Semilla', 'Entregables', 'Consejo', 'Sesión', 'Entrega'] as const

type PipelineState = 'done' | 'active' | 'pending'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!project) notFound()
  const p = project as Project & { description?: string | null; purpose?: string | null }

  const [councilRes, docsRes, sessionRes] = await Promise.all([
    // Council with advisor names + specialties
    supabase
      .from('councils')
      .select('id, status, council_advisors(level, advisors(id, name, specialty))')
      .eq('project_id', id)
      .maybeSingle(),
    // Documents with status and composition presence
    supabase
      .from('project_documents')
      .select('id, name, status, deliverable_index, key_question, composition')
      .eq('project_id', id)
      .order('deliverable_index', { ascending: true }),
    // Most recent session
    supabase
      .from('sessions')
      .select('id, status')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
      .limit(1),
  ])

  const council = councilRes.data
  const docs = docsRes.data ?? []
  const session = sessionRes.data?.[0] ?? null

  // Council advisors with names
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const councilAdvisors = ((council as any)?.council_advisors ?? []).map((ca: any) => ({
    id: ca.advisors?.id as string,
    name: ca.advisors?.name as string,
    specialty: ca.advisors?.specialty as string | null,
    level: ca.level as string,
  }))

  // Derived document state
  const docsTotal = docs.length
  const docsPendiente = docs.filter(d => d.status === 'pendiente').length
  const docsReady = docs.filter(d => d.status === 'generado' || d.status === 'aprobado').length
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docsWithComposition = docs.filter(d => !!(d as any).composition).length

  // Pipeline state
  const hasSemilla = !!p.founder_brief
  const hasEntregables = docsWithComposition > 0
  const hasCouncil = councilAdvisors.length > 0
  const sessionActiva = session?.status === 'activa'
  const sessionCompleta = session?.status === 'completada'
  const hasExport = docsReady > 0

  // Consultoría tile: requires completed session
  const consultoriaUnlocked = sessionCompleta

  // Load consultation count for tile
  const { data: consultations } = await supabase
    .from('consultations')
    .select('id, messages')
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  const consultCount = consultations?.length ?? 0
  const totalMessages = (consultations ?? []).reduce((acc, c) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msgs = (c as any).messages as Array<{ role: string }> ?? []
    return acc + msgs.filter((m: { role: string }) => m.role === 'user').length
  }, 0)

  const pipelineStates: PipelineState[] = [
    hasSemilla ? 'done' : 'pending',
    hasEntregables ? 'done' : 'pending',
    hasCouncil ? 'done' : 'pending',
    sessionCompleta ? 'done' : sessionActiva ? 'active' : 'pending',
    hasExport ? 'done' : 'pending',
  ]

  // Active pipeline stage index (last non-pending)
  const activeStageIdx = [...pipelineStates].reverse().findIndex(s => s !== 'pending')
  const currentStageIdx = activeStageIdx === -1 ? 0 : PIPELINE_STAGES.length - 1 - activeStageIdx

  const purpose = p.purpose ?? (council as any)?.purpose ?? null
  const lastActive = p.last_active_at
    ? formatDistanceToNow(new Date(p.last_active_at), { addSuffix: true, locale: es })
    : null

  const PHASE_DESCRIPTIONS: Record<number, string> = {
    0: 'Captura el contexto de tu decisión con Nexo.',
    1: 'Define los entregables de la sesión de consejo.',
    2: 'Configura los consejeros IA para tu proyecto.',
    3: 'Tu consejo está trabajando en los documentos.',
    4: 'Todos los documentos han sido generados.',
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
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
          </div>
          <p className="text-sm text-[#C8D0E0]">
            {purpose ?? <span className="text-[#3A4560] italic">Define el propósito de tu consejo</span>}
          </p>
        </div>

        {/* ── Pipeline progress ─────────────────────────────── */}
        <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold text-[#8892A4] uppercase tracking-widest">Journey</span>
            <span className="text-xs text-[#8892A4]">{PIPELINE_STAGES[currentStageIdx]}</span>
          </div>

          {/* Stage dots + labels */}
          <div className="flex items-start gap-0">
            {PIPELINE_STAGES.map((stage, i) => {
              const state = pipelineStates[i]
              const isLast = i === PIPELINE_STAGES.length - 1
              return (
                <div key={stage} className="flex-1 flex flex-col items-center gap-1.5 relative">
                  {/* Connector line */}
                  {!isLast && (
                    <div className="absolute top-2.5 left-1/2 w-full h-0.5 z-0"
                      style={{ backgroundColor: pipelineStates[i + 1] !== 'pending' || state === 'done' ? '#B8860B' : '#1E2A4A' }} />
                  )}
                  {/* Dot */}
                  <div className={`w-5 h-5 rounded-full z-10 flex items-center justify-center text-[9px] font-bold shrink-0 ${
                    state === 'done'    ? 'bg-[#22c55e] text-white' :
                    state === 'active'  ? 'bg-[#B8860B] text-[#0A1128] animate-pulse' :
                                         'bg-[#1E2A4A] border border-[#3A4560] text-[#3A4560]'
                  }`}>
                    {state === 'done' ? '✓' : state === 'active' ? '●' : '○'}
                  </div>
                  {/* Label */}
                  <span className={`text-[9px] text-center leading-tight ${
                    state === 'done'   ? 'text-[#22c55e]' :
                    state === 'active' ? 'text-[#B8860B] font-semibold' :
                                        'text-[#3A4560]'
                  }`}>
                    {stage}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Top 3 tiles ──────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-4">

          {/* Tile 1 — Semilla */}
          <div className={`bg-[#0D1535] border border-[#1E2A4A] rounded-xl overflow-hidden flex flex-col ${hasSemilla ? 'border-t-0' : ''}`}>
            {hasSemilla && <div className="h-0.5 bg-[#22c55e]" />}
            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold uppercase tracking-widest ${hasSemilla ? 'text-green-400' : 'text-[#8892A4]'}`}>
                  Sesión Semilla
                </span>
                {hasSemilla
                  ? <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />Completada
                    </span>
                  : <span className="flex items-center gap-1 text-xs text-[#8892A4]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3A4560] inline-block" />En curso
                    </span>
                }
              </div>
              <p className="text-xs text-[#8892A4] mb-4 flex-1 line-clamp-4 leading-relaxed">
                {hasSemilla
                  ? p.founder_brief!.replace(/#{1,6}\s+/g, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/_(.*?)_/g, '$1').replace(/`(.*?)`/g, '$1')
                  : 'Inicia la conversación con Nexo para capturar el contexto de tu decisión.'}
              </p>
              {hasSemilla ? (
                <Link href={`/project/${p.id}/semilla`}
                  className="block w-full border border-[#1E2A4A] hover:border-[#B8860B] text-[#8892A4] hover:text-white text-xs font-medium py-2 rounded-lg text-center transition-colors">
                  Ver resumen →
                </Link>
              ) : (
                <Link href={`/project/${p.id}/seed-session`}
                  className="block w-full bg-[#B8860B] hover:bg-[#a07509] text-[#0A1128] text-xs font-semibold py-2 rounded-lg text-center transition-colors">
                  Continuar Semilla →
                </Link>
              )}
            </div>
          </div>

          {/* Tile 2 — Entregables */}
          <div className={`bg-[#0D1535] border border-[#1E2A4A] rounded-xl overflow-hidden flex flex-col ${hasEntregables ? 'border-t-0' : ''}`}>
            {hasEntregables && <div className={`h-0.5 ${docsReady > 0 ? 'bg-[#22c55e]' : 'bg-[#B8860B]'}`} />}
            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold uppercase tracking-widest ${hasEntregables ? 'text-[#B8860B]' : 'text-[#8892A4]'}`}>
                  Entregables
                </span>
                {!hasEntregables
                  ? <span className="flex items-center gap-1 text-xs text-[#8892A4]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3A4560] inline-block" />Pendiente
                    </span>
                  : docsReady > 0
                    ? <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />{docsReady} de {docsTotal} listos
                      </span>
                    : <span className="flex items-center gap-1 text-xs text-[#B8860B] bg-[#B8860B]/10 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B8860B] inline-block" />{docsTotal} definidos
                      </span>
                }
              </div>

              {!hasEntregables ? (
                <p className="text-xs text-[#8892A4] mb-4 flex-1 leading-relaxed">
                  Completa la Semilla para que Nexo componga los entregables de tu sesión.
                </p>
              ) : (
                <div className="mb-4 flex-1">
                  {/* Mini progress bar */}
                  {docsReady > 0 && (
                    <div className="h-1 bg-[#1E2A4A] rounded-full mb-3 overflow-hidden">
                      <div className="h-full bg-[#22c55e] rounded-full" style={{ width: `${Math.round((docsReady / docsTotal) * 100)}%` }} />
                    </div>
                  )}
                  <div className="space-y-1">
                    {docs.slice(0, 3).map(d => (
                      <div key={d.id} className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          d.status === 'generado' || d.status === 'aprobado' ? 'bg-[#22c55e]' :
                          d.status === 'en_progreso' ? 'bg-[#B8860B] animate-pulse' : 'bg-[#3A4560]'
                        }`} />
                        <span className="text-xs text-[#8892A4] truncate">{d.name}</span>
                      </div>
                    ))}
                    {docs.length > 3 && (
                      <p className="text-[10px] text-[#3A4560] pl-3">+{docs.length - 3} más</p>
                    )}
                  </div>
                </div>
              )}

              {hasSemilla ? (
                <Link href={`/project/${p.id}/seed-session`}
                  className="block w-full border border-[#1E2A4A] hover:border-[#B8860B] text-[#8892A4] hover:text-white text-xs font-medium py-2 rounded-lg text-center transition-colors">
                  {hasEntregables ? 'Revisar propuesta →' : 'Componer entregables →'}
                </Link>
              ) : (
                <button type="button" disabled
                  className="w-full border border-[#1E2A4A] text-[#3A4560] text-xs font-medium py-2 rounded-lg cursor-not-allowed">
                  Componer entregables →
                </button>
              )}
            </div>
          </div>

          {/* Tile 3 — Sesión de Consejo */}
          <div className={`bg-[#0D1535] border border-[#1E2A4A] rounded-xl overflow-hidden flex flex-col ${(sessionActiva || sessionCompleta) ? 'border-t-0' : ''}`}>
            {sessionCompleta && <div className="h-0.5 bg-[#22c55e]" />}
            {sessionActiva && <div className="h-0.5 bg-[#B8860B]" />}
            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold uppercase tracking-widest ${
                  sessionCompleta ? 'text-green-400' : sessionActiva ? 'text-[#B8860B]' : 'text-[#8892A4]'
                }`}>
                  Sesión de Consejo
                </span>
                {sessionCompleta
                  ? <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />Completada
                    </span>
                  : sessionActiva
                    ? <span className="flex items-center gap-1 text-xs text-[#B8860B] bg-[#B8860B]/10 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B8860B] animate-pulse inline-block" />En curso
                      </span>
                    : <span className="flex items-center gap-1 text-xs text-[#8892A4]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3A4560] inline-block" />Pendiente
                      </span>
                }
              </div>

              <div className="flex-1">
                {sessionCompleta ? (
                  <>
                    <p className="text-sm text-white font-semibold mb-1">{docsReady} entregable{docsReady !== 1 ? 's' : ''} generado{docsReady !== 1 ? 's' : ''}</p>
                    <p className="text-xs text-[#8892A4] mb-3">Sesión completada. Revisa los documentos en Export Center.</p>
                  </>
                ) : sessionActiva ? (
                  <>
                    {docsPendiente > 0 && (
                      <p className="text-sm text-white font-semibold mb-1">
                        Entregable {docsReady + 1} de {docsTotal}
                      </p>
                    )}
                    <div className="h-1 bg-[#1E2A4A] rounded-full mb-2 overflow-hidden">
                      <div className="h-full bg-[#B8860B] rounded-full"
                        style={{ width: `${docsTotal > 0 ? Math.round((docsReady / docsTotal) * 100) : 0}%` }} />
                    </div>
                    <p className="text-xs text-[#8892A4] mb-3">{docsReady} de {docsTotal} entregables completados</p>
                  </>
                ) : (
                  <p className="text-xs text-[#8892A4] mb-3 leading-relaxed">
                    Completa la configuración del consejo para iniciar la sesión.
                  </p>
                )}
              </div>

              {sessionCompleta ? (
                <Link href={`/project/${p.id}/export`}
                  className="block w-full bg-[#B8860B] hover:bg-[#a07509] text-white text-xs font-semibold py-2 rounded-lg text-center transition-colors">
                  Ver resultados →
                </Link>
              ) : sessionActiva ? (
                <Link href={`/project/${p.id}/sesion-consejo`}
                  className="block w-full bg-[#B8860B] hover:bg-[#a07509] text-white text-xs font-semibold py-2 rounded-lg text-center transition-colors">
                  Continuar sesión →
                </Link>
              ) : hasCouncil ? (
                <Link href={`/project/${p.id}/sesion-consejo`}
                  className="block w-full border border-[#1E2A4A] hover:border-[#B8860B] text-[#8892A4] hover:text-white text-xs font-medium py-2 rounded-lg text-center transition-colors">
                  Iniciar sesión →
                </Link>
              ) : (
                <button type="button" disabled
                  className="w-full border border-[#1E2A4A] text-[#3A4560] text-xs font-medium py-2 rounded-lg cursor-not-allowed">
                  Iniciar sesión →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Bottom tiles ─────────────────────────────────── */}
        <div className="grid grid-cols-5 gap-4 mb-4">

          {/* Tile 4 — Consejo Asesor (3 cols) */}
          <div className={`col-span-3 bg-[#0D1535] border border-[#1E2A4A] rounded-xl overflow-hidden ${hasCouncil ? 'border-t-0' : ''}`}>
            {hasCouncil && <div className="h-0.5 bg-[#22c55e]" />}
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold uppercase tracking-widest ${hasCouncil ? 'text-green-400' : 'text-[#8892A4]'}`}>
                  Consejo Asesor
                </span>
                {hasCouncil
                  ? <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                      {councilAdvisors.length} consejero{councilAdvisors.length !== 1 ? 's' : ''} activo{councilAdvisors.length !== 1 ? 's' : ''}
                    </span>
                  : <span className="flex items-center gap-1 text-xs text-[#8892A4]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3A4560] inline-block" />Pendiente
                    </span>
                }
              </div>

              {!hasCouncil ? (
                <p className="text-xs text-[#8892A4] mb-4 leading-relaxed">
                  Se configura al definir los entregables. Nexo seleccionará los consejeros más adecuados.
                </p>
              ) : (
                <div className="space-y-2 mb-4">
                  {councilAdvisors.slice(0, 4).map((adv: { id: string; name: string; specialty: string | null; level: string }) => (
                    <div key={adv.id} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        adv.level === 'lidera' ? 'bg-[#B8860B]' :
                        adv.level === 'apoya'  ? 'bg-blue-400' : 'bg-[#3A4560]'
                      }`} />
                      <span className="text-xs text-white font-medium truncate">{adv.name}</span>
                      {adv.specialty && (
                        <span className="text-xs text-[#8892A4] truncate">{adv.specialty}</span>
                      )}
                    </div>
                  ))}
                  {councilAdvisors.length > 4 && (
                    <p className="text-[10px] text-[#3A4560] pl-4">+{councilAdvisors.length - 4} más</p>
                  )}
                </div>
              )}

              <Link href={`/project/${p.id}/consejo`}
                className="inline-block border border-[#1E2A4A] hover:border-[#B8860B] text-[#8892A4] hover:text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors">
                Ver consejo →
              </Link>
            </div>
          </div>

          {/* Tile 5 — Export Center (2 cols) */}
          <div className={`col-span-2 bg-[#0D1535] border border-[#1E2A4A] rounded-xl overflow-hidden ${hasExport ? 'border-t-0' : ''}`}>
            {hasExport && <div className={`h-0.5 ${docsReady === docsTotal && docsTotal > 0 ? 'bg-[#22c55e]' : 'bg-[#B8860B]'}`} />}
            <div className="p-5 flex flex-col h-full">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold uppercase tracking-widest ${hasExport ? 'text-[#B8860B]' : 'text-[#8892A4]'}`}>
                  Export Center
                </span>
                {hasExport && (
                  <span className="text-xs font-semibold text-[#B8860B] bg-[#B8860B]/10 px-2 py-0.5 rounded-full">
                    {docsReady} listo{docsReady !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {hasExport ? (
                <>
                  <p className="text-sm text-white font-semibold mb-1">{docsReady} de {docsTotal} documentos listos</p>
                  <div className="h-1 bg-[#1E2A4A] rounded-full mb-3 overflow-hidden">
                    <div className="h-full bg-[#B8860B] rounded-full"
                      style={{ width: `${Math.round((docsReady / docsTotal) * 100)}%` }} />
                  </div>
                  <p className="text-xs text-[#8892A4] mb-4 flex-1 leading-relaxed">
                    {docsReady === docsTotal
                      ? 'Todos los documentos listos para exportar.'
                      : `${docsTotal - docsReady} entregable${docsTotal - docsReady !== 1 ? 's' : ''} pendiente${docsTotal - docsReady !== 1 ? 's' : ''}.`}
                  </p>
                </>
              ) : (
                <p className="text-xs text-[#8892A4] mb-4 flex-1 leading-relaxed">
                  Los documentos se generan durante la Sesión de Consejo.
                </p>
              )}

              <Link href={`/project/${p.id}/export`}
                className={`block w-full text-xs font-medium py-2 rounded-lg text-center transition-colors ${
                  hasExport
                    ? 'bg-[#B8860B] hover:bg-[#a07509] text-white font-semibold'
                    : 'border border-[#1E2A4A] hover:border-[#B8860B] text-[#8892A4] hover:text-white'
                }`}>
                {hasExport ? 'Exportar →' : 'Ir al Export Center →'}
              </Link>
            </div>
          </div>
        </div>

        {/* ── Consultoría tile ─────────────────────────────── */}
        <div className={`bg-[#0D1535] border border-[#1E2A4A] rounded-xl overflow-hidden ${consultoriaUnlocked ? 'border-t-0' : ''}`}>
          {consultoriaUnlocked && totalMessages > 0 && <div className="h-0.5 bg-[#22c55e]" />}
          {consultoriaUnlocked && totalMessages === 0 && <div className="h-0.5 bg-[#B8860B]" />}
          <div className="p-5 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className={`text-xs font-semibold uppercase tracking-widest ${
                  consultoriaUnlocked ? (totalMessages > 0 ? 'text-green-400' : 'text-[#B8860B]') : 'text-[#8892A4]'
                }`}>
                  Consultoría Activa
                </span>
                {consultoriaUnlocked && (
                  <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                    totalMessages > 0
                      ? 'text-green-400 bg-green-400/10'
                      : 'text-[#B8860B] bg-[#B8860B]/10'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full inline-block ${totalMessages > 0 ? 'bg-green-400' : 'bg-[#B8860B]'}`} />
                    {totalMessages > 0 ? `${totalMessages} consulta${totalMessages !== 1 ? 's' : ''}` : 'Disponible'}
                  </span>
                )}
                {!consultoriaUnlocked && (
                  <span className="flex items-center gap-1 text-xs text-[#8892A4]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3A4560] inline-block" />Bloqueada
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8892A4] leading-relaxed">
                {consultoriaUnlocked
                  ? totalMessages > 0
                    ? `${consultCount} sesión${consultCount !== 1 ? 'es' : ''} · ${totalMessages} consulta${totalMessages !== 1 ? 's' : ''} realizadas`
                    : 'Tu consejo asesor está disponible. Hazles cualquier pregunta sobre tu venture.'
                  : 'Disponible tras completar la Sesión de Consejo. Tu consejo asesor responderá consultas sobre estrategia, mercado y producto.'
                }
              </p>
            </div>
            <div className="ml-4 shrink-0">
              {consultoriaUnlocked ? (
                <Link href={`/project/${p.id}/consultoria`}
                  className="block bg-[#B8860B] hover:bg-[#a07509] text-[#0A1128] text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
                  {totalMessages > 0 ? 'Continuar →' : 'Iniciar →'}
                </Link>
              ) : (
                <button type="button" disabled
                  className="border border-[#1E2A4A] text-[#3A4560] text-xs font-medium px-4 py-2 rounded-lg cursor-not-allowed">
                  Bloqueada
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Right sidebar */}
      <aside className="w-72 border-l border-[#1E2A4A] px-6 py-7 shrink-0 overflow-y-auto">
        <h3 className="font-outfit font-semibold text-white text-sm mb-4">Resumen del Proyecto</h3>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: 'Entregables', value: docsTotal > 0 ? `${docsReady}/${docsTotal}` : '—' },
            { label: 'Consejeros', value: councilAdvisors.length > 0 ? String(councilAdvisors.length) : '—' },
            { label: 'Sesión', value: sessionCompleta ? '✓' : sessionActiva ? '●' : '—' },
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
            <p className="text-sm font-semibold text-white mb-1">{PIPELINE_STAGES[currentStageIdx]}</p>
            <p className="text-xs text-[#8892A4] leading-relaxed">{PHASE_DESCRIPTIONS[currentStageIdx]}</p>
          </div>
        </div>

        {/* Founder brief excerpt */}
        {p.founder_brief && (
          <div className="mb-4">
            <p className="text-[10px] font-semibold text-[#8892A4] uppercase tracking-widest mb-2">Resumen del Fundador</p>
            <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-lg p-3 border-l-2 border-l-[#B8860B]">
              <p className="text-xs text-[#C8D0E0] leading-relaxed line-clamp-4">
                {p.founder_brief.replace(/#{1,6}\s+/g, '').replace(/\*\*(.*?)\*\*/g, '$1').substring(0, 200)}...
              </p>
            </div>
          </div>
        )}

        {/* Documents summary */}
        <div className="mb-5">
          <p className="text-[10px] font-semibold text-[#8892A4] uppercase tracking-widest mb-2">Documentos</p>
          <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-lg p-3">
            <p className="font-outfit text-2xl font-bold text-white">
              {docsReady}
              <span className="text-sm text-[#8892A4] font-normal"> / {docsTotal || '—'}</span>
            </p>
            <p className="text-xs text-[#8892A4] mt-0.5">generados</p>
          </div>
        </div>

        {/* Game Analysis */}
        {p.game_analysis && (
          <div>
            <p className="text-[10px] font-semibold text-[#8892A4] uppercase tracking-widest mb-2">Análisis Estratégico</p>
            <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-lg p-3">
              <p className="text-[10px] text-[#B8860B] font-semibold mb-2">Tensiones clave:</p>
              {p.game_analysis.key_tensions?.slice(0, 3).map((t, i) => (
                <p key={i} className="text-xs text-[#8892A4] mb-1 leading-relaxed">• {t.tension}</p>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
