'use client'

import { useState } from 'react'
import type { Advisor, Project } from '@/lib/types'
import { HAT_COLORS } from './SeedSessionFlow'
import AdvisorProfileDrawer from './AdvisorProfileDrawer'
import AdvisorSwapDrawer from './AdvisorSwapDrawer'

interface Props {
  project: Project
  stepNumber: number
  advisors: Advisor[]
  acceptedIds: string[]
  onAcceptedChange: (ids: string[]) => void
  onNext: () => void
}

const LEVEL_LABELS: Record<string, string> = {
  lidera: 'LIDERA',
  apoya:  'APOYA',
  observa: 'OBSERVA',
}

const LEVEL_COLORS: Record<string, string> = {
  lidera:  'bg-[#B8860B]/20 text-[#B8860B] border-[#B8860B]/30',
  apoya:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
  observa: 'bg-[#1E2A4A] text-[#8892A4] border-[#1E2A4A]',
}

export default function ConsejoPrincipalPropuesta({ project, advisors, acceptedIds, onAcceptedChange, onNext }: Props) {
  const [loading, setLoading] = useState(false)
  const [profileAdvisor, setProfileAdvisor] = useState<Advisor | null>(null)
  const [localAdvisors, setLocalAdvisors] = useState<Advisor[]>(advisors)
  const [swapDrawer, setSwapDrawer] = useState<{ open: boolean; currentId: string }>({
    open: false, currentId: '',
  })

  function handleAdvisorSwap(newAdvisor: Advisor) {
    setLocalAdvisors(prev => {
      const replaced = prev.find(a => a.id === swapDrawer.currentId)
      if (!replaced) return [...prev, newAdvisor]
      return prev.map(a => a.id === swapDrawer.currentId ? { ...newAdvisor, level: replaced.level } : a)
    })
    onAcceptedChange(
      acceptedIds.filter(id => id !== swapDrawer.currentId).concat(newAdvisor.id)
    )
  }

  const grouped: Record<string, Advisor[]> = { lidera: [], apoya: [], observa: [] }
  for (const a of localAdvisors) {
    if (grouped[a.level]) grouped[a.level].push(a)
  }

  function toggleAdvisor(id: string) {
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
          step: 'consejo_principal',
          projectId: project.id,
          advisorIds: acceptedIds,
        }),
      })
    } catch { /* non-blocking */ }
    setLoading(false)
    onNext()
  }

  return (
    <>
    <AdvisorProfileDrawer
      profile={profileAdvisor}
      isOpen={profileAdvisor !== null}
      onClose={() => setProfileAdvisor(null)}
      type="advisor"
    />
    <AdvisorSwapDrawer
      isOpen={swapDrawer.open}
      onClose={() => setSwapDrawer(prev => ({ ...prev, open: false }))}
      currentAdvisorId={swapDrawer.currentId}
      onSelect={(newAdvisor) => { handleAdvisorSwap(newAdvisor); setSwapDrawer(prev => ({ ...prev, open: false })) }}
    />
    <main className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
        {/* Nexo message */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-[#B8860B]/20 border border-[#B8860B]/30 flex items-center justify-center text-[#B8860B] text-xs font-bold shrink-0 mt-1">N</div>
          <div className="max-w-2xl bg-[#0D1535] border border-[#1E2A4A] rounded-2xl rounded-tl-sm px-5 py-4 text-sm text-[#e0e0e5] leading-relaxed">
            Armé tu consejo asesor basándome en el tipo de proyecto que me describiste. Cada asesor va a estar en todos tus servicios — cada uno tiene un rol, tipo de aporte y estilo de comunicación. Puedes cambiar a cualquiera antes de continuar.
          </div>
        </div>

        {/* Estructura del consejo */}
        <div>
          <p className="text-xs text-[#B8860B] uppercase tracking-wider font-medium mb-1">Estructura de tu consejo</p>
          <p className="text-xs text-[#8892A4] mb-4">Base — {project.name} Consejo Principal</p>

          {(['lidera', 'apoya', 'observa'] as const).map(level => {
            if (!grouped[level]?.length) return null
            return (
              <div key={level} className="mb-5">
                <p className="text-xs text-[#8892A4] uppercase tracking-wider mb-2">{LEVEL_LABELS[level]}</p>
                <div className="grid grid-cols-3 gap-3">
                  {grouped[level].map(advisor => {
                    const isSelected = acceptedIds.includes(advisor.id)
                    return (
                      <div key={advisor.id} className={`bg-[#0D1535] border rounded-xl p-4 transition-colors ${isSelected ? 'border-[#B8860B]/40' : 'border-[#1E2A4A]'}`}>
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-semibold text-sm text-white leading-tight">{advisor.name}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0 ml-1 ${LEVEL_COLORS[advisor.level]}`}>
                            {LEVEL_LABELS[advisor.level]}
                          </span>
                        </div>
                        <p className="text-xs text-[#8892A4] mb-2">{advisor.specialty}</p>

                        {/* Hats */}
                        {advisor.hats.length > 0 && (
                          <div className="flex gap-1 mb-3">
                            {advisor.hats.map(hat => (
                              <div key={hat} className={`w-2.5 h-2.5 rounded-full ${HAT_COLORS[hat] ?? 'bg-gray-600'}`} title={hat} />
                            ))}
                          </div>
                        )}

                        <div className="flex gap-1.5 mt-3">
                          <button
                            type="button"
                            onClick={() => toggleAdvisor(advisor.id)}
                            className={`text-xs border px-2 py-1 rounded transition-colors ${
                              isSelected
                                ? 'text-[#8892A4] border-[#1E2A4A] hover:text-white'
                                : 'text-[#B8860B] border-[#B8860B]/30 hover:bg-[#B8860B]/10'
                            }`}
                          >
                            {isSelected ? 'Quitar' : 'Agregar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setSwapDrawer({ open: true, currentId: advisor.id })}
                            className="text-xs text-[#8892A4] border border-[#1E2A4A] px-2 py-1 rounded hover:text-white transition-colors"
                          >
                            Cambiar
                          </button>
                          <button
                            type="button"
                            onClick={() => setProfileAdvisor(advisor)}
                            className="text-xs text-[#8892A4] border border-[#1E2A4A] px-2 py-1 rounded hover:text-white transition-colors"
                          >
                            Ver perfil
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-[#1E2A4A] px-8 py-4 shrink-0">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className="w-full bg-[#B8860B] hover:bg-[#b8963f] text-[#0A1128] font-semibold text-sm py-3 rounded-xl transition-colors disabled:opacity-40"
        >
          {loading ? 'Guardando...' : 'Entendido, continuar →'}
        </button>
      </div>
    </main>
    </>
  )
}
