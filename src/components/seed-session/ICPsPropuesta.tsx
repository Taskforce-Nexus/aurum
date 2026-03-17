'use client'

import { useState } from 'react'
import type { Project } from '@/lib/types'
import AdvisorProfileDrawer from './AdvisorProfileDrawer'

interface PersonaExample {
  id: string
  name: string
  archetype: string
  demographics: string
  quote: string
}

export const EXAMPLE_PERSONAS: PersonaExample[] = [
  {
    id: 'icp-1',
    name: 'Millennial Urbano',
    archetype: 'El profesional independiente',
    demographics: 'Hombre o mujer, 28-38 años, ingresos medios-altos, vive en ciudad principal de LATAM',
    quote: '"Quiero controlar mis finanzas pero no tengo tiempo para hacerlo bien."',
  },
  {
    id: 'icp-2',
    name: 'Freelancer Conservador',
    archetype: 'El autónomo organizado',
    demographics: 'Mujer u hombre, 25-40 años, ingresos variables, múltiples fuentes de ingreso',
    quote: '"Necesito separar mis finanzas personales de las del negocio sin complicarme."',
  },
  {
    id: 'icp-3',
    name: 'Freelancer Independiente',
    archetype: 'El emprendedor digital',
    demographics: 'Hombre o mujer, 22-35 años, ingresos digitales, trabajo remoto o híbrido',
    quote: '"Manejo dinero de varios proyectos pero siempre pierdo el hilo de cuánto gané realmente."',
  },
]

interface Props {
  project: Project
  stepNumber: number
  acceptedIds: string[]
  onAcceptedChange: (ids: string[]) => void
  onNext: () => void
}

export default function ICPsPropuesta({ project, acceptedIds, onAcceptedChange, onNext }: Props) {
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [personas, setPersonas] = useState<PersonaExample[]>(EXAMPLE_PERSONAS)
  const [profileItem, setProfileItem] = useState<PersonaExample | null>(null)

  async function handleRequestPersona() {
    setGenerating(true)
    try {
      const res = await fetch('/api/seed-session/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'buyer_persona',
          projectId: project.id,
          existingItems: personas,
        }),
      })
      const { item, error } = await res.json()
      if (error || !item) return
      setPersonas(prev => [...prev, item])
      onAcceptedChange([...acceptedIds, item.id])
    } catch { /* non-blocking */ }
    setGenerating(false)
  }

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
          step: 'icps',
          projectId: project.id,
          personas: personas.filter(p => acceptedIds.includes(p.id)).map(p => ({
            name: p.name,
            archetype_label: p.archetype,
            demographics: p.demographics,
            quote: p.quote,
          })),
        }),
      })
    } catch { /* non-blocking */ }
    setLoading(false)
    onNext()
  }

  return (
    <>
    <AdvisorProfileDrawer
      profile={profileItem ? { name: profileItem.name, archetype: profileItem.archetype, demographics: profileItem.demographics, quote: profileItem.quote } : null}
      isOpen={profileItem !== null}
      onClose={() => setProfileItem(null)}
      type="persona"
    />
    <main className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
        {/* Nexo message */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-[#B8860B]/20 border border-[#B8860B]/30 flex items-center justify-center text-[#B8860B] text-xs font-bold shrink-0 mt-1">N</div>
          <div className="max-w-2xl bg-[#0D1535] border border-[#1E2A4A] rounded-2xl rounded-tl-sm px-5 py-4 text-sm text-[#e0e0e5] leading-relaxed">
            Identifiqué las perspectivas de clientes relevantes para tu proyecto. Estos van a ayudarte a construir desde el lado del cliente real. Agrega o descarta según lo que sabes de tu mercado.
          </div>
        </div>

        {/* Personas list */}
        <div>
          <p className="text-xs text-[#B8860B] uppercase tracking-wider font-medium mb-3">
            Perspectivas del Cliente
          </p>
          <div className="space-y-3">
            {personas.map(persona => {
              const isAccepted = acceptedIds.includes(persona.id)
              return (
                <div key={persona.id} className={`bg-[#0D1535] border rounded-xl px-5 py-4 transition-colors ${isAccepted ? 'border-[#B8860B]/40' : 'border-[#1E2A4A]'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm text-white">{persona.name}</p>
                        <span className="text-xs text-[#8892A4] bg-[#1E2A4A] px-2 py-0.5 rounded-full">{persona.archetype}</span>
                      </div>
                      <p className="text-xs text-[#8892A4] leading-relaxed mb-2">{persona.demographics}</p>
                      <p className="text-xs text-[#B8860B]/80 italic">{persona.quote}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => discard(persona.id)}
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
                        onClick={() => accept(persona.id)}
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
                        onClick={() => setProfileItem(persona)}
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

          <button
            type="button"
            onClick={handleRequestPersona}
            disabled={generating}
            className="mt-3 text-xs text-[#8892A4] hover:text-white transition-colors disabled:opacity-50"
          >
            {generating ? 'Generando...' : '+ Agregar perspectiva'}
          </button>
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
          {loading ? 'Guardando...' : 'Agregar perspectivas →'}
        </button>
        <button
          type="button"
          onClick={handleRequestPersona}
          disabled={generating}
          className="px-4 py-3 text-sm text-[#8892A4] border border-[#1E2A4A] rounded-xl hover:text-white transition-colors disabled:opacity-50"
        >
          {generating ? 'Generando...' : 'Pedir otra perspectiva'}
        </button>
      </div>
    </main>
    </>
  )
}
