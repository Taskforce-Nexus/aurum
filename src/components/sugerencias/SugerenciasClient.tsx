'use client'

import { useState, useEffect } from 'react'

type Feature = {
  id: string
  user_id: string
  title: string
  description: string | null
  status: string
  votes: number
  user_voted: boolean
  is_own: boolean
  created_at: string
}

const STATUS_BADGE: Record<string, string> = {
  recibida:     'bg-[#1E2A4A] text-[#8892A4]',
  evaluada:     'bg-blue-900/40 text-blue-300',
  planeada:     'bg-purple-900/40 text-purple-300',
  implementada: 'bg-green-900/40 text-green-300',
  descartada:   'bg-red-900/30 text-red-400',
}

export default function SugerenciasClient() {
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [voting, setVoting] = useState<string | null>(null)

  function load() {
    setLoading(true)
    fetch('/api/features')
      .then(r => r.json())
      .then(d => { setFeatures(d.features ?? []); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  async function submit() {
    if (!title.trim()) return
    setSubmitting(true)
    const res = await fetch('/api/features', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    })
    setSubmitting(false)
    if (res.ok) { setShowModal(false); setTitle(''); setDescription(''); load() }
  }

  async function toggleVote(id: string) {
    setVoting(id)
    await fetch(`/api/features/${id}/vote`, { method: 'POST' })
    load()
    setVoting(null)
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Sugerencias</h1>
          <p className="text-[#8892A4] text-sm mt-1">Vota por las funciones que más necesitas.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-[#B8860B] hover:bg-[#A07710] text-[#0A1128] text-sm font-semibold rounded-lg transition-colors"
        >
          + Sugerir funcionalidad
        </button>
      </div>

      {loading ? (
        <p className="text-[#8892A4]">Cargando...</p>
      ) : features.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#1E2A4A] rounded-xl">
          <p className="text-[#8892A4] text-sm">No hay sugerencias aún. ¡Sé el primero!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {features.map(f => (
            <div
              key={f.id}
              className={`bg-[#0D1535] border rounded-xl p-5 flex gap-4 items-start ${f.is_own ? 'border-[#B8860B]/30' : 'border-[#1E2A4A]'}`}
            >
              {/* Vote button */}
              <button
                type="button"
                onClick={() => toggleVote(f.id)}
                disabled={voting === f.id}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg border transition-colors shrink-0 ${
                  f.user_voted
                    ? 'bg-[#B8860B]/20 border-[#B8860B]/50 text-[#B8860B]'
                    : 'bg-[#0A1128] border-[#1E2A4A] text-[#8892A4] hover:text-white hover:border-[#2E3A5A]'
                }`}
              >
                <span className="text-xs">▲</span>
                <span className="text-sm font-bold">{f.votes}</span>
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-white font-medium">{f.title}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[f.status] ?? STATUS_BADGE.recibida}`}>
                    {f.status}
                  </span>
                </div>
                {f.description && (
                  <p className="text-[#8892A4] text-sm line-clamp-2">{f.description}</p>
                )}
                <p className="text-[#4A5568] text-xs mt-2">{new Date(f.created_at).toLocaleDateString('es')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50" onClick={() => setShowModal(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[460px] bg-[#0D1535] border border-[#1E2A4A] rounded-2xl p-6 shadow-2xl">
            <h2 className="text-white font-bold text-lg mb-4">Sugerir funcionalidad</h2>

            <label className="block text-xs text-[#8892A4] mb-1">Título <span className="text-red-400">*</span></label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej: Exportar sesión en formato Word"
              className="w-full bg-[#0A1128] border border-[#1E2A4A] rounded-lg px-3 py-2 text-sm text-white placeholder-[#4A5568] mb-4 focus:outline-none focus:border-[#B8860B]"
            />

            <label className="block text-xs text-[#8892A4] mb-1">Descripción (opcional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Cuéntanos más sobre esta funcionalidad..."
              className="w-full bg-[#0A1128] border border-[#1E2A4A] rounded-lg px-3 py-2 text-sm text-white placeholder-[#4A5568] mb-5 focus:outline-none focus:border-[#B8860B] resize-none"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={submit}
                disabled={submitting || !title.trim()}
                className="flex-1 py-2.5 bg-[#B8860B] hover:bg-[#A07710] text-[#0A1128] text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Enviando...' : 'Enviar sugerencia'}
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
