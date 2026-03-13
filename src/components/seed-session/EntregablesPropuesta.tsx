'use client'

import { useState } from 'react'
import type { DocumentSpec, Project } from '@/lib/types'

interface Props {
  project: Project
  stepNumber: number
  documentSpecs: DocumentSpec[]
  acceptedIds: string[]
  onAcceptedChange: (ids: string[]) => void
  onNext: () => void
}

export default function EntregablesPropuesta({ project, documentSpecs, acceptedIds, onAcceptedChange, onNext }: Props) {
  const [expanded, setExpanded] = useState<string | null>(documentSpecs[0]?.id ?? null)
  const [loading, setLoading] = useState(false)

  function toggleDoc(id: string) {
    onAcceptedChange(
      acceptedIds.includes(id) ? acceptedIds.filter(i => i !== id) : [...acceptedIds, id]
    )
  }

  async function handleConfirm() {
    setLoading(true)
    try {
      await fetch('/api/seed-session/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'entregables',
          projectId: project.id,
          documentSpecIds: acceptedIds,
        }),
      })
    } catch { /* non-blocking */ }
    setLoading(false)
    onNext()
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
        {/* Nexo message */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-[#B8860B]/20 border border-[#B8860B]/30 flex items-center justify-center text-[#B8860B] text-xs font-bold shrink-0 mt-1">N</div>
          <div className="max-w-2xl bg-[#0D1535] border border-[#1E2A4A] rounded-2xl rounded-tl-sm px-5 py-4 text-sm text-[#e0e0e5] leading-relaxed">
            Basándome en tu proyecto y el contexto que me compartiste, estos son los documentos que tu Consejo va a producir. Están diseñados para responder las decisiones de alto impacto de tu venture.
          </div>
        </div>

        {/* Entregables */}
        <div>
          <p className="text-xs text-[#B8860B] uppercase tracking-wider font-medium mb-3">
            Entregables Propuestos
            <span className="ml-2 text-[#8892A4] normal-case font-normal">{acceptedIds.length} seleccionados</span>
          </p>
          <div className="space-y-3">
            {documentSpecs.map(doc => {
              const isExpanded = expanded === doc.id
              const isSelected = acceptedIds.includes(doc.id)
              return (
                <div key={doc.id} className={`bg-[#0D1535] border rounded-xl overflow-hidden transition-colors ${isSelected ? 'border-[#B8860B]/40' : 'border-[#1E2A4A]'}`}>
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleDoc(doc.id)}
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-[#B8860B] border-[#B8860B]' : 'border-[#1E2A4A]'}`}
                      >
                        {isSelected && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </button>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{doc.name}</p>
                        {doc.strategic_decision && (
                          <p className="text-xs text-[#8892A4] truncate mt-0.5">{doc.strategic_decision}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => setExpanded(isExpanded ? null : doc.id)}
                        className="text-xs text-[#8892A4] hover:text-white transition-colors px-2 py-1 border border-[#1E2A4A] rounded"
                      >
                        {isExpanded ? 'Cerrar' : 'Ver más'}
                      </button>
                    </div>
                  </div>

                  {isExpanded && doc.sections.length > 0 && (
                    <div className="border-t border-[#1E2A4A] px-5 py-4 space-y-2.5">
                      {doc.sections.map((sec, i) => (
                        <div key={i} className="flex gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#B8860B]/60 shrink-0 mt-1.5" />
                          <div>
                            <p className="text-xs text-[#B8860B] font-medium uppercase tracking-wide">{sec.nombre}</p>
                            <p className="text-xs text-[#8892A4] leading-relaxed mt-0.5">{sec.descripcion}</p>
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
      </div>

      {/* CTA */}
      <div className="border-t border-[#1E2A4A] px-8 py-4 flex gap-3 shrink-0">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading || acceptedIds.length === 0}
          className="flex-1 bg-[#B8860B] hover:bg-[#b8963f] text-[#0A1128] font-semibold text-sm py-3 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Guardando...' : 'Aprobar todos →'}
        </button>
        <button
          type="button"
          className="px-4 py-3 text-sm text-[#8892A4] border border-[#1E2A4A] rounded-xl hover:text-white transition-colors"
        >
          Agregar o quitar documentos
        </button>
      </div>
    </main>
  )
}
