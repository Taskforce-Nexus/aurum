'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

const PHASE_PROGRESS: Record<string, number> = {
  semilla: 20,
  incubadora: 45,
  build: 70,
  launched: 100,
}

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
  const [relativeTime, setRelativeTime] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const progress = PHASE_PROGRESS[currentPhase ?? 'semilla'] ?? 20

  useEffect(() => {
    if (lastActiveAt) {
      setRelativeTime(formatDistanceToNow(new Date(lastActiveAt), { addSuffix: true, locale: es }))
    }
  }, [lastActiveAt])

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
    const { error } = await supabase.from('projects').update({ name: trimmed }).eq('id', id)
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
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0D1535] border border-[#B8860B]/40 text-[#B8860B] text-sm px-5 py-2.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl px-6 py-5 max-w-sm w-full mx-4">
            <p className="text-white font-medium mb-1">¿Eliminar proyecto?</p>
            <p className="text-sm text-[#8892A4] mb-5">
              <span className="text-white">{displayName}</span> será eliminado permanentemente.
            </p>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setConfirmDelete(false)}
                className="text-sm text-[#8892A4] hover:text-white px-4 py-2 transition-colors">
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

      <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl px-6 py-4 hover:border-[#B8860B]/50 transition-colors">
        {/* Top row: name + menu */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 mr-3">
            {editing ? (
              <input
                ref={inputRef}
                aria-label="Nombre del proyecto"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing(false) }}
                className="bg-[#0A1128] border border-[#B8860B] rounded-lg px-3 py-1 text-white text-base font-semibold focus:outline-none w-full"
              />
            ) : (
              <Link href={`/project/${id}`}>
                <h2 className="font-semibold text-white hover:text-[#B8860B] transition-colors truncate">
                  {displayName}
                  {description && (
                    <span className="font-normal text-[#8892A4] ml-2">— {description}</span>
                  )}
                </h2>
              </Link>
            )}
          </div>

          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={e => { e.preventDefault(); setMenuOpen(v => !v) }}
              className="text-[#8892A4] hover:text-white w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#1E2A4A] transition-colors text-lg"
            >
              ⋯
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-10 bg-[#0D1535] border border-[#1E2A4A] rounded-lg shadow-xl overflow-hidden w-36">
                <button type="button" onClick={() => { setEditing(true); setMenuOpen(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#1E2A4A] transition-colors">
                  Editar nombre
                </button>
                <button type="button" onClick={() => { setConfirmDelete(true); setMenuOpen(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-[#1E2A4A] transition-colors">
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Middle row: phase pill + timestamp */}
        <div className="flex items-center gap-3 mb-4">
          {phasePill && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${phasePill.color}`}>
              {phasePill.label}
            </span>
          )}
          <span className="text-xs text-[#8892A4]">{relativeTime ?? 'Nuevo'}</span>
        </div>

        {/* Progress bar + arrow */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-[#1E2A4A] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#B8860B] rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <Link href={`/project/${id}`}
            className="text-[#8892A4] hover:text-[#B8860B] transition-colors shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </div>
    </>
  )
}
