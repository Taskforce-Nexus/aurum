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
    <aside className="w-[220px] shrink-0 bg-[#070E20] border-r border-[#27282B] flex flex-col min-h-[calc(100vh-56px)]">
      <div className="p-6 flex flex-col flex-1 gap-1">
        {/* Header */}
        <div className="mb-2 space-y-0.5">
          <Link href="/" className="text-[11px] text-[#6E8EAD] hover:text-white transition-colors">
            ← Proyectos / Configuración
          </Link>
          <h1 className="text-[20px] text-white font-bold font-outfit">Configuración</h1>
        </div>

        <div className="h-2" />

        {TABS.map(tab => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + '/')
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center px-3 h-9 rounded-md text-[14px] transition-colors ${
                active
                  ? 'bg-[#141F3C] text-white font-medium border-l-[3px] border-[#B8860B] pl-[9px]'
                  : 'text-[#8B9DB7] hover:text-white hover:bg-[#141F3C]/50'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}

        <div className="border-t border-[#27282B] my-2" />
        <div className="flex-1" />

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full text-left px-3 h-9 rounded-md text-[14px] text-[#E53E3E] hover:text-red-300 hover:bg-[#141F3C]/50 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
