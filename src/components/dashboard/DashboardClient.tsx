'use client'

import { useState } from 'react'
import ProjectCard from './ProjectCard'
import CreateProjectModal from './CreateProjectModal'

const PHASE_LABELS: Record<string, { label: string; color: string }> = {
  semilla:       { label: 'Semilla',       color: 'bg-amber-500/20 text-amber-400' },
  incubadora:    { label: 'Incubadora',    color: 'bg-blue-500/20 text-blue-400' },
  build:         { label: 'Build',         color: 'bg-purple-500/20 text-purple-400' },
  launched:      { label: 'Lanzado',       color: 'bg-green-500/20 text-green-400' },
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
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Mis Proyectos</h1>
          <p className="text-sm text-[#6b6d75] mt-1">
            {projects.length} proyecto{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="bg-[#C9A84C] hover:bg-[#b8963f] text-[#0F0F11] font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
        >
          + Nuevo Proyecto
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-[#2a2b30] rounded-xl">
          <p className="text-[#6b6d75] mb-2">Aún no tienes proyectos.</p>
          <p className="text-sm text-[#3a3b40] mb-6">Crea tu primero y deja que Nexo te guíe.</p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="bg-[#C9A84C] hover:bg-[#b8963f] text-[#0F0F11] font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
          >
            + Nuevo Proyecto
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
