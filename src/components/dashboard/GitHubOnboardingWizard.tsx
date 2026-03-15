'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Step = 1 | 2 | 3
type RepoMode = 'create' | 'existing'

interface Repo {
  name: string
  full_name: string
  private: boolean
  url: string
}

interface Props {
  initialStep?: Step
  projectName: string
  onSetProjectName: (name: string) => void
  organizationId: string
  userId: string
  onCancel: () => void
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100)
}

function StepIndicator({ step, current }: { step: Step; current: Step }) {
  const done = current > step
  const active = current === step
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
        done ? 'bg-[#C9A84C] border-[#C9A84C] text-[#0F0F11]' :
        active ? 'bg-transparent border-[#C9A84C] text-[#C9A84C]' :
        'bg-transparent border-[#3a3b40] text-[#3a3b40]'
      }`}>
        {done ? '✓' : step}
      </div>
      <span className={`text-xs whitespace-nowrap ${
        done ? 'text-[#C9A84C]/70' : active ? 'text-white' : 'text-[#3a3b40]'
      }`}>
        {step === 1 ? 'Conectar' : step === 2 ? 'Repo' : 'Listo'}
      </span>
    </div>
  )
}

export default function GitHubOnboardingWizard({
  initialStep = 1, projectName, onSetProjectName, organizationId, userId, onCancel
}: Props) {
  const [step, setStep] = useState<Step>(initialStep)
  const [repoMode, setRepoMode] = useState<RepoMode>('create')
  const [repoName, setRepoName] = useState(slugify(projectName) || 'mi-proyecto')
  const [selectedRepo, setSelectedRepo] = useState('')
  const [repos, setRepos] = useState<Repo[]>([])
  const [reposLoading, setReposLoading] = useState(false)
  const [githubLogin, setGithubLogin] = useState('')
  const [finalRepo, setFinalRepo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  // Keep repo name in sync with project name (only if user hasn't manually changed it)
  useEffect(() => {
    if (projectName) setRepoName(slugify(projectName))
  }, [projectName])

  // When entering step 2, load repos and get github login
  useEffect(() => {
    if (step !== 2) return
    setReposLoading(true)
    Promise.all([
      fetch('/api/github/repos').then(r => r.json()),
      supabase.from('user_integrations').select('github_login').eq('user_id', userId).eq('provider', 'github').single(),
    ]).then(([reposData, { data: integration }]) => {
      if (Array.isArray(reposData)) setRepos(reposData)
      if (integration?.github_login) setGithubLogin(integration.github_login)
    }).finally(() => setReposLoading(false))
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreateProject() {
    if (!projectName.trim()) { setError('Escribe un nombre para el proyecto'); return }
    setLoading(true)
    setError('')

    const { data: project, error: insertError } = await supabase.from('projects').insert({
      name: projectName.trim(),
      user_id: userId,
      organization_id: organizationId,
      status: 'active',
      entry_level: 'raw_idea',
      current_phase: 'Semilla',
      last_active_at: new Date().toISOString(),
    }).select().single()

    if (insertError || !project) {
      setError(insertError?.message ?? 'Error creando proyecto')
      setLoading(false)
      return
    }

    // Set github_repo on the project
    if (repoMode === 'existing' && selectedRepo) {
      // Just link existing repo — update projects.github_repo directly
      await supabase.from('projects').update({ github_repo: selectedRepo }).eq('id', project.id)
    } else {
      // Create new repo via init endpoint
      try {
        await fetch('/api/github/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: project.id, repoName: repoName.trim() }),
        })
      } catch {
        // Non-blocking
      }
    }

    router.push(`/project/${project.id}/seed-session`)
    router.refresh()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="bg-[#1A1B1E] border border-[#2a2b30] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#2a2b30]">
          <div className="flex items-center justify-between mb-5">
            <span className="text-xs text-[#6b6d75] tracking-widest uppercase">Nuevo Proyecto</span>
            <button type="button" onClick={onCancel} className="text-[#6b6d75] hover:text-white text-lg leading-none transition-colors">×</button>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-center gap-2">
            <StepIndicator step={1} current={step} />
            <div className={`flex-1 h-0.5 mb-5 ${step > 1 ? 'bg-[#C9A84C]/50' : 'bg-[#2a2b30]'}`} />
            <StepIndicator step={2} current={step} />
            <div className={`flex-1 h-0.5 mb-5 ${step > 2 ? 'bg-[#C9A84C]/50' : 'bg-[#2a2b30]'}`} />
            <StepIndicator step={3} current={step} />
          </div>

          {/* Project name input — always visible */}
          <div className="mt-4">
            <label htmlFor="wizard-project-name" className="text-xs text-[#6b6d75] block mb-1.5">Nombre del proyecto</label>
            <input
              id="wizard-project-name"
              value={projectName}
              onChange={e => onSetProjectName(e.target.value)}
              placeholder="Ej: Elevon"
              className="w-full bg-[#0F0F11] border border-[#2a2b30] focus:border-[#C9A84C] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#3a3b40] focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Step content */}
        <div className="px-6 py-5 min-h-[220px]">

          {/* STEP 1 — Connect GitHub */}
          {step === 1 && (
            <div className="flex flex-col items-center text-center gap-4 py-2">
              <div className="w-16 h-16 rounded-2xl bg-[#0F0F11] border border-[#2a2b30] flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold text-base">Conecta tu GitHub</h3>
                <p className="text-[#6b6d75] text-sm mt-1.5 leading-5 max-w-xs">
                  Reason guarda todos tus entregables en tu propio repositorio.
                  Cada documento que generes aparecerá ahí en tiempo real.
                </p>
              </div>
              <a href="/api/auth/github"
                className="w-full bg-[#C9A84C] hover:bg-[#b8963f] text-[#0F0F11] font-semibold py-2.5 rounded-lg text-sm transition-colors text-center block">
                Conectar con GitHub
              </a>
              <p className="text-xs text-[#3a3b40]">
                ¿No tienes cuenta?{' '}
                <a href="https://github.com/signup" target="_blank" rel="noopener noreferrer"
                  className="text-[#6b6d75] hover:text-white transition-colors underline">
                  Es gratis — créala en github.com
                </a>
              </p>
            </div>
          )}

          {/* STEP 2 — Create or choose repo */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              {/* Mode selector */}
              <div className="flex gap-2">
                <button type="button"
                  onClick={() => setRepoMode('create')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    repoMode === 'create'
                      ? 'bg-[#C9A84C]/10 border-[#C9A84C] text-[#C9A84C]'
                      : 'bg-transparent border-[#2a2b30] text-[#6b6d75] hover:border-[#3a3b40]'
                  }`}>
                  Crear repo nuevo
                </button>
                <button type="button"
                  onClick={() => setRepoMode('existing')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    repoMode === 'existing'
                      ? 'bg-[#C9A84C]/10 border-[#C9A84C] text-[#C9A84C]'
                      : 'bg-transparent border-[#2a2b30] text-[#6b6d75] hover:border-[#3a3b40]'
                  }`}>
                  Usar existente
                </button>
              </div>

              {repoMode === 'create' ? (
                <div>
                  <label htmlFor="wizard-repo-name" className="text-xs text-[#6b6d75] block mb-1.5">Nombre del repositorio</label>
                  <input
                    id="wizard-repo-name"
                    value={repoName}
                    onChange={e => setRepoName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="w-full bg-[#0F0F11] border border-[#2a2b30] focus:border-[#C9A84C] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#3a3b40] focus:outline-none transition-colors"
                  />
                  {githubLogin && (
                    <p className="text-xs text-[#3a3b40] mt-1.5">
                      Se creará en: <span className="text-[#6b6d75]">github.com/{githubLogin}/{repoName || '…'}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label htmlFor="wizard-existing-repo" className="text-xs text-[#6b6d75] block mb-1.5">Seleccionar repositorio</label>
                  {reposLoading ? (
                    <p className="text-xs text-[#3a3b40] py-3">Cargando repos…</p>
                  ) : (
                    <select
                      id="wizard-existing-repo"
                      value={selectedRepo}
                      onChange={e => setSelectedRepo(e.target.value)}
                      className="w-full bg-[#0F0F11] border border-[#2a2b30] focus:border-[#C9A84C] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none transition-colors"
                    >
                      <option value="">— Elige un repo —</option>
                      {repos.map(r => (
                        <option key={r.full_name} value={r.full_name}>
                          {r.name}{r.private ? ' (privado)' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <button type="button"
                onClick={() => {
                  if (repoMode === 'create' && !repoName.trim()) return
                  if (repoMode === 'existing' && !selectedRepo) return
                  setFinalRepo(repoMode === 'create'
                    ? (githubLogin ? `${githubLogin}/${repoName}` : repoName)
                    : selectedRepo)
                  setStep(3)
                }}
                disabled={repoMode === 'existing' && !selectedRepo}
                className="w-full bg-[#C9A84C] hover:bg-[#b8963f] text-[#0F0F11] font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {repoMode === 'create' ? 'Usar este nombre' : 'Usar este repo'}
              </button>
            </div>
          )}

          {/* STEP 3 — Ready */}
          {step === 3 && (
            <div className="flex flex-col items-center text-center gap-4 py-2">
              <div className="w-16 h-16 rounded-full bg-[#C9A84C]/15 border-2 border-[#C9A84C]/50 flex items-center justify-center">
                <span className="text-2xl text-[#C9A84C]">✓</span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-base">Tu repo está listo</h3>
                <p className="text-[#6b6d75] text-sm mt-1">Los documentos de tu venture se sincronizarán aquí:</p>
                <a href={`https://github.com/${finalRepo}`} target="_blank" rel="noopener noreferrer"
                  className="text-[#C9A84C] text-sm hover:underline mt-1 block">
                  github.com/{finalRepo}
                </a>
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button type="button"
                onClick={handleCreateProject}
                disabled={loading || !projectName.trim()}
                className="w-full bg-[#C9A84C] hover:bg-[#b8963f] text-[#0F0F11] font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50">
                {loading ? 'Creando…' : 'Crear proyecto'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
