'use client'

import { useState } from 'react'
import type { Cofounder, Project } from '@/lib/types'
import { HAT_COLORS } from './SeedSessionFlow'

interface Props {
  project: Project
  stepNumber: number
  cofounders: Cofounder[]
  acceptedIds: string[]
  onAcceptedChange: (ids: string[]) => void
  onNext: () => void
}

const ROLE_LABELS: Record<string, string> = {
  constructivo: 'Constructivo',
  critico: 'Crítico',
}

const ELEMENT_LABEL: Record<string, string> = {
  fuego: '🔴 Fuego',
  agua:  '🔵 Agua',
  tierra:'🟤 Tierra',
  aire:  '⚪ Aire',
}

export default function CofoundersPropuesta({ project, cofounders, acceptedIds, onAcceptedChange, onNext }: Props) {
  const [loading, setLoading] = useState(false)

  // Show one constructivo + one critico
  const constructivo = cofounders.find(c => c.role === 'constructivo')
  const critico      = cofounders.find(c => c.role === 'critico')
  const pair = [constructivo, critico].filter(Boolean) as Cofounder[]

  async function handleConfirm() {
    setLoading(true)
    try {
      await fetch('/api/seed-session/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'cofounders',
          projectId: project.id,
          cofounderIds: acceptedIds,
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
            Tu consejo asesor tiene dos cofounders IA que van a trabajar contigo en cada fase. Uno construye sobre tus ideas. El otro las cuestiona con rigor. Puedes cambiarlos antes de continuar.
          </div>
        </div>

        {/* Cofounders grid */}
        <div>
          <p className="text-xs text-[#B8860B] uppercase tracking-wider font-medium mb-3">Cofounders IA</p>
          <div className="grid grid-cols-2 gap-4">
            {pair.map(cf => {
              const isSelected = acceptedIds.includes(cf.id)
              return (
                <div key={cf.id} className={`bg-[#0D1535] border rounded-xl p-5 transition-colors ${isSelected ? 'border-[#B8860B]/40' : 'border-[#1E2A4A]'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-sm text-white">{cf.name}</p>
                      <p className="text-xs text-[#8892A4] mt-0.5">{cf.specialty}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                      cf.role === 'constructivo'
                        ? 'bg-green-500/10 text-green-400 border-green-500/30'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                    }`}>
                      {ROLE_LABELS[cf.role]}
                    </span>
                  </div>

                  {/* Hats */}
                  {cf.hats.length > 0 && (
                    <div className="flex gap-1 mb-3">
                      {cf.hats.map(hat => (
                        <div key={hat} className={`w-3 h-3 rounded-full ${HAT_COLORS[hat] ?? 'bg-gray-600'}`} title={hat} />
                      ))}
                    </div>
                  )}

                  {/* Element */}
                  {cf.element && (
                    <p className="text-xs text-[#8892A4] mb-3">{ELEMENT_LABEL[cf.element]}</p>
                  )}

                  {/* Bio excerpt */}
                  {cf.bio && (
                    <p className="text-xs text-[#8892A4] leading-relaxed line-clamp-3 mb-4">{cf.bio}</p>
                  )}

                  {/* Communication style */}
                  {cf.communication_style && (
                    <p className="text-xs text-[#8892A4] italic mb-4">"{cf.communication_style}"</p>
                  )}

                  <button
                    type="button"
                    className="text-xs text-[#8892A4] border border-[#1E2A4A] px-3 py-1.5 rounded-lg hover:text-white transition-colors"
                  >
                    Cambiar
                  </button>
                </div>
              )
            })}
          </div>
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
  )
}
