'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Message = {
  id: string
  sender_role: 'user' | 'aria' | 'admin'
  content: string
  created_at: string
}

type Ticket = {
  id: string
  subject: string
  status: string
  priority: string
}

const STATUS_BADGE: Record<string, string> = {
  abierto:  'bg-blue-900/40 text-blue-300',
  escalado: 'bg-orange-900/40 text-orange-300',
  resuelto: 'bg-green-900/40 text-green-300',
  cerrado:  'bg-[#1E2A4A] text-[#8892A4]',
}

export default function TicketDetailClient() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.id as string
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/support/tickets/${ticketId}`)
    if (!res.ok) { router.push('/soporte'); return }
    const data = await res.json()
    setTicket(data.ticket)
    setMessages(data.messages)
  }, [ticketId, router])

  useEffect(() => { load() }, [load])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send() {
    if (!input.trim() || sending) return
    setSending(true)
    const res = await fetch(`/api/support/tickets/${ticketId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: input }),
    })
    setInput('')
    setSending(false)
    if (res.ok) load()
  }

  async function closeTicket() {
    await fetch(`/api/support/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cerrado' }),
    })
    load()
  }

  const isClosed = ticket?.status === 'resuelto' || ticket?.status === 'cerrado'

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button type="button" onClick={() => router.push('/soporte')} className="text-[#8892A4] hover:text-white text-sm">← Volver</button>
        {ticket && (
          <>
            <h1 className="text-white font-bold text-lg flex-1 truncate">{ticket.subject}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[ticket.status] ?? STATUS_BADGE.cerrado}`}>
              {ticket.status}
            </span>
            {!isClosed && (
              <button type="button" onClick={closeTicket} className="text-xs text-[#8892A4] hover:text-white border border-[#1E2A4A] px-3 py-1.5 rounded-lg">
                Cerrar ticket
              </button>
            )}
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map(m => (
          <MessageBubble key={m.id} message={m} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {isClosed ? (
        <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl px-4 py-3 text-center text-sm text-[#8892A4]">
          Este ticket está cerrado. Crea uno nuevo si necesitas más ayuda.
        </div>
      ) : (
        <div className="flex gap-2 mt-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            rows={2}
            placeholder="Escribe tu mensaje..."
            className="flex-1 bg-[#0D1535] border border-[#1E2A4A] rounded-xl px-4 py-3 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:border-[#B8860B] resize-none"
          />
          <button
            type="button"
            onClick={send}
            disabled={sending || !input.trim()}
            className="px-5 py-2 bg-[#B8860B] hover:bg-[#A07710] text-[#0A1128] text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors"
          >
            {sending ? '...' : 'Enviar'}
          </button>
        </div>
      )}
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.sender_role === 'user'
  const isAria = message.sender_role === 'aria'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2`}>
      {!isUser && (
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1 ${isAria ? 'bg-[#B8860B]/20 text-[#B8860B]' : 'bg-[#1E2A4A] text-white'}`}>
          {isAria ? 'A' : '●'}
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-[#1E2A4A] text-white rounded-tr-sm'
            : 'bg-[#0D1535] border border-[#1E2A4A] text-[#E2E8F0] rounded-tl-sm'
        }`}
      >
        {!isUser && (
          <p className={`text-xs font-medium mb-1 ${isAria ? 'text-[#B8860B]' : 'text-[#8892A4]'}`}>
            {isAria ? 'Aria' : 'Soporte'}
          </p>
        )}
        <p className="whitespace-pre-wrap">{message.content}</p>
        <p className="text-[10px] text-[#4A5568] mt-1.5">
          {new Date(message.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}
