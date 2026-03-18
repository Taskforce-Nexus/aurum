'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Project } from '@/lib/types'

interface DeliverableSection {
  title: string
  description: string
  questions: string[]
}

interface ComposedDeliverable {
  id: string
  name: string
  key_question: string
  deliverable_index: number
  status: string
  composition: {
    frameworks_used?: string[]
    sections?: DeliverableSection[]
    advisors_needed?: string[]
    depends_on?: string[]
    feeds_into?: string[]
  }
}

interface Props {
  project: Project
  stepNumber: number
  onNext: () => void
  onDeliverablesComposed: (deliverables: { id: string; name: string }[]) => void
}

type LoadState = 'idle' | 'loading' | 'success' | 'error'

export default function EntregablesPropuesta({ project, onNext, onDeliverablesComposed }: Props) {
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [deliverables, setDeliverables] = useState<ComposedDeliverable[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [adjusting, setAdjusting] = useState(false)
  const [adjustText, setAdjustText] = useState('')
  const [saving, setSaving] = useState(false)

  const compose = useCallback(async (adjustmentContext?: string) => {
    setLoadState('loading')
    try {
      const body: Record<string, string> = { project_id: project.id }
      if (adjustmentContext) body.adjustment = adjustmentContext

      const res = await fetch('/api/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      const items: ComposedDeliverable[] = data.deliverables ?? []
      setDeliverables(items)
      setExpanded(items[0]?.id ?? null)
      setLoadState('success')
    } catch {
      setLoadState('error')
    }
  }, [project.id])

  useEffect(() => {
    compose()
  }, [compose])

  async function handleApprove() {
    setSaving(true)
    try {
      await fetch('/api/seed-session/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'entregables',
          projectId: project.id,
          documentSpecIds: deliverables.map(d => d.id),
        }),
      })
    } catch { /* non-blocking */ }
    onDeliverablesComposed(deliverables.map(d => ({ id: d.id, name: d.name })))
    setSaving(false)
    onNext()
  }

  function handlePedirAjuste() {
    if (!adjustText.trim()) return
    setAdjusting(false)
    compose(adjustText.trim())
    setAdjustText('')
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">

        {/* Nexo message */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-[#B8860B]/20 border border-[#B8860B]/30 flex items-center justify-center text-[#B8860B] text-xs font-bold shrink-0 mt-1">N</div>
          <div className="max-w-2xl bg-[#0D1535] border border-[#1E2A4A] rounded-2xl rounded-tl-sm px-5 py-4 text-sm text-[#e0e0e5] leading-relaxed">
            {loadState === 'loading'
              ? 'Analizando tu situación y componiendo los entregables que necesitas...'
              : loadState === 'success'
              ? `Basándome en tu proyecto compuse ${deliverables.length} entregables específicos para tu decisión. Revísalos y aprueba cuando estés listo.`
              : loadState === 'error'
              ? 'No pudimos componer los entregables. Intenta de nuevo.'
              : 'Cargando...'}
          </div>
        </div>

        {/* Loading skeleton */}
        {loadState === 'loading' && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-[#1E2A4A] rounded w-1/2 mb-2" />
                <div className="h-3 bg-[#1E2A4A] rounded w-3/4 mb-3" />
                <div className="flex gap-2">
                  <div className="h-5 bg-[#1E2A4A] rounded w-20" />
                  <div className="h-5 bg-[#1E2A4A] rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {loadState === 'error' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 text-center">
            <p className="text-sm text-red-400 mb-3">No pudimos componer los entregables. Verifica que tu proyecto tenga un Resumen del Fundador generado.</p>
            <button
              type="button"
              onClick={() => compose()}
              className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 text-sm rounded-lg hover:bg-red-500/30 transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Deliverable cards */}
        {loadState === 'success' && (
          <div>
            <p className="text-xs text-[#B8860B] uppercase tracking-wider font-medium mb-3">
              Entregables Propuestos
              <span className="ml-2 text-[#8892A4] normal-case font-normal">{deliverables.length} entregables</span>
            </p>
            <div className="space-y-3">
              {deliverables.map((d, idx) => {
                const isExpanded = expanded === d.id
                const sections = d.composition?.sections ?? []
                const advisorsNeeded = d.composition?.advisors_needed ?? []
                const dependsOn = d.composition?.depends_on ?? []

                return (
                  <div key={d.id} className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl overflow-hidden hover:border-[#B8860B]/30 transition-colors">
                    {/* Card header */}
                    <div className="flex items-start justify-between px-5 py-4 gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Index + name */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] text-[#B8860B] font-medium border border-[#B8860B]/30 rounded px-1.5 py-0.5 shrink-0">
                            {idx + 1}
                          </span>
                          <h3 className="font-semibold text-sm text-white truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            {d.name}
                          </h3>
                        </div>

                        {/* Key question */}
                        <p className="text-xs text-[#8892A4] italic leading-relaxed line-clamp-2 mb-2">
                          {d.key_question}
                        </p>

                        {/* Badges row */}
                        <div className="flex flex-wrap gap-1.5">
                          {sections.length > 0 && (
                            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-2 py-0.5">
                              {sections.length} sección{sections.length !== 1 ? 'es' : ''}
                            </span>
                          )}
                          {advisorsNeeded.map(cat => (
                            <span key={cat} className="text-[10px] bg-[#B8860B]/10 text-[#B8860B] border border-[#B8860B]/20 rounded-full px-2 py-0.5">
                              {cat}
                            </span>
                          ))}
                          {dependsOn.length > 0 && (
                            <span className="text-[10px] bg-[#1E2A4A] text-[#8892A4] rounded-full px-2 py-0.5">
                              Requiere: {dependsOn[0]}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpanded(isExpanded ? null : d.id)}
                        className="text-xs text-[#8892A4] hover:text-white transition-colors px-2.5 py-1.5 border border-[#1E2A4A] rounded-lg shrink-0"
                      >
                        {isExpanded ? 'Cerrar' : 'Ver más'}
                      </button>
                    </div>

                    {/* Expanded sections */}
                    {isExpanded && sections.length > 0 && (
                      <div className="border-t border-[#1E2A4A] px-5 py-4 space-y-3">
                        {sections.map((sec, si) => (
                          <div key={si} className="flex gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#B8860B]/60 shrink-0 mt-1.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-[#B8860B] font-medium uppercase tracking-wide mb-1">{sec.title}</p>
                              <p className="text-xs text-[#8892A4] leading-relaxed mb-1.5">{sec.description}</p>
                              {sec.questions?.length > 0 && (
                                <ul className="space-y-1">
                                  {sec.questions.map((q, qi) => (
                                    <li key={qi} className="text-xs text-[#6B7589] leading-relaxed pl-2 border-l border-[#1E2A4A]">
                                      {q}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Adjustment input */}
        {adjusting && (
          <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-4 space-y-3">
            <p className="text-xs text-[#8892A4]">Dile a Nexo qué ajustar en la propuesta:</p>
            <textarea
              value={adjustText}
              onChange={e => setAdjustText(e.target.value)}
              placeholder="Ej: Quiero más enfoque en el análisis financiero, o agrega un entregable de riesgos regulatorios..."
              className="w-full bg-[#0A1128] border border-[#1E2A4A] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#4A5568] resize-none focus:outline-none focus:border-[#B8860B]/50 transition-colors"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePedirAjuste}
                disabled={!adjustText.trim()}
                className="px-4 py-2 bg-[#B8860B] text-[#0A1128] text-sm font-semibold rounded-lg hover:bg-[#b8963f] disabled:opacity-40 transition-colors"
              >
                Recomponer
              </button>
              <button
                type="button"
                onClick={() => { setAdjusting(false); setAdjustText('') }}
                className="px-4 py-2 text-sm text-[#8892A4] border border-[#1E2A4A] rounded-lg hover:text-white transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="border-t border-[#1E2A4A] px-8 py-4 flex gap-3 shrink-0">
        <button
          type="button"
          onClick={handleApprove}
          disabled={saving || loadState !== 'success' || deliverables.length === 0}
          className="flex-1 bg-[#B8860B] hover:bg-[#b8963f] text-[#0A1128] font-semibold text-sm py-3 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? 'Guardando...' : 'Aprobar propuesta →'}
        </button>
        {loadState === 'success' && !adjusting && (
          <button
            type="button"
            onClick={() => setAdjusting(true)}
            className="px-4 py-3 text-sm text-[#8892A4] border border-[#1E2A4A] rounded-xl hover:text-white transition-colors"
          >
            Pedir ajuste
          </button>
        )}
      </div>
    </main>
  )
}
