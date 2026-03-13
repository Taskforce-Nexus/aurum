import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsTeam from '@/components/settings/SettingsTeam'

export default async function EquipoPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all projects owned by this user along with their members
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch organization members if any (using councils as proxy for team)
  const projectIds = (projects ?? []).map(p => p.id)

  let members: TeamMember[] = []
  if (projectIds.length > 0) {
    // Use council_advisors as team members proxy (future: real team_members table)
    const { data: councils } = await supabase
      .from('councils')
      .select('id, project_id')
      .in('project_id', projectIds)

    const councilIds = (councils ?? []).map(c => c.id)
    if (councilIds.length > 0) {
      const { data: advisorMembers } = await supabase
        .from('council_advisors')
        .select('advisor_id, level, created_at, advisors(name)')
        .in('council_id', councilIds)
        .limit(20)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      members = (advisorMembers ?? []).map((m: any) => ({
        id: m.advisor_id,
        name: m.advisors?.name ?? 'Consejero',
        role: m.level,
        status: 'activo',
        joined_at: m.created_at,
        type: 'advisor' as const,
      }))
    }
  }

  return (
    <SettingsTeam
      currentUserId={user.id}
      currentUserEmail={user.email ?? ''}
      members={members}
    />
  )
}

export interface TeamMember {
  id: string
  name: string
  role: string
  status: string
  joined_at: string
  type: 'owner' | 'member' | 'advisor'
}
