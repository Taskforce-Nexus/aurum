'use client'

import { useState, useEffect } from 'react'

type Feature = {
  id: string
  user_id: string
  title: string
  description: string | null
  status: string
  votes: number
  admin_notes: string | null
  created_at: string
}

const STATUS_BADGE: Record<string, string> = {
  recibida:     'bg-[#1E2A4A] text-[#8892A4]',
  evaluada:     'bg-blue-900/40 text-blue-300',
  planeada:     'bg-purple-900/40 text-purple-300',
  implementada: 'bg-green-900/40 text-green-300',
  descartada:   'bg-red-900/30 text-red-400',
}

const STATUSES = ['recibida', 'evaluada', 'planeada', 'implementada', 'descartada']

export default function AdminFeaturesClient() {
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editNotes, setEditNotes] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'votes' | 'date'>('votes')

  function load() {
    setLoading(true)
    fetch('/api/features')
      .then(r => r.json())
      .then(d => {
        const sorted = [...(d.features ?? [])].sort((a: Feature, b: Feature) =>
          sortBy === 'votes' ? b.votes - a.votes : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        setFeatures(sorted)
        setLoading(false)
      })
  }

  useEffect(() => { load() }, [sortBy]) // eslint-disable-line react-hooks/exhaustive-deps

  async function saveUpdate(id: string, status: string, notes: string) {
    setSaving(id)
    await fetch(`/api/admin/features/${id}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, admin_notes: notes }),
    })
    setSaving(null)
    load()
  }

  function toggleExpand(id: string, feature: Feature) {
    if (expanded === id) {
      setExpanded(null)
    } else {
      setExpanded(id)
      setEditNotes(prev => ({ ...prev, [id]: feature.admin_notes ?? '' }))
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sugerencias <span className="text-[#8892A4] text-base font-normal">({features.length})</span></h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSortBy('votes')}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${sortBy === 'votes' ? 'bg-[#1E2A4A] border-[#2E3A5A] text-white' : 'border-[#1E2A4A] text-[#8892A4] hover:text-white'}`}
          >
            Por votos
          </button>
          <button
            type="button"
            onClick={() => setSortBy('date')}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${sortBy === 'date' ? 'bg-[#1E2A4A] border-[#2E3A5A] text-white' : 'border-[#1E2A4A] text-[#8892A4] hover:text-white'}`}
          >
            Por fecha
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-[#8892A4]">Cargando...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#1E2A4A]">
          <table className="w-full text-sm">
            <thead className="bg-[#0D1535] text-[#8892A4] text-xs uppercase">
              <tr>
                {['Título', 'Votos', 'Status', 'Fecha', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((f, i) => (
                <>
                  <tr
                    key={f.id}
                    className={`border-t border-[#1E2A4A] cursor-pointer transition-colors ${
                      i % 2 === 0 ? 'bg-[#0A1128]' : 'bg-[#0D1535]/50'
                    } hover:bg-[#1E2A4A]/30`}
                    onClick={() => toggleExpand(f.id, f)}
                  >
                    <td className="px-4 py-3 text-[#E2E8F0] max-w-[280px] truncate">{f.title}</td>
                    <td className="px-4 py-3 text-center font-bold text-white">{f.votes}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[f.status] ?? STATUS_BADGE.recibida}`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#8892A4] text-xs">{new Date(f.created_at).toLocaleDateString('es')}</td>
                    <td className="px-4 py-3 text-[#8892A4] text-xs">{expanded === f.id ? '▲' : '▼'}</td>
                  </tr>
                  {expanded === f.id && (
                    <tr key={`${f.id}-detail`} className="border-t border-[#1E2A4A] bg-[#0D1535]">
                      <td colSpan={5} className="px-6 py-5">
                        {f.description && (
                          <p className="text-[#8892A4] text-sm mb-4">{f.description}</p>
                        )}
                        <div className="flex gap-4 items-start">
                          <div className="flex-1">
                            <label className="block text-xs text-[#8892A4] mb-1">Notas del admin</label>
                            <textarea
                              value={editNotes[f.id] ?? ''}
                              onChange={e => setEditNotes(prev => ({ ...prev, [f.id]: e.target.value }))}
                              rows={3}
                              className="w-full bg-[#0A1128] border border-[#1E2A4A] rounded-lg px-3 py-2 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:border-[#B8860B] resize-none"
                              placeholder="Notas internas sobre esta sugerencia..."
                            />
                          </div>
                          <div className="shrink-0">
                            <label className="block text-xs text-[#8892A4] mb-1">Status</label>
                            <select
                              defaultValue={f.status}
                              id={`status-${f.id}`}
                              className="bg-[#0A1128] border border-[#1E2A4A] rounded-lg px-3 py-2 text-sm text-white mb-3"
                            >
                              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <button
                              type="button"
                              disabled={saving === f.id}
                              onClick={() => {
                                const sel = document.getElementById(`status-${f.id}`) as HTMLSelectElement
                                saveUpdate(f.id, sel.value, editNotes[f.id] ?? '')
                              }}
                              className="w-full py-2 bg-[#B8860B] hover:bg-[#A07710] text-[#0A1128] text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
                            >
                              {saving === f.id ? 'Guardando...' : 'Guardar'}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
