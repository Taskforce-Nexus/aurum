'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Ticket = {
  id: string
  subject: string
  description: string
  status: 'abierto' | 'escalado' | 'resuelto' | 'cerrado'
  priority: string
  aria_resolved: boolean
  created_at: string
  updated_at: string
}

const STATUS_BADGE: Record<string, string> = {
  abierto:  'bg-blue-900/40 text-blue-300',
  escalado: 'bg-orange-900/40 text-orange-300',
  resuelto: 'bg-green-900/40 text-green-300',
  cerrado:  'bg-[#1E2A4A] text-[#8892A4]',
}

export default function SoporteClient() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/support/tickets')
      .then(r => r.json())
      .then(d => { setTickets(d.tickets ?? []); setLoading(false) })
  }, [])

  async function createTicket() {
    if (!subject.trim() || !description.trim()) return
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/support/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, description }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Error'); setSubmitting(false); return }
    setShowModal(false)
    setSubject('')
    setDescription('')
    setSubmitting(false)
    router.push(`/soporte/${data.ticket.id}`)
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Centro de Ayuda</h1>
          <p className="text-[#8892A4] text-sm mt-1">Aria, nuestra IA de soporte, responde de inmediato.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-[#B8860B] hover:bg-[#A07710] text-[#0A1128] text-sm font-semibold rounded-lg transition-colors"
        >
          + Nuevo ticket
        </button>
      </div>

      {loading ? (
        <p className="text-[#8892A4]">Cargando...</p>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#1E2A4A] rounded-xl">
          <p className="text-[#8892A4] text-sm">No tienes tickets aún.</p>
          <button type="button" onClick={() => setShowModal(true)} className="mt-3 text-[#B8860B] text-sm hover:underline">
            Crear tu primer ticket →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(t => (
            <button
              type="button"
              key={t.id}
              onClick={() => router.push(`/soporte/${t.id}`)}
              className="w-full text-left bg-[#0D1535] border border-[#1E2A4A] hover:border-[#2E3A5A] rounded-xl p-5 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{t.subject}</p>
                  <p className="text-[#8892A4] text-sm mt-1 line-clamp-1">{t.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[t.status] ?? STATUS_BADGE.cerrado}`}>
                    {t.status}
                  </span>
                  <span className="text-[#4A5568] text-xs">
                    {new Date(t.updated_at).toLocaleDateString('es')}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50" onClick={() => setShowModal(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[480px] bg-[#0D1535] border border-[#1E2A4A] rounded-2xl p-6 shadow-2xl">
            <h2 className="text-white font-bold text-lg mb-4">Nuevo ticket de soporte</h2>

            <label className="block text-xs text-[#8892A4] mb-1">Asunto</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Ej: No puedo exportar mi documento"
              className="w-full bg-[#0A1128] border border-[#1E2A4A] rounded-lg px-3 py-2 text-sm text-white placeholder-[#4A5568] mb-4 focus:outline-none focus:border-[#B8860B]"
            />

            <label className="block text-xs text-[#8892A4] mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe el problema con el mayor detalle posible..."
              className="w-full bg-[#0A1128] border border-[#1E2A4A] rounded-lg px-3 py-2 text-sm text-white placeholder-[#4A5568] mb-4 focus:outline-none focus:border-[#B8860B] resize-none"
            />

            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={createTicket}
                disabled={submitting || !subject.trim() || !description.trim()}
                className="flex-1 py-2.5 bg-[#B8860B] hover:bg-[#A07710] text-[#0A1128] text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Enviando...' : 'Enviar ticket'}
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-[#1E2A4A] text-[#8892A4] hover:text-white text-sm rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
