'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { Project, Conversation, Message } from '@/lib/types'

interface Props {
  project: Project
  conversation: Conversation | null
  userEmail: string
}

export default function IncubadoraChat({ project, conversation, userEmail }: Props) {
  const [messages, setMessages] = useState<Message[]>(conversation?.messages ?? [])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-start if no messages
  useEffect(() => {
    if (messages.length === 0) sendInitialMessage()
  }, [])

  async function sendInitialMessage() {
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          conversationId: conversation?.id,
          messages: [],
          phase: 'semilla',
        }),
      })
      const data = await res.json()
      if (data.message) {
        setMessages([{ role: 'assistant', content: data.message, author: 'Nexo' }])
      }
    } catch {}
    setLoading(false)
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return
    const userMessage: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          conversationId: conversation?.id,
          messages: newMessages,
          phase: 'semilla',
        }),
      })
      const data = await res.json()
      if (data.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message, author: 'Nexo' }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error al conectar con Nexo. Intenta de nuevo.', author: 'Nexo' }])
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0F0F11] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#2a2b30] px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href={`/project/${project.id}`} className="text-base font-bold tracking-widest text-[#C9A84C] hover:opacity-80 transition-opacity">
            AURUM
          </Link>
        </div>
        <div className="flex items-center gap-3 text-sm text-[#6b6d75]">
          <span>{project.name} — Fase Semilla</span>
          <span className="text-[#2a2b30]">|</span>
          <span>Fase 1 de 13</span>
          <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">En curso</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/project/${project.id}`}
            className="text-sm text-[#6b6d75] border border-[#2a2b30] px-3 py-1.5 rounded-lg hover:text-white hover:border-[#3a3b40] transition-colors">
            Salir
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-72 border-r border-[#2a2b30] p-5 flex flex-col gap-5 overflow-y-auto shrink-0">
          <div>
            <h2 className="font-semibold text-sm mb-0.5">Sesión Semilla</h2>
            <p className="text-xs text-[#6b6d75]">1:1 con Nexo Constructivo</p>
          </div>

          <div>
            <p className="text-xs text-[#C9A84C] uppercase tracking-wider font-medium mb-2">Objetivo de Hoy</p>
            <p className="text-xs text-[#9a9ba5] leading-relaxed">
              Entender tu idea al 100%: experiencia, recursos y visión. Al final generamos tu Resumen del Fundador.
            </p>
          </div>

          <div className="bg-[#1A1B1E] border border-[#2a2b30] rounded-lg p-3">
            <p className="text-xs text-[#6b6d75] uppercase tracking-wider mb-1">Proyecto Activo</p>
            <p className="font-semibold text-sm">{project.name}</p>
            <span className="text-xs text-[#6b6d75] bg-[#2a2b30] px-2 py-0.5 rounded-full mt-1 inline-block">
              {project.entry_level === 'raw_idea' ? 'Idea cruda' : project.entry_level}
            </span>
          </div>

          <div>
            <p className="text-xs text-[#6b6d75] uppercase tracking-wider mb-2">Progreso de Extracción</p>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#9a9ba5]">Contexto del fundador</span>
                  <span className="text-[#C9A84C]">{messages.filter(m => m.role === 'user').length * 10}%</span>
                </div>
                <div className="h-1 bg-[#2a2b30] rounded-full">
                  <div className="h-1 bg-[#C9A84C] rounded-full transition-all"
                    style={{ width: `${Math.min(messages.filter(m => m.role === 'user').length * 10, 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#9a9ba5]">Idea de producto</span>
                  <span className="text-[#6b6d75]">{messages.filter(m => m.role === 'user').length * 5}%</span>
                </div>
                <div className="h-1 bg-[#2a2b30] rounded-full">
                  <div className="h-1 bg-[#C9A84C]/50 rounded-full transition-all"
                    style={{ width: `${Math.min(messages.filter(m => m.role === 'user').length * 5, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs text-[#6b6d75] uppercase tracking-wider mb-2">Resumen del Fundador</p>
            <div className="bg-[#1A1B1E] border border-[#2a2b30] rounded-lg p-3">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#6b6d75]" />
                <p className="text-xs text-[#6b6d75]">Pendiente — se genera al completar la sesión</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Chat area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/30 flex items-center justify-center text-[#C9A84C] text-xs font-bold shrink-0 mt-1">
                    N
                  </div>
                )}
                <div className={`max-w-2xl rounded-2xl px-5 py-4 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#2a2b30] text-white rounded-tr-sm'
                    : 'bg-[#1A1B1E] border border-[#2a2b30] text-[#e0e0e5] rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-[#3a3b40] flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                    {userEmail[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/30 flex items-center justify-center text-[#C9A84C] text-xs font-bold shrink-0">N</div>
                <div className="bg-[#1A1B1E] border border-[#2a2b30] rounded-2xl rounded-tl-sm px-5 py-4">
                  <div className="flex gap-1.5 items-center h-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="border-t border-[#2a2b30] px-8 py-4 shrink-0">
            <form onSubmit={sendMessage} className="flex gap-3 items-end">
              <div className="flex-1 bg-[#1A1B1E] border border-[#2a2b30] rounded-xl px-4 py-3 flex items-center gap-3 focus-within:border-[#C9A84C]/50 transition-colors">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Escribe tu respuesta o usa el micrófono..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-[#3a3b40] focus:outline-none"
                  disabled={loading}
                />
                <div className="flex items-center gap-2">
                  <button type="button" className="text-[#3a3b40] hover:text-[#6b6d75] transition-colors p-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                    </svg>
                  </button>
                  <button type="button" className="text-[#3a3b40] hover:text-[#6b6d75] transition-colors p-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                      <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/>
                    </svg>
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading || !input.trim()}
                className="bg-[#C9A84C] hover:bg-[#b8963f] text-[#0F0F11] p-3 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
                </svg>
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
