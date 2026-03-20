import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import UserMenu from '@/components/dashboard/UserMenu'
import LowBalanceBanner from '@/components/dashboard/LowBalanceBanner'
import InsufficientFundsModal from '@/components/dashboard/InsufficientFundsModal'
import UpgradeModal from '@/components/shared/UpgradeModal'
import SupportWidget from '@/components/shared/SupportWidget'
import LocaleSelector from '@/components/shared/LocaleSelector'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const t = await getTranslations('dashboard')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: balance }, { count: unread }] = await Promise.all([
    supabase.from('profiles').select('name, avatar_url').eq('id', user.id).single(),
    supabase.from('token_balances').select('balance_usd').eq('user_id', user.id).single(),
    supabase.from('notifications').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('is_read', false),
  ])

  const balanceValue = balance?.balance_usd != null ? Number(balance.balance_usd) : 0
  const balanceFormatted = `$${balanceValue.toFixed(2)}`

  return (
    <div className="min-h-screen bg-[#0A1128]">
      {/* Global header */}
      <header className="fixed top-0 left-0 right-0 z-30 border-b border-[#1E2A4A] bg-[#0A1128]/95 backdrop-blur-sm px-6 h-14 flex items-center justify-between">
        {/* Left — Logo */}
        <Link href="/dashboard" className="shrink-0">
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
          <Link href="/settings/notificaciones" className="relative text-[#8892A4] hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {(unread ?? 0) > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {unread! > 9 ? '9+' : unread}
              </span>
            )}
          </Link>

          {/* Token balance — clickable, red if low */}
          <Link
            href="/settings/facturacion"
            data-tour="balance"
            className="hidden sm:flex flex-col items-end hover:opacity-80 transition-opacity"
          >
            <span className={`font-medium text-sm ${balanceValue < 5 ? 'text-red-400' : 'text-white'}`}>
              {balanceFormatted}
            </span>
            <span className="text-[10px] text-[#8892A4]">{t('balance')}</span>
          </Link>

          <LocaleSelector />

          {/* User menu */}
          <UserMenu
            name={profile?.name ?? ''}
            email={user.email ?? ''}
          />
        </div>
      </header>

      {/* Content with header offset */}
      <div className="pt-14">
        <LowBalanceBanner balance={balanceValue} />
        {children}
      </div>

      {/* Global 402 modal */}
      <InsufficientFundsModal />
      {/* Global 403 upgrade modal */}
      <UpgradeModal />
      {/* Support widget — visible in all dashboard pages */}
      <SupportWidget />
    </div>
  )
}
