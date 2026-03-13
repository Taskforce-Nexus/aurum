import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsAccount from '@/components/settings/SettingsAccount'

export default async function CuentaPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, avatar_url, language, timezone')
    .eq('id', user.id)
    .single()

  return (
    <SettingsAccount
      userId={user.id}
      email={user.email ?? ''}
      profile={{
        name: profile?.name ?? '',
        avatar_url: profile?.avatar_url ?? null,
        language: profile?.language ?? 'es',
        timezone: profile?.timezone ?? 'America/Mexico_City',
      }}
    />
  )
}
