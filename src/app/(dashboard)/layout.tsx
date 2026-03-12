import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import UserMenu from '@/components/dashboard/UserMenu'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: balance }, { count: unread }] = await Promise.all([
    supabase.from('profiles').select('name, avatar_url').eq('id', user.id).single(),
    supabase.from('token_balances').select('balance_usd').eq('user_id', user.id).single(),
    supabase.from('notifications').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('is_read', false),
  ])

  const balanceFormatted = balance?.balance_usd != null
    ? `$${Number(balance.balance_usd).toFixed(2)}`
    : '$0.00'

  return (
    <div className="min-h-screen bg-[#0A1128]">
      {/* Global header */}
      <header className="fixed top-0 left-0 right-0 z-30 border-b border-[#1E2A4A] bg-[#0A1128]/95 backdrop-blur-sm px-6 h-14 flex items-center justify-between">
        {/* Left — Logo */}
        <Link href="/" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/branding/logo-claro-reason.png"
            alt="Reason"
            className="h-7 w-auto"
          />
        </Link>

        {/* Right — Notifications + Balance + User */}
        <div className="flex items-center gap-4">
          {/* Notifications bell */}
          <button type="button" className="relative text-[#8892A4] hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {(unread ?? 0) > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#B8860B] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {unread! > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {/* Token balance */}
          <span className="text-sm hidden sm:block">
            <span className="text-white font-medium">{balanceFormatted}</span>
            <span className="ml-1 text-xs text-[#8892A4]">Sigue</span>
          </span>

          {/* User menu */}
          <UserMenu
            name={profile?.name ?? ''}
            email={user.email ?? ''}
          />
        </div>
      </header>

      {/* Content with header offset */}
      <div className="pt-14">
        {children}
      </div>
    </div>
  )
}
