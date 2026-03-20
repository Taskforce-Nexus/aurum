'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import ProjectCard from './ProjectCard'
import CreateProjectModal from './CreateProjectModal'
import { startDashboardTour, shouldShowTour } from '@/lib/onboarding'

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
  const t = useTranslations('dashboard')
  const [showModal, setShowModal] = useState(false)

  const PHASE_LABELS: Record<string, { label: string; color: string }> = {
    semilla:          { label: t('phaseSemilla'),        color: 'bg-amber-500/20 text-amber-400' },
    incubadora:       { label: t('phaseSeedSession'),    color: 'bg-blue-500/20 text-blue-400' },
    sesion_consejo:   { label: t('phaseCouncilSession'), color: 'bg-blue-500/20 text-blue-400' },
    completado:       { label: t('phaseCompleted'),      color: 'bg-green-500/20 text-green-400' },
    build:            { label: t('phaseBuild'),          color: 'bg-purple-500/20 text-purple-400' },
    launched:         { label: t('phaseLaunched'),       color: 'bg-green-500/20 text-green-400' },
  }

  function getPhase(phase: string | null) {
    if (!phase) return PHASE_LABELS.semilla
    return PHASE_LABELS[phase] ?? { label: phase, color: 'bg-[#2a2b30] text-[#6b6d75]' }
  }

  // First-time tour
  useEffect(() => {
    if (shouldShowTour('dashboard')) {
      setTimeout(() => startDashboardTour(), 1000)
    }
  }, [])

  // Post-registration checkout: if user came from /pricing via /register?plan=X
  // and checkout couldn't fire immediately (e.g. email verification required),
  // retry once they land on the dashboard with an active session.
  useEffect(() => {
    const pendingPlan = localStorage.getItem('pending_plan')
    if (!pendingPlan || pendingPlan === 'free') return
    localStorage.removeItem('pending_plan')
    fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: pendingPlan }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.url) window.location.href = data.url })
      .catch(() => {})
  }, [])

  return (
    <main className="max-w-4xl mx-auto px-4 md:px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="font-outfit text-2xl font-bold text-white">{t('title')}</h1>
          <p className="text-sm text-[#8892A4] mt-1">
            {t('gestiona')}
          </p>
        </div>
        <button
          type="button"
          data-tour="create-project"
          onClick={() => setShowModal(true)}
          className="bg-[#B8860B] hover:bg-[#a07509] text-white font-semibold px-5 h-10 rounded-lg text-sm transition-colors font-outfit"
        >
          {t('newProject')}
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          {/* Welcome headline */}
          <h1 className="font-outfit font-bold text-[32px] text-white text-center mb-3">
            {t('welcome')}
          </h1>
          <p className="text-[15px] text-[#8892A4] text-center max-w-md mb-8 leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            {t('welcomeDesc')}
          </p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="bg-[#B8860B] hover:bg-[#a07509] text-[#0A1128] font-bold px-8 h-12 rounded-xl text-[15px] transition-colors font-outfit mb-14"
          >
            {t('createFirstBtn')}
          </button>

          {/* Use cases */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
            {[
              { icon: '🚀', titleKey: 'useCase1Title', descKey: 'useCase1Desc' },
              { icon: '📈', titleKey: 'useCase2Title', descKey: 'useCase2Desc' },
              { icon: '🔍', titleKey: 'useCase3Title', descKey: 'useCase3Desc' },
            ].map(item => (
              <div
                key={item.titleKey}
                className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl px-5 py-5 space-y-2"
              >
                <span className="text-2xl">{item.icon}</span>
                <p className="font-outfit font-semibold text-[14px] text-white">{t(item.titleKey as Parameters<typeof t>[0])}</p>
                <p className="text-[12px] text-[#8892A4] leading-relaxed" style={{ fontFamily: 'Open Sans, sans-serif' }}>{t(item.descKey as Parameters<typeof t>[0])}</p>
              </div>
            ))}
          </div>
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
