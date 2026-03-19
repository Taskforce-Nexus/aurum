'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { useState, useEffect } from 'react'

const NAV = [
  { href: '/admin/users',      label: 'Usuarios' },
  { href: '/admin/revenue',    label: 'Revenue' },
  { href: '/admin/api-usage',  label: 'API Usage' },
  { href: '/admin/marketplace', label: 'Marketplace' },
  { href: '/admin/tickets',    label: 'Tickets', badge: true },
  { href: '/admin/features',   label: 'Sugerencias' },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [escalatedCount, setEscalatedCount] = useState(0)

  useEffect(() => {
    fetch('/api/admin/tickets')
      .then(r => r.json())
      .then(d => setEscalatedCount(d.escalated_count ?? 0))
      .catch(() => {})
  }, [])

  return (
    <aside className="w-52 shrink-0 bg-[#0D1535] border-r border-[#1E2A4A] flex flex-col py-6 px-4 gap-1">
      <div className="mb-6 px-2">
        <Image src="/branding/logo-claro-reason.png" alt="Reason" width={80} height={24} />
        <p className="text-[10px] text-[#4A5568] mt-1 uppercase tracking-widest">Admin</p>
      </div>
      {NAV.map(n => (
        <Link
          key={n.href}
          href={n.href}
          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname.startsWith(n.href)
              ? 'bg-[#1E2A4A] text-white'
              : 'text-[#8892A4] hover:text-white hover:bg-[#1E2A4A]/50'
          }`}
        >
          {n.label}
          {n.badge && escalatedCount > 0 && (
            <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {escalatedCount > 99 ? '99+' : escalatedCount}
            </span>
          )}
        </Link>
      ))}
    </aside>
  )
}
