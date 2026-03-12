'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const ENTRY_LEVELS = [
  { value: 'idea', label: 'Tengo una idea' },
  { value: 'en_desarrollo', label: 'Estoy desarrollándola' },
  { value: 'en_mercado', label: 'Ya estoy en el mercado' },
]

interface Props {
  onClose: () => void
}

export default function CreateProjectModal({ onClose }: Props) {
  const [name, setName] = useState('')
  const [entryLevel, setEntryLevel] = useState('idea')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: name.trim(),
        entry_level: entryLevel,
        current_phase: 'semilla',
        status: 'active',
        last_active_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(`/project/${data.id}/semilla`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1128]/80 backdrop-blur-sm p-4">
      <div className="bg-[#1A1B1E] border border-[#2a2b30] rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-lg font-semibold mb-5">Nuevo proyecto</h2>

        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="block text-xs text-[#6b6d75] uppercase tracking-wider mb-1.5">
              Nombre del proyecto
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ej. FinTrack, MiSaaS..."
              required
              autoFocus
              className="w-full bg-[#0F0F11] border border-[#2a2b30] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#3a3b40] focus:outline-none focus:border-[#C9A84C] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-[#6b6d75] uppercase tracking-wider mb-2">
              ¿Dónde estás con tu proyecto?
            </label>
            <div className="flex flex-wrap gap-2">
              {ENTRY_LEVELS.map(level => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setEntryLevel(level.value)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    entryLevel === level.value
                      ? 'bg-[#C9A84C] text-[#0F0F11] font-medium'
                      : 'bg-[#2a2b30] text-[#6b6d75] hover:text-white'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm text-[#6b6d75] hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="bg-[#C9A84C] hover:bg-[#b8963f] text-[#0F0F11] font-semibold px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' : 'Crear proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
