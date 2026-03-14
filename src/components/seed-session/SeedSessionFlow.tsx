'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LOGO_DATA_URL } from '@/lib/logo'
import type { Project, DocumentSpec, Advisor, Cofounder } from '@/lib/types'
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

interface Props {
  project: Project
  documentSpecs: DocumentSpec[]
  advisors: Advisor[]
  cofounders: Cofounder[]
  userEmail: string
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

export default function SeedSessionFlow({ project, documentSpecs, advisors, cofounders, userEmail }: Props) {
  const STORAGE_KEY = `sesion_consejo_${project.id}`

  const [currentStep, setCurrentStep] = useState<SeedStep>('entregables')

  // Selections across steps
  const [acceptedDocIds,     setAcceptedDocIds]     = useState<string[]>(documentSpecs.map(d => d.id))
  const [acceptedAdvIds,     setAcceptedAdvIds]     = useState<string[]>(advisors.map(a => a.id))
  const [acceptedCofIds,     setAcceptedCofIds]     = useState<string[]>(
    cofounders.filter(c => c.role === 'constructivo' || c.role === 'critico').slice(0, 2).map(c => c.id)
  )
  const [acceptedSpecIds,    setAcceptedSpecIds]    = useState<string[]>([])
  const [acceptedPersonaIds, setAcceptedPersonaIds] = useState<string[]>([])

  // Restore persisted step from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_step`)
      if (saved && STEPS.includes(saved as SeedStep)) {
        setCurrentStep(saved as SeedStep)
      }
    } catch { /* localStorage unavailable */ }
  }, [])

  // Persist step on every change
  useEffect(() => {
    try { localStorage.setItem(`${STORAGE_KEY}_step`, currentStep) } catch { /* ignore */ }
  }, [currentStep])

  const stepNum = STEP_NUMBERS[currentStep]

  function advance() {
    const idx = STEPS.indexOf(currentStep)
    if (idx < STEPS.length - 1) setCurrentStep(STEPS[idx + 1])
  }

  function clearStorage() {
    try { localStorage.removeItem(`${STORAGE_KEY}_step`) } catch { /* ignore */ }
  }

  const sharedProps = { project, stepNumber: stepNum, onNext: advance }

  return (
    <div className="min-h-screen bg-[#0A1128] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#1E2A4A] px-6 py-3 flex items-center justify-between shrink-0">
        <Link href={`/project/${project.id}`} className="hover:opacity-80 transition-opacity">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_DATA_URL} alt="Reason" className="h-7 w-auto" />
        </Link>
        <div className="flex items-center gap-3 text-sm text-[#8892A4]">
          <span>{project.name} — Sesión Semilla</span>
          <span className="text-[#1E2A4A]">|</span>
          <span>Paso {stepNum} de 7</span>
          <span className="flex items-center gap-1.5 text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
            En curso
          </span>
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
            <h2 className="font-semibold text-sm mb-0.5">Sesión Semilla</h2>
            <p className="text-xs text-[#8892A4]">Configuración del consejo</p>
          </div>

          <div>
            <p className="text-xs text-[#B8860B] uppercase tracking-wider font-medium mb-2">Progreso</p>
            <div className="space-y-2">
              {STEPS.map((step, i) => {
                const num = STEP_NUMBERS[step]
                const labels: Record<SeedStep, string> = {
                  entregables:      'Entregables',
                  cofounders:       'Cofounders IA',
                  consejo_principal:'Consejo Principal',
                  especialistas:    'Especialistas',
                  icps:             'Buyer Personas',
                  consejo_listo:    'Consejo Listo',
                }
                const done = STEPS.indexOf(currentStep) > i
                const active = step === currentStep
                return (
                  <div key={step} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      done   ? 'bg-[#B8860B]' :
                      active ? 'bg-[#B8860B] ring-2 ring-[#B8860B]/30' :
                               'border border-[#1E2A4A]'
                    }`} />
                    <span className={`text-xs ${active ? 'text-white font-medium' : done ? 'text-[#8892A4]' : 'text-[#1E2A4A]'}`}>
                      {num}. {labels[step]}
                    </span>
                  </div>
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

        {/* Main content — changes per step */}
        {currentStep === 'entregables' && (
          <EntregablesPropuesta
            {...sharedProps}
            documentSpecs={documentSpecs}
            acceptedIds={acceptedDocIds}
            onAcceptedChange={setAcceptedDocIds}
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
            advisors={advisors}
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
            documentSpecs={documentSpecs.filter(d => acceptedDocIds.includes(d.id))}
            advisors={advisors.filter(a => acceptedAdvIds.includes(a.id))}
            cofounders={cofounders.filter(c => acceptedCofIds.includes(c.id))}
            specialistCount={acceptedSpecIds.length}
            personaCount={acceptedPersonaIds.length}
            onComplete={clearStorage}
          />
        )}
      </div>
    </div>
  )
}
