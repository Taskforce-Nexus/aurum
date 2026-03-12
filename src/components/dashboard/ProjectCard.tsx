'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  id: string
  name: string
  currentPhase: string | null
  lastActiveAt: string | null
  description?: string | null
  phasePill?: { label: string; color: string }
}

export default function ProjectCard({ id, name, currentPhase, lastActiveAt, description, phasePill }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(name)
  const [displayName, setDisplayName] = useState(name)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [toast, setToast] = useState('')
  // Hydration fix: formatDistanceToNow differs between server/client render times
  const [relativeTime, setRelativeTime] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (lastActiveAt) {
      setRelativeTime(formatDistanceToNow(new Date(lastActiveAt), { addSuffix: true, locale: es }))
    }
  }, [lastActiveAt])

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  async function saveEdit() {
    const trimmed = editName.trim()
    if (!trimmed || trimmed === displayName) { setEditing(false); return }
    const { error } = await supabase
      .from('projects')
      .update({ name: trimmed })
      .eq('id', id)
    if (!error) {
      setDisplayName(trimmed)
      showToast('Proyecto actualizado')
    }
    setEditing(false)
  }

  async function handleDelete() {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (!error) {
      setDeleted(true)
      router.refresh()
    }
    setConfirmDelete(false)
  }

  if (deleted) return null

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1A1B1E] border border-[#C9A84C]/40 text-[#C9A84C] text-sm px-5 py-2.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="bg-[#1A1B1E] border border-[#2a2b30] rounded-xl px-6 py-5 max-w-sm w-full mx-4">
            <p className="text-white font-medium mb-1">¿Eliminar proyecto?</p>
            <p className="text-sm text-[#6b6d75] mb-5">
              <span className="text-white">{displayName}</span> será eliminado permanentemente. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setConfirmDelete(false)}
                className="text-sm text-[#6b6d75] hover:text-white px-4 py-2 transition-colors">
                Cancelar
              </button>
              <button type="button" onClick={handleDelete}
                className="text-sm bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative bg-[#1A1B1E] border border-[#2a2b30] rounded-xl p-6 hover:border-[#C9A84C]/40 transition-colors group">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 mr-3">
            {editing ? (
              <input
                ref={inputRef}
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing(false) }}
                aria-label="Nombre del proyecto"
                className="bg-[#0F0F11] border border-[#C9A84C] rounded-lg px-3 py-1 text-white text-lg font-semibold focus:outline-none w-full"
              />
            ) : (
              <Link href={`/project/${id}`} className="block">
                <h2 className="font-semibold text-lg group-hover:text-[#C9A84C] transition-colors truncate">
                  {displayName}
                </h2>
                {description && (
                  <p className="text-xs text-[#6b6d75] mt-1 line-clamp-2">{description}</p>
                )}
                {phasePill ? (
                  <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${phasePill.color}`}>
                    {phasePill.label}
                  </span>
                ) : (
                  <p className="text-sm text-[#6b6d75] mt-1">{currentPhase ?? 'Semilla'}</p>
                )}
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-[#6b6d75] bg-[#2a2b30] px-2 py-1 rounded-full">
              {relativeTime ?? 'Nuevo'}
            </span>

            {/* Three-dot menu */}
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={e => { e.preventDefault(); setMenuOpen(v => !v) }}
                className="text-[#6b6d75] hover:text-white w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#2a2b30] transition-colors text-lg leading-none"
                title="Opciones"
              >
                ⋮
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-8 z-10 bg-[#1A1B1E] border border-[#2a2b30] rounded-lg shadow-xl overflow-hidden w-36">
                  <button
                    type="button"
                    onClick={() => { setEditing(true); setMenuOpen(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#2a2b30] transition-colors"
                  >
                    Editar nombre
                  </button>
                  <button
                    type="button"
                    onClick={() => { setConfirmDelete(true); setMenuOpen(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-[#2a2b30] transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
