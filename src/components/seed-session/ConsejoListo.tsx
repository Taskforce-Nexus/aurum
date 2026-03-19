'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Project } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface LocalAdvisor {
  id: string
  name: string
  specialty?: string
}

interface LocalCofounder {
  id: string
  name: string
  role: string
  specialty?: string
}

interface LocalDeliverable {
  id?: string
  name: string
  key_question?: string
}

interface Props {
  project: Project
  stepNumber: number
  // Legacy props — kept for interface compatibility with SeedSessionFlow
  // ConsejoListo reads directly from Supabase for reliable data
  documentSpecs?: unknown[]
  advisors?: unknown[]
  cofounders?: unknown[]
  specialistCount?: number
  personaCount?: number
  onNext: () => void
  onComplete?: () => void
}

export default function ConsejoListo({ project, onComplete }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)

  const [advisors, setAdvisors] = useState<LocalAdvisor[]>([])
  const [cofounders, setCofounders] = useState<LocalCofounder[]>([])
  const [specialists, setSpecialists] = useState<{ id: string; name: string }[]>([])
  const [personas, setPersonas] = useState<{ id: string; name: string }[]>([])
  const [deliverables, setDeliverables] = useState<LocalDeliverable[]>([])

  useEffect(() => {
    async function loadCouncil() {
      const supabase = createClient()
      try {
        // Council advisors
        const { data: council } = await supabase
          .from('councils')
          .select('id, council_advisors(advisor:advisors(id, name, specialty))')
          .eq('project_id', project.id)
          .maybeSingle()

        if (council?.council_advisors) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setAdvisors((council.council_advisors as any[]).map(ca => ({
            ...(ca.advisor ?? {}),
          })))
        }

        // Council cofounders
        const { data: councilCf } = await supabase
          .from('councils')
          .select('id, council_cofounders(role, cofounder:cofounders(id, name, specialty))')
          .eq('project_id', project.id)
          .maybeSingle()

        if (councilCf?.council_cofounders) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setCofounders((councilCf.council_cofounders as any[]).map(cc => ({
            ...(cc.cofounder ?? {}),
            role: cc.role as string,
          })))
        }

        // Specialists confirmed
        const { data: specs } = await supabase
          .from('specialists')
          .select('id, name')
          .eq('project_id', project.id)
          .eq('is_confirmed', true)
        setSpecialists(specs ?? [])

        // Buyer personas confirmed
        const { data: bps } = await supabase
          .from('buyer_personas')
          .select('id, name')
          .eq('project_id', project.id)
          .eq('is_confirmed', true)
        setPersonas(bps ?? [])

        // Deliverables with composition
        const { data: docs } = await supabase
          .from('project_documents')
          .select('id, name, key_question, deliverable_index')
          .eq('project_id', project.id)
          .not('composition', 'is', null)
          .order('deliverable_index')
        setDeliverables(docs ?? [])
      } catch (e) {
        console.error('[ConsejoListo] loadCouncil error:', e)
      }
      setDataLoading(false)
    }
    void loadCouncil()
  }, [project.id])

  async function handleStart() {
    setLoading(true)
    try {
      await fetch('/api/seed-session/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'consejo_listo',
          projectId: project.id,
        }),
      })
    } catch { /* non-blocking */ }
    onComplete?.()
    router.push(`/project/${project.id}/sesion-consejo`)
  }

  const cofounderPair = [
    cofounders.find(c => c.role === 'constructivo'),
    cofounders.find(c => c.role === 'critico'),
  ].filter(Boolean) as LocalCofounder[]

  // Completeness validation — only after data is loaded
  const missingItems: string[] = []
  if (!dataLoading) {
    if (advisors.length < 1) missingItems.push('Sin consejeros configurados')
    if (cofounderPair.length < 2) missingItems.push(`Cofounders: ${cofounderPair.length}/2 (constructivo + crítico)`)
    if (deliverables.length < 1) missingItems.push('Sin entregables configurados')
  }
  const canStart = !dataLoading && missingItems.length === 0

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
        {/* Nexo message */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-[#B8860B]/20 border border-[#B8860B]/30 flex items-center justify-center text-[#B8860B] text-xs font-bold shrink-0 mt-1">N</div>
          <div className="max-w-2xl bg-[#0D1535] border border-[#1E2A4A] rounded-2xl rounded-tl-sm px-5 py-4 text-sm text-[#e0e0e5] leading-relaxed">
            {dataLoading
              ? 'Cargando tu consejo...'
              : 'Tu consejo está listo. A partir de ahora, cada miembro del consejo va a trabajar contigo para construir tu proyecto. Los primeros documentos estarán listos después de la Sesión de Consejo. Puedes revisar el consejo antes de arrancar si quieres hacer algún cambio.'}
          </div>
        </div>

        {/* Loading skeleton */}
        {dataLoading && (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl px-5 py-4">
                <div className="h-3 bg-[#1E2A4A] rounded w-1/4 mb-3" />
                <div className="h-4 bg-[#1E2A4A] rounded w-2/5 mb-2" />
                <div className="h-3 bg-[#1E2A4A] rounded w-1/3" />
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {!dataLoading && (
          <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl divide-y divide-[#1E2A4A]">
            {/* Consejo principal */}
            <div className="px-5 py-4">
              <p className="text-xs text-[#B8860B] uppercase tracking-wider font-medium mb-3">
                Tu Consejo <span className="text-[#8892A4] font-normal normal-case">({advisors.length} consejeros)</span>
              </p>
              {advisors.length === 0 ? (
                <p className="text-xs text-[#3A4560] italic">Sin consejeros seleccionados</p>
              ) : (
                <div className="space-y-1">
                  {advisors.map(a => (
                    <div key={a.id} className="flex items-center gap-2 py-1">
                      <span className="text-xs text-white font-medium truncate">{a.name}</span>
                      {a.specialty && (
                        <span className="text-xs text-[#8892A4] truncate">{a.specialty}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Liderazgo / cofounders */}
            <div className="px-5 py-4">
              <p className="text-xs text-[#B8860B] uppercase tracking-wider font-medium mb-2">Liderazgo</p>
              {cofounderPair.length === 0 ? (
                <p className="text-xs text-[#3A4560] italic">Sin cofounders asignados</p>
              ) : (
                cofounderPair.map(cf => (
                  <div key={cf.id} className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${
                      cf.role === 'constructivo'
                        ? 'bg-green-500/10 text-green-400 border-green-500/30'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                    }`}>
                      {cf.role === 'constructivo' ? 'Constructivo' : 'Crítico'}
                    </span>
                    <span className="text-xs text-[#8892A4]">{cf.name}{cf.specialty ? ` — ${cf.specialty}` : ''}</span>
                  </div>
                ))
              )}
            </div>

            {/* ICPs */}
            <div className="px-5 py-4">
              <p className="text-xs text-[#B8860B] uppercase tracking-wider font-medium mb-1">ICPs</p>
              {personas.length === 0 ? (
                <p className="text-xs text-[#8892A4]">Sin buyer personas seleccionadas</p>
              ) : (
                <div className="space-y-1">
                  {personas.map(p => (
                    <p key={p.id} className="text-xs text-[#8892A4]">· {p.name}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Especialistas */}
            <div className="px-5 py-4">
              <p className="text-xs text-[#B8860B] uppercase tracking-wider font-medium mb-1">Especialistas</p>
              {specialists.length === 0 ? (
                <p className="text-xs text-[#8892A4]">Sin especialistas seleccionados</p>
              ) : (
                <div className="space-y-1">
                  {specialists.map(s => (
                    <p key={s.id} className="text-xs text-[#8892A4]">· {s.name}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Entregables */}
            <div className="px-5 py-4">
              <p className="text-xs text-[#B8860B] uppercase tracking-wider font-medium mb-2">
                Entregables <span className="text-[#8892A4] font-normal normal-case">({deliverables.length})</span>
              </p>
              {deliverables.length === 0 ? (
                <p className="text-xs text-[#3A4560] italic">Sin entregables definidos</p>
              ) : (
                <div className="space-y-1.5">
                  {deliverables.map((d, i) => (
                    <div key={d.id ?? i} className="flex items-start gap-2">
                      <span className="text-[10px] text-[#B8860B] border border-[#B8860B]/30 rounded px-1 py-0.5 shrink-0 mt-0.5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white font-medium truncate">{d.name}</p>
                        {d.key_question && (
                          <p className="text-[10px] text-[#8892A4] leading-relaxed line-clamp-1 italic">
                            {d.key_question}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="border-t border-[#1E2A4A] px-8 py-4 space-y-2 shrink-0">
        {/* Incomplete warning */}
        {!dataLoading && !canStart && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3 mb-1">
            <p className="text-xs text-yellow-400 font-medium mb-1">Consejo incompleto</p>
            <ul className="space-y-0.5">
              {missingItems.map(item => (
                <li key={item} className="text-xs text-yellow-400/70 flex gap-1.5">
                  <span>•</span><span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <button
          type="button"
          onClick={handleStart}
          disabled={loading || !canStart}
          className="w-full bg-[#B8860B] hover:bg-[#b8963f] text-[#0A1128] font-semibold text-sm py-3.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Iniciando...' : 'Iniciar Sesión de Consejo →'}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/project/${project.id}`)}
          className="w-full text-sm text-[#8892A4] border border-[#1E2A4A] py-3 rounded-xl hover:text-white transition-colors"
        >
          Revisar consejo antes
        </button>
      </div>
    </main>
  )
}
