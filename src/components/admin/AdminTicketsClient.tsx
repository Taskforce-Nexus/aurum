'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type Ticket = {
  id: string
  subject: string
  status: string
  priority: string
  aria_resolved: boolean
  created_at: string
  updated_at: string
  profiles?: { email?: string; full_name?: string }
}

const STATUS_BADGE: Record<string, string> = {
  abierto:  'bg-blue-900/40 text-blue-300',
  escalado: 'bg-orange-900/40 text-orange-300',
  resuelto: 'bg-green-900/40 text-green-300',
  cerrado:  'bg-[#1E2A4A] text-[#8892A4]',
}

const PRIORITY_BADGE: Record<string, string> = {
  urgente: 'text-red-400',
  normal:  'text-[#8892A4]',
  bajo:    'text-[#4A5568]',
}

export default function AdminTicketsClient() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [escalatedCount, setEscalatedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (priorityFilter) params.set('priority', priorityFilter)
    const res = await fetch(`/api/admin/tickets?${params}`)
    const data = await res.json()
    setTickets(data.tickets ?? [])
    setEscalatedCount(data.escalated_count ?? 0)
    setLoading(false)
  }, [statusFilter, priorityFilter])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          Tickets de soporte
          {escalatedCount > 0 && (
            <span className="ml-3 px-2 py-0.5 bg-orange-900/40 text-orange-300 text-sm font-medium rounded-full">
              {escalatedCount} escalados
            </span>
          )}
        </h1>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#0D1535] border border-[#1E2A4A] rounded-lg px-3 py-1.5 text-sm text-[#8892A4]"
          >
            <option value="">Todos los estados</option>
            {['abierto', 'escalado', 'resuelto', 'cerrado'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="bg-[#0D1535] border border-[#1E2A4A] rounded-lg px-3 py-1.5 text-sm text-[#8892A4]"
          >
            <option value="">Todas las prioridades</option>
            {['urgente', 'normal', 'bajo'].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-[#8892A4]">Cargando...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#1E2A4A]">
          <table className="w-full text-sm">
            <thead className="bg-[#0D1535] text-[#8892A4] text-xs uppercase">
              <tr>
                {['Asunto', 'Usuario', 'Status', 'Prioridad', 'Aria resolvió', 'Creado', 'Actualizado'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickets.map((t, i) => (
                <tr
                  key={t.id}
                  onClick={() => router.push(`/admin/tickets/${t.id}`)}
                  className={`border-t border-[#1E2A4A] cursor-pointer transition-colors ${
                    t.status === 'escalado'
                      ? 'bg-orange-950/20 hover:bg-orange-950/30'
                      : i % 2 === 0
                        ? 'bg-[#0A1128] hover:bg-[#1E2A4A]/30'
                        : 'bg-[#0D1535]/50 hover:bg-[#1E2A4A]/30'
                  }`}
                >
                  <td className="px-4 py-3 text-[#E2E8F0] max-w-[200px] truncate">{t.subject}</td>
                  <td className="px-4 py-3 text-[#8892A4] text-xs">{t.profiles?.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[t.status] ?? STATUS_BADGE.cerrado}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${PRIORITY_BADGE[t.priority] ?? ''}`}>{t.priority}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs">{t.aria_resolved ? '✓' : '—'}</td>
                  <td className="px-4 py-3 text-[#8892A4] text-xs">{new Date(t.created_at).toLocaleDateString('es')}</td>
                  <td className="px-4 py-3 text-[#8892A4] text-xs">{new Date(t.updated_at).toLocaleDateString('es')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
