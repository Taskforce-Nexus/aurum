'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Cofounder } from '@/lib/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  role: 'constructivo' | 'critico'
  currentCofounderId: string
  onSelect: (cofounder: Cofounder) => void
}

export default function CofounderSwapDrawer({ isOpen, onClose, role, currentCofounderId, onSelect }: Props) {
  const [cofounders, setCofounders] = useState<Cofounder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    const supabase = createClient()
    supabase
      .from('cofounders')
      .select('*')
      .eq('role', role)
      .then(({ data }) => {
        setCofounders((data ?? []).filter((c: Cofounder) => c.id !== currentCofounderId))
        setLoading(false)
      })
  }, [isOpen, role, currentCofounderId])

  if (!isOpen) return null

  const roleLabel = role === 'constructivo' ? 'Constructivo' : 'Crítico'

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
          Cambiar cofounder {roleLabel}
        </h2>
        <p className="text-sm text-[#8892A4] mb-6">
          Selecciona un cofounder diferente para el rol {roleLabel}.
        </p>

        {loading ? (
          <p className="text-sm text-[#8892A4]">Cargando...</p>
        ) : cofounders.length === 0 ? (
          <p className="text-sm text-[#8892A4]">No hay otros cofounders disponibles para este rol.</p>
        ) : (
          <div className="space-y-4">
            {cofounders.map(c => (
              <div key={c.id} className="p-4 bg-[#0A1128] border border-[#1E2A4A] rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-white">{c.name}</p>
                    <p className="text-xs text-[#B8860B]">{c.specialty}</p>
                  </div>
                </div>
                {c.bio && <p className="text-xs text-[#8892A4] mb-2">{c.bio}</p>}
                {c.communication_style && (
                  <p className="text-xs italic text-[#8892A4] mb-3">&ldquo;{c.communication_style}&rdquo;</p>
                )}
                <button
                  onClick={() => { onSelect(c); onClose() }}
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
