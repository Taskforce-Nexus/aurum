'use client'

import { useState, useEffect, useRef } from 'react'

interface Message {
  role: 'user' | 'aria'
  content: string
}

const STORAGE_KEY = 'support_widget_messages'

const INITIAL_MESSAGE: Message = {
  role: 'aria',
  content: '¡Hola! Soy Aria. Puedo ayudarte con dudas del producto, problemas técnicos, o registrar sugerencias. ¿En qué te puedo ayudar?',
}

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastAction, setLastAction] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load persisted messages from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Message[]
        if (parsed.length > 0) setMessages(parsed)
      }
    } catch { /* ignore */ }
  }, [])

  // Persist messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch { /* ignore */ }
  }, [messages])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', content: text }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)
    setLastAction(null)

    try {
      const res = await fetch('/api/support/aria-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      })
      const data = await res.json() as { response?: string; actions?: string[]; error?: string }

      if (data.response) {
        setMessages(prev => [...prev, { role: 'aria', content: data.response! }])
        if (data.actions && data.actions.length > 0) {
          setLastAction(data.actions[0])
        }
      } else {
        setMessages(prev => [...prev, { role: 'aria', content: 'Ocurrió un error. Por favor intenta de nuevo.' }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'aria', content: 'No pude conectarme. Verifica tu conexión e intenta de nuevo.' }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void sendMessage()
    }
  }

  function clearChat() {
    setMessages([INITIAL_MESSAGE])
    setLastAction(null)
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  }

  const actionLabel: Record<string, string> = {
    create_ticket: 'Ticket creado ✓',
    create_suggestion: 'Sugerencia registrada ✓',
    escalate: 'Escalado al equipo ✓',
  }

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        aria-label="Abrir soporte"
        data-tour="support-widget"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#B8860B] text-white shadow-lg hover:bg-[#9A7209] transition-colors flex items-center justify-center text-2xl"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Drawer panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] h-[520px] bg-[#0D1535] border border-[#1E2A4A] rounded-xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#1E2A4A] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#B8860B]/20 border border-[#B8860B]/40 flex items-center justify-center text-xs text-[#B8860B] font-bold">A</div>
              <div>
                <p className="text-[#F8F8F8] font-semibold text-sm leading-none">Aria</p>
                <p className="text-[#8892A4] text-[10px]">Asistente de Reason</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearChat}
                title="Limpiar chat"
                className="text-[#8892A4] hover:text-white text-xs transition-colors"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[#8892A4] hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Action badge */}
          {lastAction && (
            <div className="px-4 py-1.5 bg-green-500/10 border-b border-green-500/20 shrink-0">
              <p className="text-green-400 text-xs">{actionLabel[lastAction] ?? 'Acción completada ✓'}</p>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'aria' && (
                  <div className="w-6 h-6 rounded-full bg-[#B8860B]/20 border border-[#B8860B]/40 flex items-center justify-center text-[10px] text-[#B8860B] font-bold mr-2 mt-0.5 shrink-0">A</div>
                )}
                <div
                  className={`max-w-[75%] rounded-xl px-3 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[#B8860B] text-[#0A1128]'
                      : 'bg-[#1E2A4A] text-[#C8D0DC]'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full bg-[#B8860B]/20 border border-[#B8860B]/40 flex items-center justify-center text-[10px] text-[#B8860B] font-bold mr-2 mt-0.5 shrink-0">A</div>
                <div className="bg-[#1E2A4A] rounded-xl px-3 py-2 text-sm text-[#8892A4]">
                  <span className="animate-pulse">Aria está escribiendo...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[#1E2A4A] p-3 shrink-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu mensaje..."
                disabled={loading}
                className="flex-1 bg-[#1E2A4A] text-white text-sm placeholder-[#8892A4] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#B8860B] disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={!input.trim() || loading}
                className="bg-[#B8860B] hover:bg-[#9A7209] disabled:opacity-40 text-[#0A1128] rounded-lg px-3 py-2 text-sm font-medium transition-colors shrink-0"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
