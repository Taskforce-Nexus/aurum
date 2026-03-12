'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Props {
  name: string
  email: string
}

export default function UserMenu({ name, email }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = name
    ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : email[0]?.toUpperCase() ?? 'U'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 group"
      >
        <div className="w-8 h-8 rounded-full bg-[#B8860B] flex items-center justify-center text-white text-xs font-bold shrink-0">
          {initials}
        </div>
        <span className="text-sm text-white hidden sm:block max-w-[140px] truncate">
          {name || email}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#8892A4]">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 bg-[#0D1535] border border-[#1E2A4A] rounded-xl shadow-2xl w-44 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1E2A4A]">
            <p className="text-xs text-white font-medium truncate">{name || email}</p>
            <p className="text-xs text-[#8892A4] truncate">{email}</p>
          </div>
          <Link
            href="/settings/cuenta"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#8892A4] hover:text-white hover:bg-[#1E2A4A] transition-colors"
          >
            Configuración
          </Link>
          <div className="border-t border-[#1E2A4A]" />
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-[#1E2A4A] transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
