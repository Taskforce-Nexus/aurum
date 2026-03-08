'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  organizationId: string
  primary?: boolean
}

export default function NewProjectButton({ userId, organizationId, primary }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function createProject(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const { data, error } = await supabase.from('projects').insert({
      name: name.trim(),
      user_id: userId,
      organization_id: organizationId,
      status: 'active',
      entry_level: 'raw_idea',
      current_phase: 'Semilla',
      last_active_at: new Date().toISOString(),
    }).select().single()
    if (!error && data) {
      router.push(`/project/${data.id}/incubadora`)
      router.refresh()
    }
    setLoading(false)
  }

  if (open) {
    return (
      <form onSubmit={createProject} className="flex gap-2">
        <input autoFocus value={name} onChange={e => setName(e.target.value)}
          placeholder="Nombre del proyecto"
          className="bg-[#1A1B1E] border border-[#C9A84C] rounded-lg px-4 py-2 text-sm text-white placeholder-[#3a3b40] focus:outline-none w-64" />
        <button type="submit" disabled={loading}
          className="bg-[#C9A84C] hover:bg-[#b8963f] text-[#0F0F11] font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
          {loading ? '...' : 'Crear'}
        </button>
        <button type="button" onClick={() => setOpen(false)}
          className="text-[#6b6d75] hover:text-white px-3 py-2 text-sm transition-colors">
          Cancelar
        </button>
      </form>
    )
  }

  return (
    <button onClick={() => setOpen(true)}
      className={`font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors ${
        primary
          ? 'bg-[#C9A84C] hover:bg-[#b8963f] text-[#0F0F11]'
          : 'bg-[#C9A84C] hover:bg-[#b8963f] text-[#0F0F11]'
      }`}>
      + Nuevo Proyecto
    </button>
  )
}
