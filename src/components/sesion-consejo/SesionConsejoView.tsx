'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Project, Advisor, Cofounder } from '@/lib/types'
import DocumentPreview, { type DocumentSection } from './DocumentPreview'
import ReactMarkdown from 'react-markdown'

interface Document {
  id: string
  name: string
  status: string
  document_specs?: { strategic_decision?: string; sections?: { nombre: string; descripcion: string }[] }
}

interface Phase {
  id: string
  session_id: string
  document_id: string
  phase_index: number
  status: 'pendiente' | 'en_progreso' | 'completada'
  questions: { pregunta: string; resolucion: string | null }[]
  momentum: { total_questions: number; resolved: number; constructivo_count: number; critico_count: number }
}

interface Session {
  id: string
  status: 'activa' | 'completada' | 'pausada'
  mode: 'normal' | 'autopiloto' | 'levantar_mano'
  current_document_index: number
  current_question_index: number
  total_documents: number
}

interface AdvisorResponse {
  advisor_name: string
  specialty: string
  content: string
  hat: string
}

interface Debate {
  responseId: string
  constructive: string
  critical: string
  agreement: boolean
  synthesis: string | null
  advisor_responses?: AdvisorResponse[]
}

type UIState = 'init' | 'starting' | 'question_ready' | 'debating' | 'debate_ready' | 'resolving' | 'awaiting_approval' | 'session_complete'
type Mode = 'normal' | 'autopiloto' | 'levantar_mano'

const LEVEL_LABELS: Record<string, string> = { lidera: 'LIDERA', apoya: 'APOYA', observa: 'OBSERVA' }
const LEVEL_COLORS: Record<string, string> = {
  lidera: 'bg-[#B8860B]/20 text-[#B8860B] border-[#B8860B]/30',
  apoya: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  observa: 'bg-[#1E2A4A] text-[#8892A4] border-[#1E2A4A]',
}

interface Props {
  project: Project
  advisors: Advisor[]
  cofounders: Cofounder[]
  documents: unknown[]
  initialSession: Session | null
  initialPhases: unknown[]
}

export default function SesionConsejoView({ project, advisors, cofounders, documents, initialSession, initialPhases }: Props) {
  const router = useRouter()
  const docs = documents as Document[]
  const [session, setSession] = useState<Session | null>(initialSession)
  const [phases, setPhases] = useState<Phase[]>(initialPhases as Phase[])
  const [uiState, setUiState] = useState<UIState>(initialSession ? 'question_ready' : 'init')
  const [mode, setMode] = useState<Mode>('normal')
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(() => {
    if (initialSession && initialPhases.length > 0) {
      const phase = (initialPhases as Phase[]).find(p => p.status === 'en_progreso')
      const qi = initialSession.current_question_index
      return phase?.questions?.[qi]?.pregunta ?? null
    }
    return null
  })
  const [questionIndex, setQuestionIndex] = useState(initialSession?.current_question_index ?? 0)
  const [totalQuestions, setTotalQuestions] = useState(() => {
    if (initialPhases.length > 0) {
      const phase = (initialPhases as Phase[]).find(p => p.status === 'en_progreso')
      return phase?.questions?.length ?? 0
    }
    return 0
  })
  const [currentDocIndex, setCurrentDocIndex] = useState(initialSession?.current_document_index ?? 0)
  const [currentPhaseId, setCurrentPhaseId] = useState<string | null>(() => {
    return (initialPhases as Phase[]).find(p => p.status === 'en_progreso')?.id ?? null
  })
  const [debate, setDebate] = useState<Debate | null>(null)
  const [founderInput, setFounderInput] = useState('')
  const [resolvedList, setResolvedList] = useState<{ question: string; resolution: string }[]>([])
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Document sections state: docId → DocumentSection[]
  const [documentSections, setDocumentSections] = useState<Record<string, DocumentSection[]>>({})
  const [isGeneratingSection, setIsGeneratingSection] = useState(false)

  // Approval state
  const [pendingApprovalDocId, setPendingApprovalDocId] = useState<string | null>(null)
  const [pendingApprovalPhaseIndex, setPendingApprovalPhaseIndex] = useState<number | null>(null)
  const [isApproving, setIsApproving] = useState(false)

  // Local momentum state (updated on each resolve without waiting for DB)
  const [localMomentum, setLocalMomentum] = useState<{ resolved: number; constructivo_count: number; critico_count: number } | null>(null)

  // Revision state
  const [showRevisionInput, setShowRevisionInput] = useState(false)
  const [revisionSection, setRevisionSection] = useState('')

  const currentDoc = docs[currentDocIndex]
  const currentDocName = currentDoc?.name ?? ''
  const currentDocId = currentDoc?.id ?? ''
  const currentSpecSections = currentDoc?.document_specs?.sections ?? []

  function addSection(docId: string, section: DocumentSection) {
    setDocumentSections(prev => {
      const existing = prev[docId] ?? []
      const idx = existing.findIndex(s => s.section_name === section.section_name)
      if (idx >= 0) {
        const updated = [...existing]
        updated[idx] = section
        return { ...prev, [docId]: updated }
      }
      return { ...prev, [docId]: [...existing, section] }
    })
  }

  async function handleStart() {
    setUiState('starting')
    setError(null)
    try {
      const res = await fetch('/api/session/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', projectId: project.id }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setUiState('init'); return }
      setSession(data.session)
      setPhases(data.phases)
      setCurrentQuestion(data.currentQuestion)
      setQuestionIndex(0)
      setTotalQuestions(data.totalQuestions)
      setCurrentDocIndex(0)
      setCurrentPhaseId(data.phases?.find((p: Phase) => p.status === 'en_progreso')?.id ?? null)
      setUiState('question_ready')
    } catch {
      setError('Error iniciando la sesión. Inténtalo de nuevo.')
      setUiState('init')
    }
  }

  async function handleRunDebate() {
    if (!currentQuestion || !session || !currentPhaseId) return
    setUiState('debating')
    setError(null)
    try {
      const res = await fetch('/api/session/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'debate',
          projectId: project.id,
          phaseId: currentPhaseId,
          questionIndex,
          question: currentQuestion,
          founderBrief: project.founder_brief,
          documentName: currentDocName,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setUiState('question_ready'); return }
      setDebate(data)
      setUiState('debate_ready')
    } catch {
      setError('Error generando el debate. Inténtalo de nuevo.')
      setUiState('question_ready')
    }
  }

  async function handleResolve(resolution: 'constructiva' | 'critico' | 'responder_yo' | 'acuerdo' | 'find_common_ground') {
    if (!debate || !session || !currentPhaseId) return
    setUiState('resolving')
    setIsGeneratingSection(true)
    setError(null)
    try {
      const res = await fetch('/api/session/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve',
          projectId: project.id,
          sessionId: session.id,
          phaseId: currentPhaseId,
          responseId: debate.responseId,
          questionIndex,
          resolution,
          founderResponse: resolution === 'responder_yo' ? founderInput : undefined,
          constructiveContent: debate.constructive,
          criticalContent: debate.critical,
          synthesis: debate.synthesis,
          question: currentQuestion,
          documentId: currentDocId,
          documentName: currentDocName,
          specSections: currentSpecSections,
          previousSections: documentSections[currentDocId] ?? [],
          founderBrief: project.founder_brief,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setUiState('debate_ready'); setIsGeneratingSection(false); return }

      setIsGeneratingSection(false)

      // Add generated section to preview
      if (data.generatedSection) {
        addSection(currentDocId, data.generatedSection)
      }

      // Update local momentum immediately (Fix 7)
      setLocalMomentum(prev => {
        const base = prev ?? { resolved: 0, constructivo_count: 0, critico_count: 0 }
        return {
          resolved: base.resolved + 1,
          constructivo_count: ['constructiva', 'acuerdo', 'find_common_ground'].includes(resolution)
            ? base.constructivo_count + 1 : base.constructivo_count,
          critico_count: ['critico', 'find_common_ground'].includes(resolution)
            ? base.critico_count + 1 : base.critico_count,
        }
      })

      setResolvedList(prev => [...prev, { question: currentQuestion ?? '', resolution }])
      setDebate(null)
      setFounderInput('')

      if (data.phaseComplete) {
        setPendingApprovalDocId(data.documentId ?? currentDocId)
        setPendingApprovalPhaseIndex(data.phaseIndex ?? currentDocIndex)
        setUiState('awaiting_approval')
        return
      }

      setCurrentQuestion(data.nextQuestion)
      setQuestionIndex(data.nextQuestionIndex)
      setSession(s => s ? { ...s, current_question_index: data.nextQuestionIndex } : s)
      setUiState('question_ready')
    } catch {
      setError('Error registrando resolución. Inténtalo de nuevo.')
      setUiState('debate_ready')
      setIsGeneratingSection(false)
    }
  }

  async function handleApprove() {
    if (!session || pendingApprovalDocId === null || pendingApprovalPhaseIndex === null) return
    setIsApproving(true)
    setError(null)
    try {
      const res = await fetch('/api/session/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          projectId: project.id,
          sessionId: session.id,
          documentId: pendingApprovalDocId,
          phaseIndex: pendingApprovalPhaseIndex,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setIsApproving(false); return }

      setIsApproving(false)
      setPendingApprovalDocId(null)
      setPendingApprovalPhaseIndex(null)

      if (data.sessionComplete) {
        setUiState('session_complete')
        return
      }

      setCurrentDocIndex(data.nextDocumentIndex)
      setCurrentPhaseId(data.nextPhaseId)
      setCurrentQuestion(data.nextQuestion)
      setQuestionIndex(0)
      setTotalQuestions(data.totalQuestions)
      setSession(s => s ? { ...s, current_document_index: data.nextDocumentIndex, current_question_index: 0 } : s)
      setResolvedList([])
      setLocalMomentum(null)
      setUiState('question_ready')
    } catch {
      setError('Error aprobando el documento. Inténtalo de nuevo.')
      setIsApproving(false)
    }
  }

  async function handleRevision() {
    if (!revisionSection.trim()) return
    setShowRevisionInput(false)
    const sectionName = revisionSection.trim()
    setRevisionSection('')
    setCurrentQuestion(`Revisemos la sección "${sectionName}". ¿Qué aspectos deberían mejorarse, profundizarse o corregirse basándose en lo que ya hemos discutido?`)
    setUiState('question_ready')
  }

  const currentPhase = phases.find(p => p.id === currentPhaseId)
  const dbMomentum = currentPhase?.momentum ?? { total_questions: 0, resolved: 0, constructivo_count: 0, critico_count: 0 }
  const momentum = localMomentum
    ? { ...dbMomentum, resolved: localMomentum.resolved, constructivo_count: localMomentum.constructivo_count, critico_count: localMomentum.critico_count }
    : dbMomentum

  const grouped: Record<string, Advisor[]> = { lidera: [], apoya: [], observa: [] }
  for (const a of advisors) {
    if (grouped[a.level]) grouped[a.level].push(a)
  }
  const constructivo = cofounders.find(c => c.role === 'constructivo')
  const critico = cofounders.find(c => c.role === 'critico')

  return (
    <div className="h-screen flex flex-col bg-[#0A1128] overflow-hidden">
      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="shrink-0 border-b border-[#1E2A4A] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push(`/project/${project.id}`)} className="text-[#8892A4] hover:text-white text-sm transition-colors">
            ← {project.name}
          </button>
          <span className="text-[#1E2A4A]">|</span>
          {session && (
            <p className="text-sm text-[#e0e0e5]">
              Documento <span className="text-[#B8860B] font-medium">{currentDocIndex + 1}</span> de {docs.length}
              {currentDocName && <> · <span className="text-white font-medium">{currentDocName}</span></>}
              {uiState !== 'init' && totalQuestions > 0 && (
                <> · Pregunta <span className="text-[#B8860B]">{questionIndex + 1}</span> de {totalQuestions}</>
              )}
            </p>
          )}
          {!session && <p className="text-sm text-[#8892A4]">Sesión de Consejo</p>}
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

      {/* ── Body ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left Sidebar: El Consejo ─────────────────────────────── */}
        <aside className="w-56 shrink-0 border-r border-[#1E2A4A] overflow-y-auto px-4 py-5 space-y-5">
          <div>
            <p className="text-[10px] text-[#B8860B] uppercase tracking-wider font-medium mb-3">Tu Consejo</p>
            {(['lidera', 'apoya', 'observa'] as const).map(level => {
              if (!grouped[level]?.length) return null
              return (
                <div key={level} className="mb-4">
                  <p className="text-[9px] text-[#8892A4] uppercase tracking-wider mb-1.5">{LEVEL_LABELS[level]}</p>
                  {grouped[level].map(advisor => (
                    <div key={advisor.id} className="flex items-center gap-2 mb-1.5">
                      <div className="w-5 h-5 rounded-full bg-[#1E2A4A] flex items-center justify-center text-[8px] text-[#8892A4] shrink-0 font-medium">
                        {advisor.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-[#e0e0e5] truncate leading-tight">{advisor.name}</p>
                        <span className={`text-[8px] px-1 py-0.5 rounded border font-medium ${LEVEL_COLORS[level]}`}>
                          {LEVEL_LABELS[level]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>

          {(constructivo || critico) && (
            <div>
              <p className="text-[10px] text-[#B8860B] uppercase tracking-wider font-medium mb-3">Cofounders</p>
              {[constructivo, critico].filter(Boolean).map(cf => cf && (
                <div key={cf.id} className="flex items-center gap-2 mb-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] shrink-0 font-medium ${
                    cf.role === 'constructivo' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {cf.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <p className="text-[10px] text-[#e0e0e5] leading-tight">{cf.name}</p>
                    <p className={`text-[8px] font-medium ${cf.role === 'constructivo' ? 'text-green-400' : 'text-red-400'}`}>
                      {cf.role === 'constructivo' ? 'Constructivo' : 'Crítico'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* ── Center: Debate Area ────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-5">

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Init state — no session yet */}
          {uiState === 'init' && (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] space-y-6">
              <div className="text-center max-w-md">
                <div className="w-14 h-14 rounded-full bg-[#B8860B]/20 border border-[#B8860B]/30 flex items-center justify-center text-[#B8860B] font-bold text-xl mx-auto mb-4">N</div>
                <h2 className="text-xl font-semibold text-white mb-2">Sesión de Consejo</h2>
                <p className="text-sm text-[#8892A4] leading-relaxed">
                  Tu consejo está listo. Vamos a trabajar juntos para construir {docs.length > 0 ? `${docs.length} documento${docs.length !== 1 ? 's' : ''}` : 'tus documentos'} estratégicos.
                  El debate Constructivo vs Crítico te ayudará a tomar las mejores decisiones.
                </p>
              </div>
              {docs.length > 0 && (
                <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl px-5 py-4 w-full max-w-md space-y-1.5">
                  <p className="text-xs text-[#B8860B] uppercase tracking-wider font-medium mb-2">Documentos a construir</p>
                  {docs.map((doc, i) => (
                    <div key={doc.id} className="flex items-center gap-2 text-sm text-[#8892A4]">
                      <span className="text-xs w-4 text-[#B8860B]/60">{i + 1}.</span>
                      {doc.name}
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={handleStart}
                className="bg-[#B8860B] hover:bg-[#b8963f] text-[#0A1128] font-semibold text-sm px-8 py-3.5 rounded-xl transition-colors"
              >
                Iniciar Sesión de Consejo →
              </button>
            </div>
          )}

          {/* Starting */}
          {uiState === 'starting' && (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
              <div className="w-8 h-8 rounded-full border-2 border-[#B8860B] border-t-transparent animate-spin mb-4" />
              <p className="text-sm text-[#8892A4]">Preparando tu sesión de consejo...</p>
            </div>
          )}

          {/* Document awaiting approval */}
          {uiState === 'awaiting_approval' && (() => {
            const approvalSections = documentSections[pendingApprovalDocId ?? currentDocId] ?? []
            return (
              <div className="space-y-5">
                {/* Nexo message */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#B8860B]/20 border border-[#B8860B]/30 flex items-center justify-center text-[#B8860B] text-xs font-bold shrink-0 mt-1">N</div>
                  <div className="max-w-2xl bg-[#0D1535] border border-[#1E2A4A] rounded-2xl rounded-tl-sm px-5 py-4 text-sm text-[#e0e0e5] leading-relaxed">
                    El documento <strong>{currentDocName}</strong> ha sido generado con {approvalSections.length} sección{approvalSections.length !== 1 ? 'es' : ''}. Revísalo y apruébalo para continuar.
                  </div>
                </div>

                {/* Full document view */}
                <div className="bg-[#0D1535] border border-[#B8860B]/20 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#1E2A4A] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#B8860B]/20 border border-[#B8860B]/30 flex items-center justify-center text-[#B8860B] text-xs font-bold">
                      {currentDocIndex + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{currentDocName}</p>
                      <p className="text-xs text-[#8892A4]">{approvalSections.length} secciones generadas</p>
                    </div>
                  </div>
                  <div className="divide-y divide-[#1E2A4A]">
                    {approvalSections.map((section, i) => (
                      <div key={i} className="px-5 py-4">
                        <p className="text-xs text-[#B8860B] font-medium uppercase tracking-wider mb-2">{section.section_name}</p>
                        <p className="text-sm text-[#e0e0e5] leading-relaxed whitespace-pre-line">{section.content}</p>
                        {section.key_points?.length > 0 && (
                          <ul className="mt-3 space-y-1">
                            {section.key_points.map((point, pi) => (
                              <li key={pi} className="flex items-start gap-2 text-xs text-[#8892A4]">
                                <span className="text-[#B8860B] shrink-0 mt-0.5">•</span>
                                {point}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                    {approvalSections.length === 0 && (
                      <div className="px-5 py-6 text-center text-sm text-[#8892A4]">
                        Generando contenido del documento...
                      </div>
                    )}
                  </div>
                </div>

                {/* Approval CTA */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="flex-1 bg-[#B8860B] hover:bg-[#b8963f] text-[#0A1128] font-semibold text-sm py-3.5 rounded-xl transition-colors disabled:opacity-40"
                  >
                    {isApproving ? 'Aprobando...' : 'Aprobar documento →'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRevisionInput(v => !v)}
                    className="px-4 py-3 text-sm text-[#8892A4] border border-[#1E2A4A] rounded-xl hover:text-white hover:border-[#8892A4] transition-colors"
                  >
                    Pedir revisión
                  </button>
                </div>

                {/* Revision input (Fix 5) */}
                {showRevisionInput && (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={revisionSection}
                      onChange={e => setRevisionSection(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleRevision()}
                      placeholder="¿Qué sección revisar? (ej. Propuesta de Valor)"
                      className="flex-1 px-3 py-2 bg-[#0A1128] border border-[#1E2A4A] rounded-lg text-sm text-[#F8F8F8] placeholder-[#8892A4] focus:outline-none focus:border-[#B8860B]/50"
                    />
                    <button
                      type="button"
                      onClick={handleRevision}
                      disabled={!revisionSection.trim()}
                      className="px-3 py-2 bg-[#B8860B]/20 text-[#B8860B] border border-[#B8860B]/30 rounded-lg text-sm disabled:opacity-40 hover:bg-[#B8860B]/30 transition-colors"
                    >
                      →
                    </button>
                  </div>
                )}
              </div>
            )
          })()}

          {/* Session complete */}
          {uiState === 'session_complete' && (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] space-y-6">
              <div className="w-14 h-14 rounded-full bg-[#B8860B]/20 border border-[#B8860B]/30 flex items-center justify-center text-[#B8860B] text-2xl">★</div>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-white mb-2">Sesión de Consejo completada</h2>
                <p className="text-sm text-[#8892A4]">Todos los documentos han sido generados. Puedes revisarlos y exportarlos.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push(`/project/${project.id}/export`)}
                  className="bg-[#B8860B] hover:bg-[#b8963f] text-[#0A1128] font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
                >
                  Ver documentos →
                </button>
                <button
                  onClick={() => router.push(`/project/${project.id}`)}
                  className="text-sm text-[#8892A4] border border-[#1E2A4A] px-6 py-3 rounded-xl hover:text-white transition-colors"
                >
                  Ir al proyecto
                </button>
              </div>
            </div>
          )}

          {/* Active session states */}
          {(uiState === 'question_ready' || uiState === 'debating' || uiState === 'debate_ready' || uiState === 'resolving') && (
            <>
              {/* Nexo message intro */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#B8860B]/20 border border-[#B8860B]/30 flex items-center justify-center text-[#B8860B] text-xs font-bold shrink-0 mt-1">N</div>
                <div className="max-w-2xl bg-[#0D1535] border border-[#1E2A4A] rounded-2xl rounded-tl-sm px-5 py-4 text-sm text-[#e0e0e5] leading-relaxed">
                  {uiState === 'question_ready' && (
                    <>Pregunta {questionIndex + 1} de {totalQuestions} para construir <strong>{currentDocName}</strong>. El consejo va a debatir esta pregunta.</>
                  )}
                  {uiState === 'debating' && 'El consejo está debatiendo...'}
                  {uiState === 'debate_ready' && (
                    <>El consejo ha debatido. {debate?.agreement ? 'Llegaron a un acuerdo.' : 'Tienen posiciones distintas — elige la que mejor representa tu venture.'}</>
                  )}
                  {uiState === 'resolving' && 'Registrando tu decisión...'}
                </div>
              </div>

              {/* Current question card */}
              {currentQuestion && (
                <div className="bg-[#0D1535] border border-[#B8860B]/20 rounded-xl px-5 py-4">
                  <p className="text-[10px] text-[#B8860B] uppercase tracking-wider font-medium mb-2">Pregunta {questionIndex + 1} de {totalQuestions}</p>
                  <p className="text-base text-white font-medium leading-relaxed">{currentQuestion}</p>
                </div>
              )}

              {/* Advisor response cards (Fix 1) */}
              {(uiState === 'debate_ready' || uiState === 'resolving') && debate?.advisor_responses && debate.advisor_responses.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] text-[#8892A4] uppercase tracking-wider font-medium">Tu Consejo Opina</p>
                  {debate.advisor_responses.map((adv, i) => (
                    <div key={i} className="p-4 bg-[#0D1535] border border-[#1E2A4A] rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-[#1E2A4A] flex items-center justify-center text-[10px] text-[#B8860B] font-bold shrink-0">
                          {adv.advisor_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#F8F8F8] leading-tight">{adv.advisor_name}</p>
                          <p className="text-[10px] text-[#8892A4]">{adv.specialty}</p>
                        </div>
                      </div>
                      <div className="text-xs text-[#e0e0e5] prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{adv.content}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Debate cards */}
              {(uiState === 'debate_ready' || uiState === 'resolving') && debate && (
                <div className={debate.agreement ? 'space-y-4' : 'grid grid-cols-2 gap-4'}>
                  {debate.agreement && debate.synthesis ? (
                    /* Agreement — single synthesis card */
                    <div className="bg-[#0D1535] border border-green-500/30 rounded-xl px-5 py-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs font-bold">✓</div>
                        <p className="text-xs text-green-400 font-medium uppercase tracking-wider">Acuerdo del Consejo</p>
                      </div>
                      <div className="text-sm text-[#e0e0e5] prose prose-invert prose-sm max-w-none"><ReactMarkdown>{debate.synthesis}</ReactMarkdown></div>
                    </div>
                  ) : (
                    <>
                      {/* Constructivo */}
                      <div className="bg-[#0D1535] border border-green-500/20 rounded-xl px-5 py-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs font-bold shrink-0">
                            {constructivo?.name?.charAt(0) ?? 'C'}
                          </div>
                          <div>
                            <p className="text-xs text-green-400 font-medium">{constructivo?.name ?? 'Nexo Constructivo'}</p>
                            <span className="text-[9px] text-[#8892A4] bg-[#1E2A4A] px-1.5 rounded">Sombrero Amarillo</span>
                          </div>
                        </div>
                        <div className="text-sm text-[#e0e0e5] prose prose-invert prose-sm max-w-none"><ReactMarkdown>{debate.constructive}</ReactMarkdown></div>
                      </div>

                      {/* Crítico */}
                      <div className="bg-[#0D1535] border border-red-500/20 rounded-xl px-5 py-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-xs font-bold shrink-0">
                            {critico?.name?.charAt(0) ?? 'C'}
                          </div>
                          <div>
                            <p className="text-xs text-red-400 font-medium">{critico?.name ?? 'Nexo Crítico'}</p>
                            <span className="text-[9px] text-[#8892A4] bg-[#1E2A4A] px-1.5 rounded">Sombrero Negro</span>
                          </div>
                        </div>
                        <div className="text-sm text-[#e0e0e5] prose prose-invert prose-sm max-w-none"><ReactMarkdown>{debate.critical}</ReactMarkdown></div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Levantar mano — founder input */}
              {uiState === 'debate_ready' && mode === 'levantar_mano' && (
                <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl px-5 py-4">
                  <p className="text-xs text-[#B8860B] uppercase tracking-wider font-medium mb-2">Tu respuesta directa</p>
                  <textarea
                    ref={inputRef}
                    aria-label="Tu respuesta directa al consejo"
                    value={founderInput}
                    onChange={e => setFounderInput(e.target.value)}
                    rows={3}
                    placeholder="Responde directo al consejo..."
                    className="w-full bg-[#0A1128] border border-[#1E2A4A] rounded-lg px-3 py-2 text-sm text-[#e0e0e5] placeholder-[#8892A4] resize-none focus:outline-none focus:border-[#B8860B]/50"
                  />
                </div>
              )}
            </>
          )}

          {/* Resolved history */}
          {resolvedList.length > 0 && (uiState === 'question_ready' || uiState === 'debating' || uiState === 'debate_ready') && (
            <div>
              <p className="text-[10px] text-[#8892A4] uppercase tracking-wider font-medium mb-2">Preguntas anteriores</p>
              <div className="space-y-1.5">
                {resolvedList.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[#8892A4] bg-[#0D1535] border border-[#1E2A4A] rounded-lg px-3 py-2">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                      r.resolution === 'constructiva' || r.resolution === 'acuerdo' ? 'bg-green-500/20 text-green-400' :
                      r.resolution === 'critico' ? 'bg-red-500/20 text-red-400' :
                      'bg-[#1E2A4A] text-[#8892A4]'
                    }`}>✓</span>
                    <span className="truncate">{r.question}</span>
                    <span className="shrink-0 text-[#8892A4]/60 capitalize">{r.resolution}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* ── Right Sidebar: Controls + Progress ────────────────────── */}
        <aside className="w-60 shrink-0 border-l border-[#1E2A4A] overflow-y-auto px-4 py-5 space-y-5">

          {/* Action buttons */}
          {uiState === 'question_ready' && (
            <div className="space-y-2">
              <p className="text-[10px] text-[#B8860B] uppercase tracking-wider font-medium mb-3">Turno Activo</p>
              <button
                onClick={handleRunDebate}
                className="w-full bg-[#B8860B] hover:bg-[#b8963f] text-[#0A1128] font-semibold text-sm py-3 rounded-xl transition-colors"
              >
                Iniciar Debate →
              </button>
            </div>
          )}

          {uiState === 'debating' && (
            <div className="space-y-2">
              <p className="text-[10px] text-[#B8860B] uppercase tracking-wider font-medium mb-3">Debate</p>
              <div className="flex items-center gap-2 text-sm text-[#8892A4]">
                <div className="w-4 h-4 rounded-full border-2 border-[#B8860B] border-t-transparent animate-spin shrink-0" />
                Generando debate...
              </div>
            </div>
          )}

          {(uiState === 'debate_ready') && debate && (
            <div className="space-y-2">
              <p className="text-[10px] text-[#B8860B] uppercase tracking-wider font-medium mb-3">Elige una posición</p>

              {debate.agreement ? (
                <button
                  onClick={() => handleResolve('acuerdo')}
                  className="w-full bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 text-sm py-2.5 rounded-xl transition-colors"
                >
                  Aceptar acuerdo →
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleResolve('constructiva')}
                    className="w-full bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 text-sm py-2.5 rounded-xl transition-colors"
                  >
                    Elegir Constructiva
                  </button>
                  <button
                    onClick={() => handleResolve('critico')}
                    className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-sm py-2.5 rounded-xl transition-colors"
                  >
                    Elegir Crítico
                  </button>
                </>
              )}

              <button
                onClick={() => handleResolve('find_common_ground')}
                className="w-full text-sm text-[#B8860B] border border-[#B8860B]/30 py-2 rounded-xl hover:bg-[#B8860B]/10 transition-colors"
              >
                ⚖ Buscar punto medio
              </button>

              <button
                onClick={() => {
                  setMode('levantar_mano')
                  inputRef.current?.focus()
                }}
                className="w-full text-sm text-[#8892A4] border border-[#1E2A4A] py-2 rounded-xl hover:text-white transition-colors"
              >
                ✋ Responder yo
              </button>

              {mode === 'levantar_mano' && founderInput.trim() && (
                <button
                  onClick={() => handleResolve('responder_yo')}
                  className="w-full bg-[#B8860B]/20 hover:bg-[#B8860B]/30 text-[#B8860B] border border-[#B8860B]/30 text-sm py-2.5 rounded-xl transition-colors"
                >
                  Enviar respuesta →
                </button>
              )}
            </div>
          )}

          {uiState === 'resolving' && (
            <div className="flex items-center gap-2 text-sm text-[#8892A4]">
              <div className="w-4 h-4 rounded-full border-2 border-[#B8860B] border-t-transparent animate-spin shrink-0" />
              Guardando...
            </div>
          )}

          {/* Progress */}
          {session && uiState !== 'init' && (
            <div>
              <p className="text-[10px] text-[#B8860B] uppercase tracking-wider font-medium mb-3">Progreso</p>
              <div className="space-y-2">
                {docs.map((doc, i) => {
                  const phase = phases.find(p => p.phase_index === i)
                  const isActive = i === currentDocIndex
                  const isDone = phase?.status === 'completada'
                  const isPending = phase?.status === 'pendiente' || !phase

                  return (
                    <div key={doc.id} className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 border ${
                      isActive ? 'bg-[#B8860B]/10 border-[#B8860B]/30 text-[#e0e0e5]' :
                      isDone ? 'bg-green-500/5 border-green-500/20 text-[#8892A4]' :
                      'bg-[#0D1535] border-[#1E2A4A] text-[#8892A4]/60'
                    }`}>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${
                        isDone ? 'bg-green-500/20 text-green-400' :
                        isActive ? 'bg-[#B8860B]/20 text-[#B8860B]' :
                        'bg-[#1E2A4A] text-[#8892A4]/40'
                      }`}>
                        {isDone ? '✓' : i + 1}
                      </span>
                      <span className="truncate">{doc.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Momentum */}
          {session && momentum.total_questions > 0 && (
            <div>
              <p className="text-[10px] text-[#B8860B] uppercase tracking-wider font-medium mb-3">Momentum</p>
              <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl px-4 py-3 space-y-2">
                <div className="flex justify-between text-xs text-[#8892A4]">
                  <span>Resueltas</span>
                  <span className="text-[#e0e0e5]">{momentum.resolved} / {momentum.total_questions}</span>
                </div>
                <div className="w-full bg-[#1E2A4A] rounded-full h-1.5">
                  <div
                    className="bg-[#B8860B] h-1.5 rounded-full transition-all"
                    style={{ width: `${momentum.total_questions > 0 ? (momentum.resolved / momentum.total_questions) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#8892A4] mt-1">
                  <span className="text-green-400">✓ {momentum.constructivo_count} constructivas</span>
                  <span className="text-red-400">✗ {momentum.critico_count} críticas</span>
                </div>
              </div>
            </div>
          )}

          {/* Document Preview */}
          {session && uiState !== 'init' && uiState !== 'starting' && currentDoc && (
            <div>
              <p className="text-[10px] text-[#B8860B] uppercase tracking-wider font-medium mb-3">Preview en Vivo</p>
              <DocumentPreview
                documentName={currentDoc.name}
                sections={documentSections[currentDocId] ?? []}
                totalSections={Math.max(currentSpecSections.length, 3)}
                isGenerating={isGeneratingSection}
              />
              {(documentSections[currentDocId] ?? []).length > 0 && (
                <button
                  type="button"
                  onClick={() => router.push(`/project/${project.id}/documento/${currentDoc.id}`)}
                  className="mt-2 text-[10px] text-[#B8860B] hover:underline"
                >
                  Ver documento completo →
                </button>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
