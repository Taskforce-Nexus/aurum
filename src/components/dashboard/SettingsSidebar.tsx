'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const TABS = [
  { href: '/settings/cuenta', label: 'Cuenta' },
  { href: '/settings/facturacion', label: 'Facturación y consumo' },
  { href: '/settings/equipo', label: 'Equipo' },
  { href: '/settings/planes', label: 'Planes' },
  { href: '/settings/notificaciones', label: 'Notificaciones' },
  { href: '/settings/conexiones', label: 'Conexiones' },
]

export default function SettingsSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-52 shrink-0">
      <nav className="flex flex-col gap-0.5">
        {TABS.map(tab => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + '/')
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-[#1A1B1E] text-white font-medium border-l-[3px] border-[#C9A84C] pl-[9px]'
                  : 'text-[#6b6d75] hover:text-white hover:bg-[#1A1B1E]'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}

        <div className="border-t border-[#2a2b30] my-2" />

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-[#1A1B1E] transition-colors"
        >
          Cerrar sesión
        </button>
      </nav>
    </aside>
  )
}
