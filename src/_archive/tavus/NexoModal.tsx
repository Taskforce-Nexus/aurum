'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { Message } from '@/lib/types'

interface NexoModalProps {
  projectId: string
  projectName?: string
  idea?: string
  onClose: (transcript: Message[]) => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function NexoModal({ projectId, projectName, idea, onClose }: NexoModalProps) {
  const [conversationUrl, setConversationUrl] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<Message[]>([])
  const [textInput, setTextInput] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [closing, setClosing] = useState(false)

  const transcriptBottomRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const knownLengthRef = useRef(0)

  // ─── Create Tavus conversation on mount ──────────────────────────────────
  useEffect(() => {
    async function createConversation() {
      try {
        const res = await fetch('/api/tavus/conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project_id: projectId, project_name: projectName, idea }),
        })
        const data = await res.json()
        if (!res.ok || !data.conversation_url) {
          setError(data.error ?? 'No se pudo iniciar la sesión con Nexo.')
          setLoading(false)
          return
        }
        setConversationUrl(data.conversation_url)
        setConversationId(data.conversation_id)
        setLoading(false)
      } catch {
        setError('Error de red. Verifica tu conexión e intenta de nuevo.')
        setLoading(false)
      }
    }
    void createConversation()
  }, [projectId, projectName, idea])

  // ─── Start timer once conversation is ready ──────────────────────────────
  useEffect(() => {
    if (!conversationUrl) return
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [conversationUrl])

  // ─── Poll transcript (utterance webhook store) ───────────────────────────
  useEffect(() => {
    if (!conversationId) return
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/tavus/llm?conversationId=${conversationId}`)
        const data = await res.json() as {
          messages: Message[]
          transcript: Array<{ role: string; text: string; timestamp: number }>
        }
        const source = data.transcript.length > 0 ? data.transcript : data.messages
        if (source.length > knownLengthRef.current) {
          knownLengthRef.current = source.length
          if (data.transcript.length > 0) {
            setTranscript(data.transcript.map(e => ({
              role: e.role === 'Nexo' ? 'assistant' : 'user' as 'user' | 'assistant',
              content: e.text,
            })))
          } else {
            setTranscript(data.messages)
          }
        }
      } catch { /* ignore polling errors */ }
    }, 2000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [conversationId])

  // ─── Auto-scroll transcript ──────────────────────────────────────────────
  useEffect(() => {
    transcriptBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  // ─── Close handler ───────────────────────────────────────────────────────
  const handleClose = useCallback(async () => {
    if (closing) return
    setClosing(true)

    if (timerRef.current) clearInterval(timerRef.current)
    if (pollRef.current) clearInterval(pollRef.current)

    if (conversationId) {
      try {
        await fetch('/api/tavus/conversation', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversation_id: conversationId }),
        })
      } catch { /* non-blocking */ }
    }

    // Get final transcript before closing
    let finalTranscript = transcript
    if (conversationId) {
      try {
        const res = await fetch(`/api/tavus/llm?conversationId=${conversationId}`)
        const data = await res.json() as {
          messages: Message[]
          transcript: Array<{ role: string; text: string }>
        }
        if (data.transcript.length > 0) {
          finalTranscript = data.transcript.map(e => ({
            role: e.role === 'Nexo' ? 'assistant' : 'user' as 'user' | 'assistant',
            content: e.text,
          }))
        } else if (data.messages.length > 0) {
          finalTranscript = data.messages
        }
      } catch { /* use what we have */ }
    }

    onClose(finalTranscript)
  }, [closing, conversationId, transcript, onClose])

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => void handleClose()} />

      {/* Modal */}
      <div className="relative w-full max-w-6xl mx-4 h-[85vh] bg-[#0F0F11] border border-[#2a2b30] rounded-2xl overflow-hidden flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#2a2b30] shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>
              Sesión con Nexo
            </span>
            {conversationUrl && (
              <span className="text-sm text-[#6b6d75] font-mono">{formatTime(elapsed)}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => void handleClose()}
            disabled={closing}
            className="text-sm text-[#6b6d75] hover:text-white transition-colors border border-[#2a2b30] px-3 py-1.5 rounded-lg"
          >
            {closing ? 'Cerrando…' : 'Cerrar ×'}
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left panel — Nexo video (60%) */}
          <div className="relative flex-[3] bg-[#0a0a0c] flex items-center justify-center overflow-hidden border-r border-[#2a2b30]">

            {loading && (
              <div className="flex flex-col items-center gap-3 text-[#6b6d75]">
                <div className="w-10 h-10 rounded-full border-2 border-[#C9A84C]/30 border-t-[#C9A84C] animate-spin" />
                <p className="text-sm">Conectando con Nexo…</p>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center gap-3 max-w-sm text-center px-6">
                <p className="text-sm text-red-400">{error}</p>
                <button
                  type="button"
                  onClick={() => void handleClose()}
                  className="text-xs text-[#6b6d75] border border-[#2a2b30] px-4 py-2 rounded-lg hover:text-white transition-colors"
                >
                  Cerrar
                </button>
              </div>
            )}

            {conversationUrl && (
              <iframe
                src={conversationUrl}
                allow="camera; microphone; fullscreen; display-capture"
                className="w-full h-full border-0"
                title="Nexo — Sesión de voz"
              />
            )}
          </div>

          {/* Right panel — Transcript (40%) */}
          <div className="flex-[2] flex flex-col overflow-hidden bg-[#0F0F11]">
            <div className="px-5 py-3 border-b border-[#2a2b30] shrink-0">
              <p className="text-xs text-[#6b6d75] uppercase tracking-wider font-medium">Transcripción</p>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {transcript.length === 0 && conversationUrl && (
                <p className="text-xs text-[#3a3b40] italic">La transcripción aparecerá aquí…</p>
              )}
              {transcript.map((msg, i) => (
                <div key={i} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-[#3a3b40] uppercase tracking-wider">
                    {msg.role === 'user' ? 'Tú' : 'Nexo'}
                  </span>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#1e3a5f] text-white rounded-tr-sm'
                      : 'bg-[#1A1B1E] border border-[#2a2b30] text-[#e0e0e5] rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={transcriptBottomRef} />
            </div>

            {/* Optional text input */}
            <div className="border-t border-[#2a2b30] px-4 py-3 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!textInput.trim()) return
                  setTranscript(prev => [...prev, { role: 'user', content: textInput.trim() }])
                  setTextInput('')
                }}
                className="flex gap-2"
              >
                <input
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  placeholder="Escribe si prefieres…"
                  aria-label="Mensaje de texto"
                  className="flex-1 bg-[#1A1B1E] border border-[#2a2b30] rounded-lg px-3 py-2 text-xs text-white placeholder-[#3a3b40] focus:outline-none focus:border-[#C9A84C]/40 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!textInput.trim()}
                  className="text-xs px-3 py-2 bg-[#C9A84C]/20 border border-[#C9A84C]/30 text-[#C9A84C] rounded-lg hover:bg-[#C9A84C]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  →
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
