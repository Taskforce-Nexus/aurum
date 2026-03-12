export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, description, current_phase, entry_level, last_active_at, seed_completed')
    .eq('user_id', user!.id)
    .order('last_active_at', { ascending: false })

  return <DashboardClient projects={projects ?? []} />
}
