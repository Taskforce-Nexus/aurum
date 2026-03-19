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
  aria_resolved: boolean
  profiles?: { email?: string; full_name?: string }
}

const STATUS_BADGE: Record<string, string> = {
  abierto:  'bg-blue-900/40 text-blue-300',
  escalado: 'bg-orange-900/40 text-orange-300',
  resuelto: 'bg-green-900/40 text-green-300',
  cerrado:  'bg-[#1E2A4A] text-[#8892A4]',
}

export default function AdminTicketDetailClient() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.id as string
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [saving, setSaving] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/tickets/${ticketId}`)
    if (!res.ok) { router.push('/admin/tickets'); return }
    const data = await res.json()
    setTicket(data.ticket)
    setMessages(data.messages)
  }, [ticketId, router])

  useEffect(() => { load() }, [load])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function sendAdminMessage() {
    if (!input.trim() || sending) return
    setSending(true)
    await fetch(`/api/admin/tickets/${ticketId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: input }),
    })
    setInput('')
    setSending(false)
    load()
  }

  async function updateTicket(update: Record<string, unknown>) {
    setSaving(true)
    await fetch(`/api/admin/tickets/${ticketId}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    })
    setSaving(false)
    load()
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <button type="button" onClick={() => router.push('/admin/tickets')} className="text-[#8892A4] hover:text-white text-sm shrink-0">← Tickets</button>
        {ticket && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold truncate">{ticket.subject}</p>
              <p className="text-[#8892A4] text-xs">{ticket.profiles?.email}</p>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[ticket.status] ?? STATUS_BADGE.cerrado}`}>
              {ticket.status}
            </span>

            {/* Controls */}
            <select
              value={ticket.status}
              onChange={e => updateTicket({ status: e.target.value })}
              disabled={saving}
              className="bg-[#0D1535] border border-[#1E2A4A] rounded-lg px-2 py-1 text-xs text-white"
            >
              {['abierto', 'escalado', 'resuelto', 'cerrado'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={ticket.priority}
              onChange={e => updateTicket({ priority: e.target.value })}
              disabled={saving}
              className="bg-[#0D1535] border border-[#1E2A4A] rounded-lg px-2 py-1 text-xs text-white"
            >
              {['urgente', 'normal', 'bajo'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 border border-[#1E2A4A] rounded-xl p-4 bg-[#0A1128]">
        {messages.map(m => <AdminMessageBubble key={m.id} message={m} />)}
        <div ref={bottomRef} />
      </div>

      {/* Admin Reply */}
      <div className="flex gap-2 mt-3">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAdminMessage() } }}
          rows={2}
          placeholder="Responder como Admin..."
          className="flex-1 bg-[#0D1535] border border-[#1E2A4A] rounded-xl px-4 py-3 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:border-[#B8860B] resize-none"
        />
        <button
          type="button"
          onClick={sendAdminMessage}
          disabled={sending || !input.trim()}
          className="px-5 py-2 bg-[#B8860B] hover:bg-[#A07710] text-[#0A1128] text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors"
        >
          {sending ? '...' : 'Enviar'}
        </button>
      </div>
    </div>
  )
}

function AdminMessageBubble({ message }: { message: Message }) {
  const isUser = message.sender_role === 'user'
  const isAria = message.sender_role === 'aria'
  const isAdmin = message.sender_role === 'admin'

  const bgClass = isUser
    ? 'bg-[#1E2A4A] text-white ml-auto'
    : isAdmin
      ? 'bg-[#B8860B]/20 border border-[#B8860B]/30 text-[#E2E8F0]'
      : 'bg-[#0D1535] border border-[#1E2A4A] text-[#E2E8F0]'

  const label = isUser ? 'Usuario' : isAria ? 'Aria' : 'Admin'
  const labelColor = isAdmin ? 'text-[#B8860B]' : isAria ? 'text-purple-400' : 'text-[#8892A4]'

  return (
    <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${bgClass} ${isUser ? 'ml-auto rounded-tr-sm' : 'rounded-tl-sm'}`}>
      <p className={`text-xs font-medium mb-1 ${labelColor}`}>{label}</p>
      <p className="whitespace-pre-wrap">{message.content}</p>
      <p className="text-[10px] text-[#4A5568] mt-1.5">
        {new Date(message.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  )
}
