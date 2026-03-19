'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Project, DocumentSpec, Advisor, Cofounder } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import EntregablesPropuesta from './EntregablesPropuesta'
import CofoundersPropuesta from './CofoundersPropuesta'
import ConsejoPrincipalPropuesta from './ConsejoPrincipalPropuesta'
import EspecialistasPropuesta from './EspecialistasPropuesta'
import ICPsPropuesta from './ICPsPropuesta'
import ConsejoListo from './ConsejoListo'

export type SeedStep =
  | 'entregables'
  | 'cofounders'
  | 'consejo_principal'
  | 'especialistas'
  | 'icps'
  | 'consejo_listo'

const STEPS: SeedStep[] = [
  'entregables',
  'cofounders',
  'consejo_principal',
  'especialistas',
  'icps',
  'consejo_listo',
]

const STEP_NUMBERS: Record<SeedStep, number> = {
  entregables: 2,
  cofounders: 3,
  consejo_principal: 4,
  especialistas: 5,
  icps: 6,
  consejo_listo: 7,
}

const STEP_LABELS: Record<SeedStep, string> = {
  entregables: 'Entregables',
  cofounders: 'Cofounders IA',
  consejo_principal: 'Consejo Principal',
  especialistas: 'Especialistas',
  icps: 'Buyer Personas',
  consejo_listo: 'Consejo Listo',
}

interface Props {
  project: Project
  cofounders: Cofounder[]
  userEmail: string
  initialStep?: SeedStep
}

// Hat colors
export const HAT_COLORS: Record<string, string> = {
  rojo:     'bg-red-500',
  verde:    'bg-green-500',
  azul:     'bg-blue-500',
  blanco:   'bg-white border border-gray-500',
  negro:    'bg-gray-800',
  amarillo: 'bg-yellow-400',
  naranja:  'bg-orange-500',
}

export default function SeedSessionFlow({ project, cofounders, userEmail, initialStep }: Props) {
  const initialIdx = initialStep ? Math.max(STEPS.indexOf(initialStep), 0) : 0

  // Two-layer navigation: progress never goes back, view can
  const [currentMaxStepIdx, setCurrentMaxStepIdx] = useState(initialIdx)
  const [viewingStepIdx, setViewingStepIdx] = useState(initialIdx)
  const [showAdvanceConfirm, setShowAdvanceConfirm] = useState(false)

  const currentStep = STEPS[viewingStepIdx]
  const isViewingPast = viewingStepIdx < currentMaxStepIdx

  // Council advisors — generated on-demand in ConsejoPrincipalPropuesta
  const [councilAdvisors, setCouncilAdvisors] = useState<Advisor[]>([])

  // Composed deliverables (set after /api/compose runs in EntregablesPropuesta)
  const [composedDeliverables, setComposedDeliverables] = useState<{ id: string; name: string }[]>([])

  // Selections across steps
  const [acceptedAdvIds,     setAcceptedAdvIds]     = useState<string[]>([])
  const [acceptedCofIds,     setAcceptedCofIds]     = useState<string[]>(
    cofounders.filter(c => c.role === 'constructivo' || c.role === 'critico').slice(0, 2).map(c => c.id)
  )
  const [acceptedSpecIds,    setAcceptedSpecIds]    = useState<string[]>([])
  const [acceptedPersonaIds, setAcceptedPersonaIds] = useState<string[]>([])

  function handleCouncilReady(advisors: Advisor[]) {
    setCouncilAdvisors(advisors)
    setAcceptedAdvIds(advisors.map(a => a.id))
  }

  // Load council from DB on mount — handles page refreshes mid-flow
  useEffect(() => {
    const supabase = createClient()
    void (async () => {
      try {
        const { data: council } = await supabase
          .from('councils')
          .select('id, council_advisors(level, advisors(id, name, specialty, category, element, hats, bio, language, is_native, advisor_type, communication_style, created_at))')
          .eq('project_id', project.id)
          .maybeSingle()
        if (!council) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const loaded = ((council as any).council_advisors ?? []).map((ca: any) => ({
          ...(ca.advisors ?? {}),
          level: ca.level as 'lidera' | 'apoya' | 'observa',
        })) as Advisor[]
        if (loaded.length > 0) {
          setCouncilAdvisors(loaded)
          setAcceptedAdvIds(loaded.map(a => a.id))
        }
      } catch { /* non-blocking */ }
    })()
  }, [project.id])

  // Advance to next step (called after confirmation)
  async function doAdvance() {
    const nextIdx = currentMaxStepIdx + 1
    if (nextIdx < STEPS.length) {
      const nextStep = STEPS[nextIdx]
      setCurrentMaxStepIdx(nextIdx)
      setViewingStepIdx(nextIdx)
      try {
        const supabase = createClient()
        await supabase.from('projects').update({ current_phase: nextStep }).eq('id', project.id)
      } catch { /* non-blocking */ }
    }
  }

  // onNext handler — shows confirmation or no-ops when viewing past
  function handleAdvanceRequest() {
    if (isViewingPast) return // past step: button is hidden, noop
    setShowAdvanceConfirm(true)
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  function clearStorage() {}

  const stepNum = STEP_NUMBERS[currentStep]
  const sharedProps = {
    project,
    stepNumber: stepNum,
    onNext: isViewingPast ? () => {} : handleAdvanceRequest,
  }

  return (
    <div className="min-h-screen bg-[#0A1128] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#1E2A4A] px-6 py-3 flex items-center justify-between shrink-0">
        <Link href={`/project/${project.id}`} className="hover:opacity-80 transition-opacity">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/branding/logo-claro-reason.png" alt="Reason" className="h-7 w-auto" />
        </Link>
        <div className="flex items-center gap-3 text-sm text-[#8892A4]">
          <span>{project.name} — Sesión de Consejo</span>
          <span className="text-[#1E2A4A]">|</span>
          <span>Paso {isViewingPast ? STEP_NUMBERS[STEPS[viewingStepIdx]] : stepNum} de 7</span>
          {isViewingPast && (
            <span className="flex items-center gap-1.5 text-xs bg-[#B8860B]/10 text-[#B8860B] border border-[#B8860B]/30 px-2.5 py-0.5 rounded-full">
              Vista previa
            </span>
          )}
          {!isViewingPast && (
            <span className="flex items-center gap-1.5 text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
              En curso
            </span>
          )}
        </div>
        <Link
          href={`/project/${project.id}`}
          className="text-sm text-[#8892A4] border border-[#1E2A4A] px-3 py-1.5 rounded-lg hover:text-white transition-colors"
        >
          Salir
        </Link>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-72 border-r border-[#1E2A4A] p-5 flex flex-col gap-5 overflow-y-auto shrink-0">
          <div>
            <h2 className="font-semibold text-sm mb-0.5">Sesión de Consejo</h2>
            <p className="text-xs text-[#8892A4]">Configuración del consejo</p>
          </div>

          <div>
            <p className="text-xs text-[#B8860B] uppercase tracking-wider font-medium mb-2">Progreso</p>
            <div className="space-y-1">
              {STEPS.map((step, i) => {
                const num = STEP_NUMBERS[step]
                const done = i < currentMaxStepIdx
                const isActive = i === currentMaxStepIdx
                const isViewing = i === viewingStepIdx
                const isFuture = i > currentMaxStepIdx
                const isClickable = i <= currentMaxStepIdx

                return (
                  <button
                    key={step}
                    type="button"
                    disabled={!isClickable}
                    onClick={() => isClickable ? setViewingStepIdx(i) : undefined}
                    className={`flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg transition-colors
                      ${isViewing ? 'bg-[#1E2A4A]' : ''}
                      ${isClickable && !isViewing ? 'hover:bg-[#1E2A4A]/50 cursor-pointer' : ''}
                      ${isFuture ? 'cursor-not-allowed' : ''}
                    `}
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      done   ? 'bg-[#B8860B]' :
                      isActive ? 'bg-[#B8860B] ring-2 ring-[#B8860B]/30' :
                                 'border border-[#1E2A4A]'
                    }`} />
                    <span className={`text-xs ${
                      isViewing   ? 'text-white font-medium' :
                      done        ? 'text-[#B8860B]' :
                      isActive    ? 'text-white' :
                                    'text-[#1E2A4A]'
                    }`}>
                      {num}. {STEP_LABELS[step]}
                    </span>
                    {done && (
                      <span className="text-[9px] text-[#B8860B]/60 ml-auto">✓</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-lg p-3">
            <p className="text-xs text-[#8892A4] uppercase tracking-wider mb-1">Proyecto Activo</p>
            <p className="font-semibold text-sm">{project.name}</p>
          </div>

          <div>
            <p className="text-xs text-[#8892A4] uppercase tracking-wider mb-2">Resumen del Fundador</p>
            <div className="bg-[#0D1535] border border-[#B8860B]/30 rounded-lg px-3 py-2">
              <p className="text-xs text-[#B8860B] flex items-center gap-1.5">
                <span>✓</span> Generado
              </p>
            </div>
          </div>

          <div className="text-xs text-[#1E2A4A] mt-auto">
            {userEmail}
          </div>
        </aside>

        {/* Main content — relative container for floating button */}
        <div className="flex-1 flex flex-col overflow-hidden relative">

          {/* Step content */}
          {currentStep === 'entregables' && (
            <EntregablesPropuesta
              {...sharedProps}
              onDeliverablesComposed={setComposedDeliverables}
              onCouncilReady={handleCouncilReady}
            />
          )}
          {currentStep === 'cofounders' && (
            <CofoundersPropuesta
              {...sharedProps}
              cofounders={cofounders}
              acceptedIds={acceptedCofIds}
              onAcceptedChange={setAcceptedCofIds}
            />
          )}
          {currentStep === 'consejo_principal' && (
            <ConsejoPrincipalPropuesta
              {...sharedProps}
              advisors={councilAdvisors}
              acceptedIds={acceptedAdvIds}
              onAcceptedChange={setAcceptedAdvIds}
            />
          )}
          {currentStep === 'especialistas' && (
            <EspecialistasPropuesta
              {...sharedProps}
              acceptedIds={acceptedSpecIds}
              onAcceptedChange={setAcceptedSpecIds}
            />
          )}
          {currentStep === 'icps' && (
            <ICPsPropuesta
              {...sharedProps}
              acceptedIds={acceptedPersonaIds}
              onAcceptedChange={setAcceptedPersonaIds}
            />
          )}
          {currentStep === 'consejo_listo' && (
            <ConsejoListo
              {...sharedProps}
              documentSpecs={composedDeliverables as unknown as DocumentSpec[]}
              advisors={councilAdvisors.filter(a => acceptedAdvIds.includes(a.id))}
              cofounders={cofounders.filter(c => acceptedCofIds.includes(c.id))}
              specialistCount={acceptedSpecIds.length}
              personaCount={acceptedPersonaIds.length}
              onComplete={clearStorage}
            />
          )}

          {/* Floating "continue" button when viewing a past step */}
          {isViewingPast && (
            <div className="absolute bottom-6 right-6 z-10">
              <button
                type="button"
                onClick={() => setViewingStepIdx(currentMaxStepIdx)}
                className="bg-[#B8860B] hover:bg-[#b8963f] text-[#0A1128] font-semibold text-sm px-5 py-3 rounded-xl shadow-lg transition-colors flex items-center gap-2"
              >
                <span className="text-[10px] opacity-70">◀</span>
                Continuar en {STEP_LABELS[STEPS[currentMaxStepIdx]]}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Advance confirmation modal */}
      {showAdvanceConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-white text-base font-semibold mb-2">
              ¿Avanzar al siguiente paso?
            </h3>
            <p className="text-[#8892A4] text-sm mb-5 leading-relaxed">
              Podrás regresar a ver este paso en cualquier momento haciendo clic en el sidebar.
              Tu información se guarda automáticamente.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowAdvanceConfirm(false)}
                className="px-4 py-2 text-[#8892A4] hover:text-white text-sm transition-colors"
              >
                Seguir aquí
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAdvanceConfirm(false)
                  void doAdvance()
                }}
                className="px-5 py-2 bg-[#B8860B] hover:bg-[#b8963f] text-[#0A1128] font-semibold text-sm rounded-lg transition-colors"
              >
                Avanzar →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
