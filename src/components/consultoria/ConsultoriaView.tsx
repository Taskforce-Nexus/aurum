'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { Project, Advisor, Cofounder } from '@/lib/types'
import { safeFetch } from '@/lib/fetch402'
import type { DocumentRef, Consultation, ConsultationMessage } from '@/app/(dashboard)/project/[id]/consultoria/page'

interface Props {
  project: Project
  advisors: Advisor[]
  cofounders: Cofounder[]
  documents: DocumentRef[]
  consultations: Consultation[]
  sessionCompleted: boolean
}

const QUICK_ACTIONS = [
  'Revisar pricing y modelo de ingresos',
  'Actualizar propuesta de valor',
  'Validar con buyer persona',
  'Analizar riesgos competitivos',
]

export default function ConsultoriaView({
  project,
  advisors,
  cofounders,
  documents,
  consultations: initialConsultations,
  sessionCompleted,
}: Props) {
  const isUnlocked = sessionCompleted

  const [consultations, setConsultations] = useState<Consultation[]>(initialConsultations)
  const [activeConsultation, setActiveConsultation] = useState<Consultation | null>(
    initialConsultations[0] ?? null
  )
  const [messages, setMessages] = useState<ConsultationMessage[]>(
    initialConsultations[0]?.messages ?? []
  )
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (!isUnlocked) {
    return (
      <LockedView project={project} />
    )
  }

  async function handleNewConsultation() {
    const res = await safeFetch('/api/consultation/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: project.id }),
    })
    if (!res.ok) return
    const data = await res.json()
    const newConsult: Consultation = data.consultation
    setConsultations(prev => [newConsult, ...prev])
    setActiveConsultation(newConsult)
    setMessages([])
  }

  function handleSelectConsultation(c: Consultation) {
    setActiveConsultation(c)
    setMessages(c.messages ?? [])
  }

  async function handleSend(text?: string) {
    const msg = text ?? input
    if (!msg.trim() || sending) return
    setInput('')
    setSending(true)

    const userMsg: ConsultationMessage = {
      role: 'user',
      content: msg,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])

    try {
      // Ensure we have an active consultation
      let consultId = activeConsultation?.id
      if (!consultId) {
        const startRes = await safeFetch('/api/consultation/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project_id: project.id }),
        })
        if (!startRes.ok) throw new Error('Failed to start')
        const startData = await startRes.json()
        consultId = startData.consultation.id
        setActiveConsultation(startData.consultation)
        setConsultations(prev => [startData.consultation, ...prev])
      }

      const res = await safeFetch('/api/consultation/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consultation_id: consultId, message: msg }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()

      // Flatten council messages into individual ChatBubble-compatible messages
      const flatMessages: ConsultationMessage[] = data.messages.flatMap(
        (m: { role: string; content: string; responses?: Array<{ role: string; content: string; advisor_id?: string; advisor_name?: string; specialty?: string }>; created_at: string }) => {
          if (m.role === 'user') {
            return [{ role: 'user' as const, content: m.content, timestamp: m.created_at }]
          }
          return (m.responses ?? []).map(r => ({
            role: r.role as 'nexo' | 'advisor',
            content: r.content,
            advisor_id: r.advisor_id,
            advisor_name: r.advisor_name,
            specialty: r.specialty,
            timestamp: m.created_at,
          }))
        }
      )
      setMessages(flatMessages)
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'nexo', content: 'Error al conectar con el consejo. Intenta de nuevo.', timestamp: new Date().toISOString() },
      ])
    } finally {
      setSending(false)
    }
  }

  const approvedDocs = documents.filter(d => d.status === 'aprobado' || d.status === 'generado')

  return (
    <div className="h-screen flex flex-col bg-[#0A1128]">
      {/* Nav */}
      <nav className="h-[60px] flex items-center justify-between px-6 border-b border-[#27282B] shrink-0 bg-[#0A1128]">
        <div className="flex items-center gap-2 text-[13px]">
          <Link href={`/project/${project.id}`} className="text-[#6E8EAD] hover:text-white transition-colors">
            {project.name}
          </Link>
          <span className="text-[#27282B]">/</span>
          <span className="text-white font-medium">Consultoría Activa</span>
        </div>
        <Link
          href={`/project/${project.id}`}
          className="text-[13px] text-[#6E8EAD] hover:text-white transition-colors"
        >
          → Proyecto
        </Link>
      </nav>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-[280px] flex flex-col bg-[#070E20] border-r border-[#27282B] shrink-0 overflow-y-auto">
          <div className="p-5 space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-[16px] text-white font-bold font-outfit">Tu Consejo</h2>
              <p className="text-[12px] text-[#6E8EAD]">{project.name}</p>
            </div>

            {/* Advisors */}
            <div className="space-y-2">
              <p className="text-[9px] text-[#B8860B] uppercase tracking-[2px] font-semibold">
                Consejeros disponibles
              </p>
              <div className="space-y-1">
                {advisors.map(a => (
                  <div key={a.id} className="flex items-center gap-2">
                    <span className="text-[#B8860B] text-[10px]">●</span>
                    <span className="text-[12px] text-[#8B9DB7] leading-relaxed">
                      {a.name} — {a.specialty ?? a.category}
                    </span>
                  </div>
                ))}
                {advisors.length === 0 && (
                  <p className="text-[12px] text-[#4A5568] italic">Sin consejeros configurados</p>
                )}
              </div>
            </div>

            {/* Cofounders */}
            {cofounders.length > 0 && (
              <div className="space-y-2">
                <p className="text-[9px] text-[#B8860B] uppercase tracking-[2px] font-semibold">
                  Cofounders
                </p>
                <div className="space-y-1">
                  {cofounders.map(c => (
                    <div key={c.id} className="flex items-center gap-2">
                      <span className="text-[#B8860B] text-[10px]">●</span>
                      <span className="text-[12px] text-[#8B9DB7]">
                        {c.name} — {c.role === 'constructivo' ? 'Constructiva' : 'Crítico'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Consultation history */}
            <div className="space-y-2">
              <p className="text-[9px] text-[#B8860B] uppercase tracking-[2px] font-semibold">
                Consultas anteriores
              </p>
              <div className="space-y-1">
                {consultations.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectConsultation(c)}
                    className={`w-full text-left text-[12px] leading-relaxed transition-colors ${
                      activeConsultation?.id === c.id
                        ? 'text-[#B8860B]'
                        : 'text-[#8B9DB7] hover:text-white'
                    }`}
                  >
                    &ldquo;{c.title}&rdquo;
                    <span className="text-[#4A5568] text-[10px] ml-1">
                      — {formatRelative(c.created_at)}
                    </span>
                  </button>
                ))}
                {consultations.length === 0 && (
                  <p className="text-[12px] text-[#4A5568] italic">Sin consultas aún</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleNewConsultation}
                className="text-[12px] text-[#B8860B] font-semibold hover:text-[#D4A017] transition-colors"
              >
                + Nueva consulta
              </button>
            </div>
          </div>
        </aside>

        {/* Center: chat */}
        <div className="flex flex-col flex-1 bg-[#0D1535] overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center justify-between px-6 h-14 border-b border-[#27282B] shrink-0 bg-[#0A1128]">
            <span className="text-[15px] text-white font-bold font-outfit">
              Consultoría Activa · {project.name}
            </span>
            <span className="text-[12px] text-[#4A9DF8]">Nexo modera</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                  <p className="text-[14px] text-[#8892A4]">
                    Escribe tu primera pregunta al consejo.
                  </p>
                  <p className="text-[12px] text-[#4A5568]">
                    Nexo modera y los consejeros más relevantes responden.
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <ChatBubble key={i} msg={msg} />
            ))}

            {sending && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-3 px-6 h-[60px] border-t border-[#27282B] shrink-0 bg-[#0A1128]">
            <input
              type="text"
              aria-label="Pregunta al consejo"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Escribe tu pregunta al consejo..."
              disabled={sending}
              className="flex-1 bg-[#0D1535] border border-[#27282B] rounded-lg px-4 h-[38px] text-[14px] text-white placeholder-[#4A6080] focus:outline-none focus:border-[#B8860B]/50 disabled:opacity-50"
            />
            <span className="text-[18px] text-[#4A6080] cursor-pointer hover:text-[#8892A4] select-none">📎</span>
            <span className="text-[18px] text-[#4A6080] cursor-pointer hover:text-[#8892A4] select-none">🎙</span>
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!input.trim() || sending}
              className="w-[38px] h-[38px] bg-[#B8860B] hover:bg-[#A07710] disabled:opacity-40 rounded-lg flex items-center justify-center transition-colors shrink-0"
            >
              <span className="text-black font-bold text-[14px]">→</span>
            </button>
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="w-[300px] flex flex-col bg-[#070E20] border-l border-[#27282B] shrink-0 overflow-y-auto">
          <div className="p-5 space-y-6">
            {/* Documents */}
            <div className="space-y-2">
              <p className="text-[9px] text-[#B8860B] uppercase tracking-[2px] font-semibold">
                Documentos de referencia
              </p>
              <div className="space-y-1">
                {approvedDocs.map(doc => (
                  <Link
                    key={doc.id}
                    href={`/project/${project.id}/documento/${doc.id}`}
                    className="flex items-center gap-2 text-[12px] text-[#8B9DB7] hover:text-white transition-colors leading-relaxed"
                  >
                    <span className="text-green-400 text-[10px]">✓</span>
                    {doc.name}
                  </Link>
                ))}
                {approvedDocs.length === 0 && (
                  <p className="text-[12px] text-[#4A5568] italic">Sin documentos aprobados aún</p>
                )}
              </div>
            </div>

            {/* Context */}
            <div className="space-y-2">
              <p className="text-[9px] text-[#B8860B] uppercase tracking-[2px] font-semibold">
                Contexto acumulado
              </p>
              <p className="text-[12px] text-[#8B9DB7] leading-relaxed">
                {consultations.length} consultas realizadas
                {activeConsultation && (
                  <>
                    <br />Consulta activa: &ldquo;{activeConsultation.title}&rdquo;
                  </>
                )}
              </p>
            </div>

            {/* Quick actions */}
            <div className="space-y-2">
              <p className="text-[9px] text-[#B8860B] uppercase tracking-[2px] font-semibold">
                Acciones rápidas
              </p>
              <div className="space-y-2">
                {QUICK_ACTIONS.map(action => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => handleSend(action)}
                    disabled={sending}
                    className="w-full text-left px-3 py-2 bg-[#0D1535] border border-[#27282B] rounded text-[12px] text-[#8B9DB7] hover:text-white hover:border-[#4A5568] transition-colors disabled:opacity-40"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

// ─── Chat Bubble ──────────────────────────────────────────────────────────────

function ChatBubble({ msg }: { msg: ConsultationMessage }) {
  const time = msg.timestamp ? formatTime(msg.timestamp) : null

  if (msg.role === 'user') {
    return (
      <div className="flex flex-col items-end">
        <div className="max-w-[65%] bg-[#B8860B]/10 border border-[#B8860B]/30 rounded-xl px-4 py-3">
          <p className="text-[14px] text-[#E0D4A0] leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
        </div>
        {time && <span className="text-[10px] text-[#8892A4] mt-1">{time}</span>}
      </div>
    )
  }

  if (msg.role === 'nexo') {
    return (
      <div className="flex flex-col items-start">
        <div className="max-w-[75%] bg-[#0A1128] border border-[#4A9DF8] rounded-xl px-4 py-3 space-y-1">
          <p className="text-[10px] text-[#4A9DF8] font-semibold uppercase tracking-wide">Nexo</p>
          <p className="text-[13px] text-[#C8D4E8] leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
        </div>
        {time && <span className="text-[10px] text-[#8892A4] mt-1">{time}</span>}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start">
      <div className="max-w-[75%] bg-[#0D1535] border border-[#B8860B] rounded-xl px-4 py-3 space-y-1.5">
        <div className="flex items-center gap-2">
          <p className="text-[10px] text-[#B8860B] font-semibold uppercase tracking-wide">
            {msg.advisor_name ?? 'Consejero'}
          </p>
          {msg.specialty && (
            <span className="text-[9px] text-[#4A5568]">— {msg.specialty}</span>
          )}
        </div>
        <p className="text-[13px] text-[#C8D4E8] leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
      </div>
      {time && <span className="text-[10px] text-[#8892A4] mt-1">{time}</span>}
    </div>
  )
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) {
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-[#B8860B]/60 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <span className="text-[11px] text-[#4A5568]">El consejo está respondiendo...</span>
    </div>
  )
}

function LockedView({ project }: { project: Project }) {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#0A1128] gap-6">
      <div className="w-16 h-16 rounded-full bg-[#0D1535] border border-[#1E2A4A] flex items-center justify-center">
        <span className="text-2xl">🔒</span>
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-[20px] text-white font-bold font-outfit">Consultoría Activa</h2>
        <p className="text-[14px] text-[#8892A4] max-w-sm">
          Completa la Sesión de Consejo para desbloquear la Consultoría Activa.
        </p>
      </div>
      <Link
        href={`/project/${project.id}`}
        className="px-6 py-2.5 bg-[#B8860B] hover:bg-[#A07710] text-black font-semibold rounded-lg text-[14px] transition-colors"
      >
        Volver al proyecto →
      </Link>
    </div>
  )
}

function formatRelative(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000 / 60)
  if (diff < 60) return `hace ${diff}m`
  if (diff < 1440) return `hace ${Math.floor(diff / 60)}h`
  return `hace ${Math.floor(diff / 1440)}d`
}
