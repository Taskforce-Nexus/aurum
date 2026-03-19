'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Project, Advisor, Cofounder } from '@/lib/types'
import { safeFetch } from '@/lib/fetch402'

// ─── Types ──────────────────────────────────────────────────────────────────

interface QuestionItem {
  section_title: string
  section_description: string
  question: string
}

interface PhaseItem {
  id: string
  phase_index: number
  status: 'pendiente' | 'en_progreso' | 'completada'
  questions: QuestionItem[]
  document_id: string
}

interface DocumentItem {
  id: string
  name: string
  key_question: string | null
  composition: {
    sections?: Array<{ title: string; description: string; questions: string[] }>
    advisors_needed?: string[]
  } | null
  status: string
}

interface AdvisorContribution {
  advisor_name: string
  specialty: string
  comment: string
}

interface DualResult {
  constructive_content: string
  critical_content: string
  agreement: boolean
  advisor_contributions: AdvisorContribution[]
  section_draft: string
  dual_response_id: string
  next_question_index: number | null
  next_question_text: string | null
}

interface SessionState {
  id: string
  status: string
  current_document_index: number
  current_question_index: number
  total_documents: number
}

type UIState =
  | 'init'
  | 'starting'
  | 'answering'
  | 'submitting'
  | 'debate_ready'
  | 'resolving'
  | 'phase_complete'
  | 'session_complete'

type Mode = 'normal' | 'autopiloto' | 'levantar_mano'

interface Props {
  project: Project
  advisors: Advisor[]
  cofounders: Cofounder[]
  documents: DocumentItem[]
  initialSession: SessionState | null
  initialPhases: unknown[]
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function SesionConsejoView({
  project,
  advisors,
  cofounders,
  documents,
  initialSession,
  initialPhases,
}: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const [session, setSession] = useState<SessionState | null>(initialSession)
  const [phases, setPhases] = useState<PhaseItem[]>(initialPhases as PhaseItem[])
  const [mode, setMode] = useState<Mode>('normal')
  const [uiState, setUiState] = useState<UIState>(initialSession ? 'answering' : 'init')
  const [currentDocIndex, setCurrentDocIndex] = useState(initialSession?.current_document_index ?? 0)
  const [questionIndex, setQuestionIndex] = useState(initialSession?.current_question_index ?? 0)
  const [currentPhaseId, setCurrentPhaseId] = useState<string | null>(
    (initialPhases as PhaseItem[]).find(p => p.status === 'en_progreso')?.id ?? null
  )
  const [userInput, setUserInput] = useState('')
  const [dual, setDual] = useState<DualResult | null>(null)
  const [founderResponse, setFounderResponse] = useState('')
  const [showFounderInput, setShowFounderInput] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phaseCompletedName, setPhaseCompletedName] = useState<string | null>(null)
  const [showExitModal, setShowExitModal] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  // section_title → draft text for live preview
  const [sectionDrafts, setSectionDrafts] = useState<Record<string, string>>({})

  // Derived
  const currentPhase = phases.find(p => p.id === currentPhaseId) ?? phases.find(p => p.phase_index === currentDocIndex)
  const currentDoc = documents[currentDocIndex]
  const currentQuestion: QuestionItem | null = currentPhase?.questions?.[questionIndex] ?? null
  const totalQuestions = currentPhase?.questions?.length ?? 0
  const compositionSections = currentDoc?.composition?.sections ?? []
  const advisorsNeeded = currentDoc?.composition?.advisors_needed ?? []

  // Section → question range mapping
  function getSectionForQuestion(idx: number) {
    let count = 0
    for (let i = 0; i < compositionSections.length; i++) {
      const sec = compositionSections[i]
      const secLen = sec.questions?.length ?? 0
      if (idx < count + secLen) {
        return { section: sec, sectionIndex: i, localIndex: idx - count }
      }
      count += secLen
    }
    return null
  }

  function getSectionStatus(sectionIdx: number): 'completada' | 'en_progreso' | 'pendiente' {
    if (currentPhase?.status === 'completada') return 'completada'
    let before = 0
    for (let i = 0; i < sectionIdx; i++) before += compositionSections[i]?.questions?.length ?? 0
    const end = before + (compositionSections[sectionIdx]?.questions?.length ?? 0) - 1
    if (questionIndex > end) return 'completada'
    if (questionIndex >= before) return 'en_progreso'
    return 'pendiente'
  }

  const currentSectionInfo = getSectionForQuestion(questionIndex)

  // Highlight advisors relevant to this deliverable
  const relevantAdvisors =
    advisorsNeeded.length > 0
      ? advisors.filter(a =>
          advisorsNeeded.some(needed =>
            a.specialty?.toLowerCase().includes(needed.toLowerCase())
          )
        )
      : advisors

  const constructivo = cofounders.find(c => c.role === 'constructivo')
  const critico = cofounders.find(c => c.role === 'critico')

  // Prevent accidental browser close/refresh during active session
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (session?.status === 'activa') {
        e.preventDefault()
        e.returnValue = '¿Seguro que quieres salir? Tu progreso se guardará pero la sesión quedará pausada.'
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [session?.status])

  function handleNavigation(path: string) {
    if (session?.status === 'activa') {
      setPendingNavigation(path)
      setShowExitModal(true)
    } else {
      router.push(path)
    }
  }

  function confirmExit() {
    setShowExitModal(false)
    if (pendingNavigation) router.push(pendingNavigation)
  }

  // ─── Handlers ─────────────────────────────────────────────────────────────

  async function handleStart() {
    setUiState('starting')
    setError(null)
    try {
      const res = await safeFetch('/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: project.id }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error iniciando sesión'); setUiState('init'); return }

      setSession(data.session)
      const newPhases = data.phases as PhaseItem[]
      setPhases(newPhases)
      setCurrentDocIndex(0)
      setQuestionIndex(0)
      setCurrentPhaseId(newPhases[0]?.id ?? null)
      setUiState('answering')
      setTimeout(() => inputRef.current?.focus(), 100)
    } catch {
      setError('Error iniciando la sesión. Inténtalo de nuevo.')
      setUiState('init')
    }
  }

  async function handleSubmitAnswer() {
    if (!userInput.trim() || !session || !currentPhaseId) return
    setUiState('submitting')
    setError(null)
    try {
      const res = await safeFetch('/api/session/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.id,
          phase_id: currentPhaseId,
          question_index: questionIndex,
          user_response: userInput,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error procesando respuesta'); setUiState('answering'); return }

      const d = data.dual as DualResult
      setDual(d)

      if (d.section_draft && currentQuestion?.section_title) {
        setSectionDrafts(prev => ({ ...prev, [currentQuestion.section_title]: d.section_draft }))
      }

      setUiState('debate_ready')
    } catch {
      setError('Error procesando tu respuesta. Inténtalo de nuevo.')
      setUiState('answering')
    }
  }

  async function handleResolve(
    resolution: 'constructiva' | 'critico' | 'responder_yo' | 'acuerdo',
    founderResp?: string
  ) {
    if (!dual || !session || !currentPhaseId) return
    setUiState('resolving')
    setError(null)
    try {
      const res = await safeFetch('/api/session/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.id,
          phase_id: currentPhaseId,
          dual_response_id: dual.dual_response_id,
          resolution,
          founder_response:
            founderResp ?? (resolution === 'responder_yo' ? founderResponse : undefined),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error registrando resolución'); setUiState('debate_ready'); return }

      setDual(null)
      setFounderResponse('')
      setShowFounderInput(false)

      if (data.session_complete) {
        setUiState('session_complete')
        return
      }

      if (data.phase_complete) {
        setPhaseCompletedName(currentDoc?.name ?? '')
        setPhases(prev => prev.map(p => p.id === currentPhaseId ? { ...p, status: 'completada' } : p))
        setUiState('phase_complete')
        return
      }

      const nextIdx = dual.next_question_index
      if (nextIdx !== null) {
        setQuestionIndex(nextIdx)
        setSession(s => s ? { ...s, current_question_index: nextIdx } : s)
      }
      setUserInput('')
      setUiState('answering')
      setTimeout(() => inputRef.current?.focus(), 100)
    } catch {
      setError('Error registrando resolución. Inténtalo de nuevo.')
      setUiState('debate_ready')
    }
  }

  // Auto-resolve for autopiloto + levantar_mano
  useEffect(() => {
    if (uiState !== 'debate_ready' || !dual) return
    if (mode === 'autopiloto') {
      const t = setTimeout(() => handleResolve(dual.agreement ? 'acuerdo' : 'constructiva'), 1800)
      return () => clearTimeout(t)
    }
    if (mode === 'levantar_mano') {
      const t = setTimeout(() => handleResolve('responder_yo', userInput), 1800)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiState, dual, mode])

  // Advance to next phase after celebration
  useEffect(() => {
    if (uiState !== 'phase_complete') return
    const t = setTimeout(() => {
      const nextDocIdx = currentDocIndex + 1
      const nextPhase = phases.find(p => p.phase_index === nextDocIdx)
      if (nextPhase) {
        setCurrentDocIndex(nextDocIdx)
        setCurrentPhaseId(nextPhase.id)
        setQuestionIndex(0)
        setPhases(prev =>
          prev.map(p => p.id === nextPhase.id ? { ...p, status: 'en_progreso' } : p)
        )
        setSectionDrafts({})
        setPhaseCompletedName(null)
        setUserInput('')
        setSession(s => s ? { ...s, current_document_index: nextDocIdx, current_question_index: 0 } : s)
        setUiState('answering')
        setTimeout(() => inputRef.current?.focus(), 100)
      } else {
        setUiState('session_complete')
      }
    }, 2500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiState])

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-[#0A1128] overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="shrink-0 border-b border-[#1E2A4A] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleNavigation(`/project/${project.id}`)}
            className="text-[#8892A4] hover:text-white text-sm transition-colors"
          >
            ← {project.name}
          </button>
          <span className="text-[#1E2A4A]">|</span>
          <p className="text-sm text-[#8892A4]">Sesión de Consejo</p>
          {session && currentDoc && (
            <>
              <span className="text-[#1E2A4A]">·</span>
              <p className="text-sm text-white font-medium">{currentDoc.name}</p>
            </>
          )}
        </div>

        {/* Mode toggle */}
        {session && (
          <div className="flex gap-1 bg-[#0D1535] border border-[#1E2A4A] rounded-lg p-0.5">
            {(['normal', 'autopiloto', 'levantar_mano'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                  mode === m
                    ? 'bg-[#B8860B]/20 text-[#B8860B] border border-[#B8860B]/30'
                    : 'text-[#8892A4] hover:text-white'
                }`}
              >
                {m === 'normal' ? 'Normal' : m === 'autopiloto' ? 'Autopiloto' : 'Levantar Mano'}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left Sidebar: Fases (260px) ─────────────────────────────── */}
        <aside className="w-[260px] shrink-0 border-r border-[#1E2A4A] overflow-y-auto px-4 py-5 flex flex-col gap-4">
          {session ? (
            <>
              {/* General progress */}
              <div>
                <p className="text-[10px] text-[#B8860B] uppercase tracking-wider font-medium mb-1">
                  Progreso general
                </p>
                <p className="text-xs text-[#8892A4]">
                  Entregable{' '}
                  <span className="text-white font-medium">{currentDocIndex + 1}</span>{' '}
                  de {documents.length}
                </p>
                <div className="mt-2 w-full bg-[#1E2A4A] rounded-full h-1">
                  <div
                    className="bg-[#B8860B] h-1 rounded-full transition-all duration-500"
                    style={{ width: `${(currentDocIndex / Math.max(documents.length, 1)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Phase list */}
              <div className="space-y-2">
                {phases.map(phase => {
                  const doc = documents[phase.phase_index]
                  const isActive = phase.phase_index === currentDocIndex
                  const isDone = phase.status === 'completada'

                  return (
                    <div
                      key={phase.id}
                      className={`rounded-xl px-3 py-3 border transition-colors ${
                        isActive
                          ? 'bg-blue-500/5 border-blue-500/20'
                          : isDone
                          ? 'bg-green-500/5 border-green-500/15'
                          : 'bg-[#0D1535] border-[#1E2A4A] opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {isDone ? (
                          <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                            <span className="text-green-400 text-[8px] font-bold">✓</span>
                          </div>
                        ) : isActive ? (
                          <div className="w-4 h-4 rounded-full bg-blue-500/30 border border-blue-400/50 shrink-0 animate-pulse" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-[#1E2A4A] shrink-0" />
                        )}
                        <p
                          className={`text-xs font-medium truncate ${
                            isDone ? 'text-green-400' : isActive ? 'text-white' : 'text-[#8892A4]'
                          }`}
                        >
                          {doc?.name ?? `Entregable ${phase.phase_index + 1}`}
                        </p>
                      </div>

                      {isActive && doc?.key_question && (
                        <p className="text-[10px] text-[#8892A4] italic leading-relaxed pl-6">
                          {doc.key_question}
                        </p>
                      )}

                      {isActive && totalQuestions > 0 && (
                        <div className="mt-2 pl-6">
                          <p className="text-[9px] text-[#8892A4] mb-1">
                            Pregunta {questionIndex + 1} de {totalQuestions}
                          </p>
                          <div className="w-full bg-[#1E2A4A] rounded-full h-0.5">
                            <div
                              className="bg-blue-400/50 h-0.5 rounded-full transition-all"
                              style={{
                                width: `${(questionIndex / Math.max(totalQuestions, 1)) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] text-[#B8860B] uppercase tracking-wider font-medium">
                Entregables
              </p>
              {documents.map((doc, i) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-2 text-xs text-[#8892A4] bg-[#0D1535] border border-[#1E2A4A] rounded-lg px-3 py-2 opacity-50"
                >
                  <span className="text-[#B8860B]/60 shrink-0">{i + 1}.</span>
                  {doc.name}
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* ── Center: Main area (fill) ─────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* Error banner */}
          {error && (
            <div className="mx-6 mt-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 shrink-0">
              {error}
            </div>
          )}

          {/* ── init ── */}
          {uiState === 'init' && (
            <div className="flex-1 flex flex-col items-center justify-center px-8 space-y-6">
              <div className="w-14 h-14 rounded-full bg-[#B8860B]/20 border border-[#B8860B]/30 flex items-center justify-center text-[#B8860B] font-bold text-xl">
                N
              </div>
              <div className="text-center max-w-lg">
                <h2 className="text-xl font-semibold text-white mb-3">Sesión de Consejo</h2>
                <p className="text-sm text-[#8892A4] leading-relaxed">
                  Tu consejo está listo para trabajar. Vamos a producir{' '}
                  {documents.length} entregable{documents.length !== 1 ? 's' : ''}{' '}
                  estratégico{documents.length !== 1 ? 's' : ''} juntos.
                </p>
              </div>
              {documents.length > 0 && (
                <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl px-5 py-4 w-full max-w-md space-y-2">
                  <p className="text-[10px] text-[#B8860B] uppercase tracking-wider font-medium mb-2">
                    Documentos a construir
                  </p>
                  {documents.map((doc, i) => (
                    <div key={doc.id} className="flex items-start gap-2 text-sm text-[#8892A4]">
                      <span className="text-[#B8860B]/60 text-xs mt-0.5 shrink-0">{i + 1}.</span>
                      <div>
                        <p>{doc.name}</p>
                        {doc.key_question && (
                          <p className="text-xs text-[#8892A4]/60 italic mt-0.5">{doc.key_question}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={handleStart}
                disabled={documents.length === 0}
                className="bg-[#B8860B] hover:bg-[#b8963f] text-[#0A1128] font-semibold text-sm px-8 py-3.5 rounded-xl transition-colors disabled:opacity-40"
              >
                Iniciar Sesión de Consejo →
              </button>
            </div>
          )}

          {/* ── starting ── */}
          {uiState === 'starting' && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-[#B8860B] border-t-transparent animate-spin mb-4" />
              <p className="text-sm text-[#8892A4]">Preparando tu sesión de consejo...</p>
            </div>
          )}

          {/* ── phase_complete celebration ── */}
          {uiState === 'phase_complete' && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 text-2xl animate-bounce">
                ✓
              </div>
              <div className="text-center">
                <p className="text-xs text-green-400 uppercase tracking-wider font-medium mb-2">
                  Entregable completado
                </p>
                <h3 className="text-lg font-semibold text-white">{phaseCompletedName}</h3>
                <p className="text-sm text-[#8892A4] mt-2">
                  Generando documento... preparando siguiente entregable
                </p>
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-[#B8860B] animate-bounce"
                    style={{ animationDelay: `${i * 0.12}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── session_complete ── */}
          {uiState === 'session_complete' && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-6 px-8">
              <div className="w-16 h-16 rounded-full bg-[#B8860B]/20 border border-[#B8860B]/30 flex items-center justify-center text-[#B8860B] text-2xl">
                ★
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-white mb-2">
                  Sesión de Consejo completada
                </h2>
                <p className="text-sm text-[#8892A4]">
                  Todos los entregables han sido generados con tu consejo IA.
                </p>
              </div>
              <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl px-5 py-4 w-full max-w-md">
                <p className="text-[10px] text-[#B8860B] uppercase tracking-wider font-medium mb-3">
                  Entregables generados
                </p>
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center gap-2 text-sm text-[#8892A4] mb-1.5">
                    <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                      <span className="text-green-400 text-[8px]">✓</span>
                    </div>
                    {doc.name}
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push(`/project/${project.id}/export`)}
                  className="bg-[#B8860B] hover:bg-[#b8963f] text-[#0A1128] font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
                >
                  Ver en Export Center →
                </button>
                <button
                  onClick={() => handleNavigation(`/project/${project.id}`)}
                  className="text-sm text-[#8892A4] border border-[#1E2A4A] px-6 py-3 rounded-xl hover:text-white transition-colors"
                >
                  Volver al proyecto
                </button>
              </div>
            </div>
          )}

          {/* ── Active session states ── */}
          {(uiState === 'answering' ||
            uiState === 'submitting' ||
            uiState === 'debate_ready' ||
            uiState === 'resolving') && (
            <div className="flex-1 flex flex-col overflow-hidden">

              {/* Phase header */}
              <div className="shrink-0 px-8 pt-5 pb-3 border-b border-[#1E2A4A]/50">
                <h2 className="text-base font-semibold text-white">{currentDoc?.name}</h2>
                {currentDoc?.key_question && (
                  <p className="text-sm text-[#8892A4] italic mt-1">{currentDoc.key_question}</p>
                )}
                {currentSectionInfo && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-[#B8860B] uppercase tracking-wider font-medium">
                      Sección {currentSectionInfo.sectionIndex + 1} de {compositionSections.length}
                    </span>
                    <span className="text-[#1E2A4A]">·</span>
                    <span className="text-[10px] text-[#8892A4]">
                      {currentSectionInfo.section.title}
                    </span>
                  </div>
                )}
              </div>

              {/* Chat scroll area */}
              <div className="flex-1 overflow-y-auto px-8 py-5 space-y-5">

                {/* Nexo question bubble */}
                {currentQuestion && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#B8860B]/20 border border-[#B8860B]/30 flex items-center justify-center text-[#B8860B] text-xs font-bold shrink-0 mt-0.5">
                      N
                    </div>
                    <div className="max-w-[75%] bg-[#0D1535] border border-[#1E2A4A] rounded-2xl rounded-tl-sm px-5 py-4">
                      <p className="text-[9px] text-[#B8860B] uppercase tracking-wider font-medium mb-2">
                        Pregunta {questionIndex + 1} de {totalQuestions}
                      </p>
                      <p className="text-sm text-white font-medium leading-relaxed">
                        {currentQuestion.question}
                      </p>
                    </div>
                  </div>
                )}

                {/* User answer bubble (after submit) */}
                {(uiState === 'submitting' || uiState === 'debate_ready' || uiState === 'resolving') &&
                  userInput && (
                    <div className="flex flex-row-reverse gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#B8860B]/30 flex items-center justify-center text-[#B8860B] text-xs font-bold shrink-0 mt-0.5">
                        {project.name?.charAt(0)?.toUpperCase() ?? 'F'}
                      </div>
                      <div className="max-w-[65%] bg-[#B8860B]/10 border border-[#B8860B]/20 rounded-2xl rounded-tr-sm px-5 py-4">
                        <p className="text-sm text-[#e0e0e5] leading-relaxed">{userInput}</p>
                      </div>
                    </div>
                  )}

                {/* Deliberating skeleton */}
                {uiState === 'submitting' && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#B8860B]/20 border border-[#B8860B]/30 flex items-center justify-center shrink-0 mt-0.5">
                      <div className="w-3 h-3 rounded-full border-2 border-[#B8860B] border-t-transparent animate-spin" />
                    </div>
                    <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-2xl rounded-tl-sm px-5 py-4 space-y-2">
                      <p className="text-xs text-[#8892A4] animate-pulse">
                        El consejo está deliberando...
                      </p>
                      <div className="flex gap-2">
                        <div className="h-2 bg-[#1E2A4A] rounded-full w-32 animate-pulse" />
                        <div className="h-2 bg-[#1E2A4A] rounded-full w-20 animate-pulse" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-2 bg-[#1E2A4A] rounded-full w-24 animate-pulse" />
                        <div className="h-2 bg-[#1E2A4A] rounded-full w-28 animate-pulse" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Nexo Dual result */}
                {(uiState === 'debate_ready' || uiState === 'resolving') && dual && (
                  <div className="space-y-4">

                    {/* Auto-mode indicator */}
                    {mode !== 'normal' && uiState === 'debate_ready' && (
                      <div className="flex items-center gap-2 text-xs text-[#8892A4]">
                        <div className="w-3 h-3 rounded-full border-2 border-[#B8860B] border-t-transparent animate-spin shrink-0" />
                        {mode === 'autopiloto'
                          ? 'Autopiloto: resolviendo automáticamente...'
                          : 'Registrando tu perspectiva directamente...'}
                      </div>
                    )}

                    {/* Agreement: single card */}
                    {dual.agreement ? (
                      <div className="bg-[#0D1535] border border-green-500/25 rounded-xl px-5 py-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-[9px] font-bold">
                            ✓
                          </div>
                          <p className="text-xs text-green-400 font-medium uppercase tracking-wider">
                            Acuerdo del Consejo
                          </p>
                        </div>
                        <p className="text-sm text-[#e0e0e5] leading-relaxed">
                          {dual.constructive_content}
                        </p>
                      </div>
                    ) : (
                      /* Disagreement: two cards */
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#0D1535] border border-green-500/20 rounded-xl px-5 py-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-[9px] font-bold shrink-0">
                              {constructivo?.name?.charAt(0) ?? 'C'}
                            </div>
                            <div>
                              <p className="text-xs text-green-400 font-medium">
                                {constructivo?.name ?? 'Nexo Constructivo'}
                              </p>
                              <p className="text-[9px] text-[#8892A4]">Propuesta optimista</p>
                            </div>
                          </div>
                          <p className="text-sm text-[#e0e0e5] leading-relaxed">
                            {dual.constructive_content}
                          </p>
                        </div>

                        <div className="bg-[#0D1535] border border-red-500/20 rounded-xl px-5 py-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-[9px] font-bold shrink-0">
                              {critico?.name?.charAt(0) ?? 'C'}
                            </div>
                            <div>
                              <p className="text-xs text-red-400 font-medium">
                                {critico?.name ?? 'Nexo Crítico'}
                              </p>
                              <p className="text-[9px] text-[#8892A4]">Perspectiva crítica</p>
                            </div>
                          </div>
                          <p className="text-sm text-[#e0e0e5] leading-relaxed">
                            {dual.critical_content}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Advisor contributions */}
                    {dual.advisor_contributions?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {dual.advisor_contributions.map((c, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 bg-[#1E2A4A] border border-[#1E2A4A] rounded-lg px-3 py-2 max-w-xs"
                          >
                            <div className="w-5 h-5 rounded-full bg-[#B8860B]/20 border border-[#B8860B]/30 flex items-center justify-center text-[#B8860B] text-[8px] font-bold shrink-0">
                              {c.advisor_name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[9px] text-[#B8860B] font-medium truncate">
                                {c.advisor_name}
                              </p>
                              <p className="text-[9px] text-[#8892A4] truncate">{c.comment}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Resolution buttons — normal mode only */}
                    {mode === 'normal' && uiState === 'debate_ready' && (
                      <div className="space-y-2 pt-1">
                        {dual.agreement ? (
                          <button
                            onClick={() => handleResolve('acuerdo')}
                            className="w-full bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 text-sm py-3 rounded-xl transition-colors"
                          >
                            Aceptar propuesta del consejo →
                          </button>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => handleResolve('constructiva')}
                              className="bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 text-sm py-3 rounded-xl transition-colors"
                            >
                              Ir con constructiva
                            </button>
                            <button
                              onClick={() => handleResolve('critico')}
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-sm py-3 rounded-xl transition-colors"
                            >
                              Ir con crítica
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => setShowFounderInput(v => !v)}
                          className="w-full text-sm text-[#8892A4] border border-[#1E2A4A] py-2.5 rounded-xl hover:text-white transition-colors"
                        >
                          ✋ Responder yo mismo
                        </button>
                        {showFounderInput && (
                          <div className="space-y-2">
                            <textarea
                              value={founderResponse}
                              onChange={e => setFounderResponse(e.target.value)}
                              rows={3}
                              placeholder="Tu perspectiva directa..."
                              className="w-full bg-[#0A1128] border border-[#1E2A4A] rounded-xl px-4 py-3 text-sm text-[#e0e0e5] placeholder-[#8892A4] resize-none focus:outline-none focus:border-[#B8860B]/50"
                            />
                            <button
                              onClick={() => handleResolve('responder_yo', founderResponse)}
                              disabled={!founderResponse.trim()}
                              className="w-full bg-[#B8860B]/20 hover:bg-[#B8860B]/30 text-[#B8860B] border border-[#B8860B]/30 text-sm py-3 rounded-xl transition-colors disabled:opacity-40"
                            >
                              Enviar mi perspectiva →
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Resolving state */}
                    {uiState === 'resolving' && (
                      <div className="flex items-center gap-2 text-sm text-[#8892A4] pt-1">
                        <div className="w-4 h-4 rounded-full border-2 border-[#B8860B] border-t-transparent animate-spin shrink-0" />
                        Registrando tu decisión...
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Answer input — only in 'answering' state */}
              {uiState === 'answering' && currentQuestion && (
                <div className="shrink-0 border-t border-[#1E2A4A] px-8 py-4">
                  <textarea
                    ref={inputRef}
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && userInput.trim()) {
                        handleSubmitAnswer()
                      }
                    }}
                    rows={3}
                    placeholder="Tu perspectiva sobre esta pregunta... (Cmd+Enter para enviar)"
                    className="w-full bg-[#0D1535] border border-[#1E2A4A] rounded-xl px-4 py-3 text-sm text-[#e0e0e5] placeholder-[#8892A4] resize-none focus:outline-none focus:border-[#B8860B]/50 mb-3"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-[#8892A4]">
                      {mode === 'autopiloto' && '🚀 Autopiloto: el consejo resolverá automáticamente'}
                      {mode === 'levantar_mano' &&
                        '✋ Tu perspectiva se tomará directamente como resolución'}
                      {mode === 'normal' && 'El consejo debatirá tu respuesta antes de resolver'}
                    </p>
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={!userInput.trim()}
                      className="bg-[#B8860B] hover:bg-[#b8963f] text-[#0A1128] font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors disabled:opacity-40"
                    >
                      Enviar →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* ── Right Sidebar: Advisors + Sections + Preview (280px) ────── */}
        <aside className="w-[280px] shrink-0 border-l border-[#1E2A4A] overflow-y-auto px-4 py-5 flex flex-col gap-5">

          {/* Active advisors */}
          <div>
            <p className="text-[10px] text-[#B8860B] uppercase tracking-wider font-medium mb-3">
              Consejeros activos
            </p>
            {(relevantAdvisors.length > 0 ? relevantAdvisors : advisors).slice(0, 4).map(advisor => (
              <div key={advisor.id} className="flex items-center gap-2 mb-2.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                    relevantAdvisors.includes(advisor)
                      ? 'bg-[#B8860B]/20 border border-[#B8860B]/40 text-[#B8860B]'
                      : 'bg-[#1E2A4A] text-[#8892A4]'
                  }`}
                >
                  {advisor.name
                    .split(' ')
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-[#e0e0e5] truncate leading-tight">{advisor.name}</p>
                  <p className="text-[9px] text-[#8892A4] truncate">{advisor.specialty}</p>
                </div>
              </div>
            ))}

            {(constructivo || critico) && (
              <div className="mt-3 pt-3 border-t border-[#1E2A4A]">
                <p className="text-[9px] text-[#8892A4] uppercase tracking-wider mb-2">
                  Cofounders
                </p>
                {[constructivo, critico].filter(Boolean).map(
                  cf =>
                    cf && (
                      <div key={cf.id} className="flex items-center gap-2 mb-1.5">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${
                            cf.role === 'constructivo'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {cf.name.charAt(0)}
                        </div>
                        <p
                          className={`text-[9px] font-medium ${
                            cf.role === 'constructivo' ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {cf.name}
                        </p>
                      </div>
                    )
                )}
              </div>
            )}
          </div>

          {/* Sections of current deliverable */}
          {session && compositionSections.length > 0 && (
            <div>
              <p className="text-[10px] text-[#B8860B] uppercase tracking-wider font-medium mb-3">
                Secciones del entregable
              </p>
              <div className="space-y-1.5">
                {compositionSections.map((sec, i) => {
                  const status = getSectionStatus(i)
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] border ${
                        status === 'completada'
                          ? 'bg-green-500/5 border-green-500/15 text-green-400'
                          : status === 'en_progreso'
                          ? 'bg-blue-500/5 border-blue-500/15 text-[#e0e0e5]'
                          : 'bg-[#0D1535] border-[#1E2A4A] text-[#8892A4]/60'
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] shrink-0 font-bold ${
                          status === 'completada'
                            ? 'bg-green-500/20 text-green-400'
                            : status === 'en_progreso'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'border border-[#1E2A4A]'
                        }`}
                      >
                        {status === 'completada' ? '✓' : i + 1}
                      </span>
                      <span className="truncate">{sec.title}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Live document preview */}
          {session && Object.keys(sectionDrafts).length > 0 && (
            <div>
              <p className="text-[10px] text-[#B8860B] uppercase tracking-wider font-medium mb-3">
                Preview en construcción
              </p>
              <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl overflow-hidden">
                {Object.entries(sectionDrafts).map(([title, draft], i) => (
                  <details
                    key={i}
                    className={`group ${i > 0 ? 'border-t border-[#1E2A4A]' : ''}`}
                  >
                    <summary className="px-3 py-2.5 flex items-center gap-2 cursor-pointer list-none hover:bg-[#1E2A4A]/30 transition-colors">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/30 border border-green-500/50 shrink-0" />
                      <p className="text-[9px] text-[#e0e0e5] flex-1 truncate">{title}</p>
                      <span className="text-[8px] text-[#8892A4] shrink-0 group-open:hidden">▸</span>
                      <span className="text-[8px] text-[#8892A4] shrink-0 hidden group-open:inline">▾</span>
                    </summary>
                    <div className="px-3 pb-3">
                      <p className="text-[9px] text-[#8892A4] leading-relaxed">
                        {draft.length > 220 ? draft.slice(0, 220) + '...' : draft}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ── Exit confirmation modal ──────────────────────────────────── */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-2xl px-8 py-7 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-white font-semibold text-lg mb-2">
              ¿Salir de la Sesión de Consejo?
            </h2>
            <p className="text-sm text-[#8892A4] leading-relaxed mb-6">
              Tu progreso está guardado. Puedes retomar la sesión cuando quieras desde la página del proyecto.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 bg-[#B8860B] hover:bg-[#b8963f] text-[#0A1128] font-semibold text-sm py-3 rounded-xl transition-colors"
              >
                Continuar sesión
              </button>
              <button
                onClick={confirmExit}
                className="flex-1 text-sm text-[#8892A4] border border-[#1E2A4A] py-3 rounded-xl hover:text-white hover:border-[#8892A4] transition-colors"
              >
                Salir y guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
