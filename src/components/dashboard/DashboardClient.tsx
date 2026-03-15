'use client'

import { useState } from 'react'
import ProjectCard from './ProjectCard'
import CreateProjectModal from './CreateProjectModal'

const PHASE_LABELS: Record<string, { label: string; color: string }> = {
  semilla:          { label: 'Semilla',            color: 'bg-amber-500/20 text-amber-400' },
  incubadora:       { label: 'Sesión Semilla',       color: 'bg-blue-500/20 text-blue-400' },
  sesion_consejo:   { label: 'Sesión de Consejo',   color: 'bg-blue-500/20 text-blue-400' },
  completado:       { label: 'Completado',           color: 'bg-green-500/20 text-green-400' },
  build:            { label: 'Build',               color: 'bg-purple-500/20 text-purple-400' },
  launched:         { label: 'Lanzado',             color: 'bg-green-500/20 text-green-400' },
}

function getPhase(phase: string | null) {
  if (!phase) return PHASE_LABELS.semilla
  return PHASE_LABELS[phase] ?? { label: phase, color: 'bg-[#2a2b30] text-[#6b6d75]' }
}

interface Project {
  id: string
  name: string
  description: string | null
  current_phase: string | null
  entry_level: string | null
  last_active_at: string | null
  seed_completed: boolean | null
}

interface Props {
  projects: Project[]
}

export default function DashboardClient({ projects }: Props) {
  const [showModal, setShowModal] = useState(false)

  return (
    <main className="max-w-4xl mx-auto px-4 md:px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="font-outfit text-2xl font-bold text-white">Mis Proyectos</h1>
          <p className="text-sm text-[#8892A4] mt-1">
            Gestiona tus diferentes rutas y el avance de cada emprendimiento tuyo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="bg-[#B8860B] hover:bg-[#a07509] text-white font-semibold px-5 h-10 rounded-lg text-sm transition-colors font-outfit"
        >
          + Nuevo Proyecto
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-[#1E2A4A] rounded-xl">
          <p className="text-[#8892A4] mb-2">Aún no tienes proyectos.</p>
          <p className="text-sm text-[#4A5568] mb-6">Crea tu primero y deja que Nexo te guíe.</p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="bg-[#B8860B] hover:bg-[#a07509] text-white font-semibold px-5 h-10 rounded-lg text-sm transition-colors font-outfit"
          >
            + Nuevo Proyecto
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {projects.map(project => {
            const phase = getPhase(project.current_phase)
            return (
              <ProjectCard
                key={project.id}
                id={project.id}
                name={project.name}
                description={project.description}
                currentPhase={project.current_phase}
                phasePill={phase}
                lastActiveAt={project.last_active_at}
              />
            )
          })}
        </div>
      )}

      {showModal && <CreateProjectModal onClose={() => setShowModal(false)} />}
    </main>
  )
}
