'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Advisor } from '@/lib/types'
import { HAT_COLORS } from './SeedSessionFlow'

interface Props {
  isOpen: boolean
  onClose: () => void
  currentAdvisorId: string
  onSelect: (advisor: Advisor) => void
}

export default function AdvisorSwapDrawer({ isOpen, onClose, currentAdvisorId, onSelect }: Props) {
  const [advisors, setAdvisors] = useState<Advisor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    const supabase = createClient()
    supabase
      .from('advisors')
      .select('*')
      .neq('id', currentAdvisorId)
      .then(({ data }) => {
        setAdvisors(data ?? [])
        setLoading(false)
      })
  }, [isOpen, currentAdvisorId])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-[420px] h-full bg-[#0D1535] border-l border-[#1E2A4A] p-6 overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8892A4] hover:text-white transition-colors"
        >
          ✕
        </button>

        <h2 className="text-lg font-outfit font-bold text-white mb-1">
          Cambiar asesor
        </h2>
        <p className="text-sm text-[#8892A4] mb-6">
          Selecciona un asesor diferente para este rol.
        </p>

        {loading ? (
          <p className="text-sm text-[#8892A4]">Cargando...</p>
        ) : advisors.length === 0 ? (
          <p className="text-sm text-[#8892A4]">No hay otros asesores disponibles.</p>
        ) : (
          <div className="space-y-4">
            {advisors.map(a => (
              <div key={a.id} className="p-4 bg-[#0A1128] border border-[#1E2A4A] rounded-lg">
                <p className="font-semibold text-white mb-0.5">{a.name}</p>
                <p className="text-xs text-[#B8860B] mb-2">{a.specialty}</p>
                {a.hats.length > 0 && (
                  <div className="flex gap-1 mb-2">
                    {a.hats.map(hat => (
                      <div key={hat} className={`w-2.5 h-2.5 rounded-full ${HAT_COLORS[hat] ?? 'bg-gray-600'}`} title={hat} />
                    ))}
                  </div>
                )}
                {a.bio && <p className="text-xs text-[#8892A4] mb-2">{a.bio}</p>}
                {a.communication_style && (
                  <p className="text-xs italic text-[#8892A4] mb-3">&ldquo;{a.communication_style}&rdquo;</p>
                )}
                <button
                  onClick={() => { onSelect(a); onClose() }}
                  className="w-full py-2 bg-[#B8860B] text-black text-sm font-semibold rounded-lg hover:bg-[#9A7209] transition-colors"
                >
                  Seleccionar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
