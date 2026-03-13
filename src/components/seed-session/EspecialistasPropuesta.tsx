'use client'

import { useState } from 'react'
import type { Project } from '@/lib/types'

interface SpecialistExample {
  id: string
  name: string
  specialty: string
  justification: string
}

const EXAMPLE_SPECIALISTS: SpecialistExample[] = [
  {
    id: 'esp-1',
    name: 'Especialista en Finanzas LATAM',
    specialty: 'Regulación financiera y ecosistema fintech',
    justification: 'Tu producto opera en el espacio financiero en LATAM. Un especialista en regulación local puede anticipar fricciones con normativas que afectan directamente tu go-to-market.',
  },
  {
    id: 'esp-2',
    name: 'Experto en Banca Digital',
    specialty: 'Integración con sistemas bancarios',
    justification: 'La integración con infraestructura bancaria existente es un riesgo técnico significativo. Este especialista ha navegado estos sistemas en proyectos similares.',
  },
  {
    id: 'esp-3',
    name: 'Especialista Legal Financiero',
    specialty: 'Cumplimiento y estructura legal',
    justification: 'Productos financieros requieren estructura legal específica. Este especialista diseña la arquitectura legal que minimiza riesgos y acelera la operación.',
  },
  {
    id: 'esp-4',
    name: 'Experto en Comportamiento del Consumidor',
    specialty: 'Psicología de adopción tecnológica',
    justification: 'La adopción de productos financieros digitales tiene barreras psicológicas específicas. Este especialista aplica frameworks de comportamiento para acelerar la adopción.',
  },
]

interface Props {
  project: Project
  stepNumber: number
  acceptedIds: string[]
  onAcceptedChange: (ids: string[]) => void
  onNext: () => void
}

export default function EspecialistasPropuesta({ project, acceptedIds, onAcceptedChange, onNext }: Props) {
  const [loading, setLoading] = useState(false)

  function accept(id: string) {
    if (!acceptedIds.includes(id)) onAcceptedChange([...acceptedIds, id])
  }
  function discard(id: string) {
    onAcceptedChange(acceptedIds.filter(i => i !== id))
  }

  async function handleConfirm() {
    setLoading(true)
    try {
      await fetch('/api/seed-session/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'especialistas',
          projectId: project.id,
          specialists: EXAMPLE_SPECIALISTS.filter(s => acceptedIds.includes(s.id)).map(s => ({
            name: s.name,
            specialty: s.specialty,
            justification: s.justification,
          })),
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
            Basándome en tu sector, identifiqué estos especialistas de industria para tu consejo. Son expertos en áreas específicas del negocio. Si quieres agregar alguno más, búscalo o pídeme otro.
          </div>
        </div>

        {/* Specialists list */}
        <div>
          <p className="text-xs text-[#B8860B] uppercase tracking-wider font-medium mb-3">
            Posibles Lista de Industria
          </p>
          <div className="space-y-3">
            {EXAMPLE_SPECIALISTS.map(specialist => {
              const isAccepted = acceptedIds.includes(specialist.id)
              return (
                <div key={specialist.id} className={`bg-[#0D1535] border rounded-xl px-5 py-4 transition-colors ${isAccepted ? 'border-[#B8860B]/40' : 'border-[#1E2A4A]'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-white">{specialist.name}</p>
                      <p className="text-xs text-[#B8860B] mt-0.5">{specialist.specialty}</p>
                      <p className="text-xs text-[#8892A4] leading-relaxed mt-2">{specialist.justification}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => discard(specialist.id)}
                        className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                          !isAccepted
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : 'text-[#8892A4] border-[#1E2A4A] hover:text-white'
                        }`}
                      >
                        Descartar
                      </button>
                      <button
                        type="button"
                        onClick={() => accept(specialist.id)}
                        className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                          isAccepted
                            ? 'bg-[#B8860B]/20 text-[#B8860B] border-[#B8860B]/30'
                            : 'text-[#8892A4] border-[#1E2A4A] hover:text-white'
                        }`}
                      >
                        Aceptar
                      </button>
                      <button
                        type="button"
                        className="text-xs px-2.5 py-1 rounded border border-[#1E2A4A] text-[#8892A4] hover:text-white transition-colors"
                      >
                        Ver perfil
                      </button>
                    </div>
                  </div>
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
          disabled={loading}
          className="flex-1 bg-[#B8860B] hover:bg-[#b8963f] text-[#0A1128] font-semibold text-sm py-3 rounded-xl transition-colors disabled:opacity-40"
        >
          {loading ? 'Guardando...' : 'Agregar más especialistas →'}
        </button>
        <button
          type="button"
          className="px-4 py-3 text-sm text-[#8892A4] border border-[#1E2A4A] rounded-xl hover:text-white transition-colors"
        >
          Pedir otro especialista
        </button>
      </div>
    </main>
  )
}
