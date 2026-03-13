import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsBilling from '@/components/settings/SettingsBilling'

export default async function FacturacionPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: balance },
    { data: subscription },
    { data: usage },
    { data: invoices },
    { data: paymentMethods },
  ] = await Promise.all([
    supabase.from('token_balances').select('balance_usd').eq('user_id', user.id).single(),
    supabase.from('subscriptions').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('token_usage').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
    supabase.from('invoices').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
    supabase.from('payment_methods').select('*').eq('user_id', user.id).limit(1),
  ])

  return (
    <SettingsBilling
      balance={balance?.balance_usd ?? 0}
      subscription={subscription}
      usage={usage ?? []}
      invoices={invoices ?? []}
      paymentMethod={paymentMethods?.[0] ?? null}
    />
  )
}
