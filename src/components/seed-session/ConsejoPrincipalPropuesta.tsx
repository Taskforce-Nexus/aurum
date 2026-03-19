'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Advisor, Project } from '@/lib/types'
import { HAT_COLORS } from './SeedSessionFlow'
import AdvisorProfileDrawer from './AdvisorProfileDrawer'

interface Props {
  project: Project
  stepNumber: number
  advisors: Advisor[]
  acceptedIds: string[]
  onAcceptedChange: (ids: string[]) => void
  onNext: () => void
}

const LEVEL_LABELS: Record<string, string> = {
  lidera:  'LIDERA',
  apoya:   'APOYA',
  observa: 'OBSERVA',
}

const LEVEL_COLORS: Record<string, string> = {
  lidera:  'bg-[#B8860B]/20 text-[#B8860B] border-[#B8860B]/30',
  apoya:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
  observa: 'bg-[#1E2A4A] text-[#8892A4] border-[#1E2A4A]',
}

const LEVEL_BORDER: Record<string, string> = {
  lidera:  'border-[#B8860B]/40',
  apoya:   'border-blue-500/30',
  observa: 'border-[#1E2A4A]',
}

export default function ConsejoPrincipalPropuesta({ project, advisors, acceptedIds, onAcceptedChange, onNext }: Props) {
  const [loading, setLoading] = useState(false)
  const [profileAdvisor, setProfileAdvisor] = useState<Advisor | null>(null)
  const [localAdvisors, setLocalAdvisors] = useState<Advisor[]>(advisors)

  // Inline swap state
  const [swapForAdvisor, setSwapForAdvisor] = useState<Advisor | null>(null)
  const [swapOptions, setSwapOptions] = useState<Advisor[]>([])
  const [swapLoading, setSwapLoading] = useState(false)
  const [swapOffset, setSwapOffset] = useState(0)

  // Custom advisor state
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customDescription, setCustomDescription] = useState('')
  const [generatingCustom, setGeneratingCustom] = useState(false)
  const [customError, setCustomError] = useState('')

  // Sync localAdvisors when prop updates (e.g., after page refresh loads from DB)
  useEffect(() => {
    if (advisors.length > 0) setLocalAdvisors(advisors)
  }, [advisors])

  const grouped: Record<string, Advisor[]> = { lidera: [], apoya: [], observa: [] }
  for (const a of localAdvisors) {
    if (grouped[a.level]) grouped[a.level].push(a)
  }

  async function loadSwapOptions(advisor: Advisor, offset: number) {
    setSwapLoading(true)
    try {
      const supabase = createClient()
      const excludeIds = localAdvisors.map(a => a.id)
      let q = supabase
        .from('advisors')
        .select('id, name, specialty, category, hats, bio, communication_style, is_native, level, element, language, advisor_type, created_at')
        .eq('is_native', true)
        .range(offset, offset + 3)

      if (excludeIds.length > 0) {
        q = q.not('id', 'in', `(${excludeIds.join(',')})`)
      }
      if (advisor.category) {
        q = q.eq('category', advisor.category)
      }

      const { data } = await q
      const options = (data ?? []).map(a => ({ ...a, level: advisor.level, hats: a.hats ?? [] })) as Advisor[]

      if (offset === 0) {
        setSwapOptions(options)
      } else {
        setSwapOptions(prev => [...prev, ...options])
      }
    } catch { /* non-blocking */ }
    setSwapLoading(false)
  }

  function openSwap(advisor: Advisor) {
    if (swapForAdvisor?.id === advisor.id) {
      setSwapForAdvisor(null)
      return
    }
    setSwapForAdvisor(advisor)
    setSwapOffset(0)
    setSwapOptions([])
    loadSwapOptions(advisor, 0)
  }

  function loadMore() {
    if (!swapForAdvisor) return
    const newOffset = swapOffset + 4
    setSwapOffset(newOffset)
    loadSwapOptions(swapForAdvisor, newOffset)
  }

  function applySwap(newAdvisor: Advisor) {
    if (!swapForAdvisor) return
    const replacedLevel = swapForAdvisor.level
    setLocalAdvisors(prev =>
      prev.map(a => a.id === swapForAdvisor.id ? { ...newAdvisor, level: replacedLevel } : a)
    )
    onAcceptedChange(
      acceptedIds.filter(id => id !== swapForAdvisor.id).concat(newAdvisor.id)
    )
    setSwapForAdvisor(null)
    setSwapOptions([])
  }

  async function handleGenerateCustom() {
    if (!customDescription.trim() || customDescription.trim().length < 10) {
      setCustomError('Describe el tipo de experto que necesitas (mínimo 10 caracteres).')
      return
    }
    setCustomError('')
    setGeneratingCustom(true)
    try {
      const res = await fetch('/api/advisors/generate-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: project.id, description: customDescription.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCustomError(data.error ?? 'Error generando el consejero. Intenta de nuevo.')
        return
      }
      const newAdvisor: Advisor = { ...data.advisor, level: 'lidera' }
      setLocalAdvisors(prev => [...prev, newAdvisor])
      setCustomDescription('')
      setShowCustomInput(false)
    } catch {
      setCustomError('Error de red. Intenta de nuevo.')
    } finally {
      setGeneratingCustom(false)
    }
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
    <main className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">

        {/* Nexo message */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-[#B8860B]/20 border border-[#B8860B]/30 flex items-center justify-center text-[#B8860B] text-xs font-bold shrink-0 mt-1">N</div>
          <div className="max-w-2xl bg-[#0D1535] border border-[#1E2A4A] rounded-2xl rounded-tl-sm px-5 py-4 text-sm text-[#e0e0e5] leading-relaxed">
            Armé tu consejo basándome en lo que necesitas para este proyecto. Cada consejero tiene un rol específico: <strong className="text-[#B8860B]">LIDERA</strong> toma la iniciativa en su área, <strong className="text-blue-400">APOYA</strong> aporta perspectiva especializada, <strong className="text-[#8892A4]">OBSERVA</strong> monitorea y alerta. Si quieres cambiar alguno, haz clic en "Cambiar" para ver alternativas.
          </div>
        </div>

        {/* Estructura del consejo */}
        <div>
          <p className="text-xs text-[#B8860B] uppercase tracking-wider font-medium mb-1">Estructura de tu consejo</p>
          <p className="text-xs text-[#8892A4] mb-4">Base — {project.name} · {localAdvisors.length} consejeros</p>

          {(['lidera', 'apoya', 'observa'] as const).map(level => {
            if (!grouped[level]?.length) return null
            return (
              <div key={level} className="mb-5">
                <p className="text-xs text-[#8892A4] uppercase tracking-wider mb-2">{LEVEL_LABELS[level]}</p>
                <div className="grid grid-cols-3 gap-3">
                  {grouped[level].map(advisor => {
                    const isSwapOpen = swapForAdvisor?.id === advisor.id
                    return (
                      <div key={advisor.id} className={`bg-[#0D1535] border rounded-xl overflow-hidden transition-colors ${LEVEL_BORDER[advisor.level]}`}>
                        {/* Card content */}
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-white leading-tight">{advisor.name}</p>
                              {!advisor.is_native && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 font-medium inline-block mt-0.5">
                                  Personalizado
                                </span>
                              )}
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0 ml-1 ${LEVEL_COLORS[advisor.level]}`}>
                              {LEVEL_LABELS[advisor.level]}
                            </span>
                          </div>
                          <p className="text-xs text-[#8892A4] mb-2">{advisor.specialty}</p>

                          {/* Hats */}
                          {advisor.hats?.length > 0 && (
                            <div className="flex gap-1 mb-2">
                              {advisor.hats.map(hat => (
                                <div key={hat} className={`w-2.5 h-2.5 rounded-full ${HAT_COLORS[hat] ?? 'bg-gray-600'}`} title={hat} />
                              ))}
                            </div>
                          )}

                          {/* Communication style */}
                          {advisor.communication_style && (
                            <p className="text-[10px] italic text-[#4A5568] mb-2 line-clamp-1">"{advisor.communication_style}"</p>
                          )}

                          <div className="flex gap-1.5 mt-3">
                            <button
                              type="button"
                              onClick={() => openSwap(advisor)}
                              className={`text-xs border px-2 py-1 rounded transition-colors ${
                                isSwapOpen
                                  ? 'text-[#B8860B] border-[#B8860B]/30 bg-[#B8860B]/10'
                                  : 'text-[#8892A4] border-[#1E2A4A] hover:text-white'
                              }`}
                            >
                              {isSwapOpen ? 'Cerrar' : 'Cambiar'}
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

                        {/* Inline swap panel */}
                        {isSwapOpen && (
                          <div className="border-t border-[#1E2A4A] bg-[#070E22] px-4 py-3">
                            <p className="text-[10px] text-[#8892A4] uppercase tracking-wider font-medium mb-2">
                              Alternativas para este rol
                            </p>
                            {swapLoading && swapOptions.length === 0 ? (
                              <div className="space-y-2">
                                {[1, 2, 3].map(i => (
                                  <div key={i} className="h-10 bg-[#0D1535] rounded-lg animate-pulse" />
                                ))}
                              </div>
                            ) : swapOptions.length === 0 ? (
                              <p className="text-xs text-[#4A5568] italic">No hay más alternativas en esta categoría.</p>
                            ) : (
                              <div className="space-y-2">
                                {swapOptions.map(opt => (
                                  <div key={opt.id} className="flex items-center justify-between bg-[#0D1535] border border-[#1E2A4A] rounded-lg px-3 py-2 gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-white font-medium truncate">{opt.name}</p>
                                      <p className="text-[10px] text-[#8892A4] truncate">{opt.specialty}</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => applySwap(opt)}
                                      className="text-[10px] text-[#B8860B] border border-[#B8860B]/30 px-2 py-1 rounded hover:bg-[#B8860B]/10 transition-colors shrink-0"
                                    >
                                      Elegir
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={loadMore}
                                  disabled={swapLoading}
                                  className="w-full text-[10px] text-[#4A5568] hover:text-[#8892A4] transition-colors py-1 disabled:opacity-40"
                                >
                                  {swapLoading ? 'Cargando...' : 'Ver más opciones →'}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {localAdvisors.length === 0 && (
            <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-8 text-center">
              <p className="text-sm text-[#8892A4]">Cargando tu consejo...</p>
            </div>
          )}
        </div>
      </div>

      {/* Custom advisor */}
      <div className="px-8 pb-4 shrink-0">
        {!showCustomInput ? (
          <button
            type="button"
            onClick={() => setShowCustomInput(true)}
            className="w-full py-2.5 border border-dashed border-[#1E2A4A] hover:border-[#B8860B]/40 rounded-xl text-[12px] text-[#4A5568] hover:text-[#B8860B] transition-colors"
          >
            + ¿Necesitas un perfil específico? Genera un consejero personalizado
          </button>
        ) : (
          <div className="bg-[#0D1535] border border-[#B8860B]/30 rounded-xl p-4 space-y-3">
            <p className="text-[12px] text-[#B8860B] font-medium">Consejero personalizado</p>
            <p className="text-[11px] text-[#4A5568]">
              Describe qué tipo de experto necesitas y Nexo lo generará en ~20 segundos.
            </p>
            <textarea
              value={customDescription}
              onChange={e => setCustomDescription(e.target.value)}
              placeholder="Ej: Necesito un experto en regulación de criptomonedas en Colombia con experiencia en SFC..."
              rows={3}
              maxLength={500}
              className="w-full bg-[#0A1128] border border-[#1E2A4A] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#4A5568] focus:outline-none focus:border-[#B8860B]/50 resize-none"
            />
            {customError && (
              <p className="text-[12px] text-red-400">{customError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleGenerateCustom}
                disabled={generatingCustom}
                className="flex-1 py-2 bg-[#B8860B] hover:bg-[#A07710] disabled:opacity-40 text-black font-semibold text-[12px] rounded-lg transition-colors"
              >
                {generatingCustom ? 'Generando (~20s)...' : 'Generar consejero'}
              </button>
              <button
                type="button"
                onClick={() => { setShowCustomInput(false); setCustomError(''); setCustomDescription('') }}
                className="px-3 py-2 border border-[#1E2A4A] text-[#8892A4] hover:text-white text-[12px] rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="border-t border-[#1E2A4A] px-8 py-4 shrink-0">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading || localAdvisors.length === 0}
          className="w-full bg-[#B8860B] hover:bg-[#b8963f] text-[#0A1128] font-semibold text-sm py-3 rounded-xl transition-colors disabled:opacity-40"
        >
          {loading ? 'Guardando...' : 'Siguiente →'}
        </button>
      </div>
    </main>
    </>
  )
}
