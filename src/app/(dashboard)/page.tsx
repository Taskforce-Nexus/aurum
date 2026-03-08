export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import NewProjectButton from '@/components/dashboard/NewProjectButton'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user!.id)
    .single()

  const organizationId = org?.id ?? ''

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('organization_id', organizationId)
    .order('last_active_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#0F0F11]">
      {/* Header */}
      <header className="border-b border-[#2a2b30] px-6 py-4 flex items-center justify-between">
        <span className="text-lg font-bold tracking-widest text-[#C9A84C]">AURUM</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#6b6d75]">{user?.email}</span>
          <div className="w-8 h-8 rounded-full bg-[#C9A84C] flex items-center justify-center text-[#0F0F11] text-xs font-bold">
            {user?.email?.[0]?.toUpperCase()}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Mis Proyectos</h1>
            <p className="text-sm text-[#6b6d75] mt-1">{projects?.length ?? 0} proyecto{(projects?.length ?? 0) !== 1 ? 's' : ''}</p>
          </div>
          <NewProjectButton userId={user!.id} organizationId={organizationId} />
        </div>

        {!projects?.length ? (
          <div className="text-center py-24 border border-dashed border-[#2a2b30] rounded-xl">
            <p className="text-[#6b6d75] mb-4">Todavía no tienes proyectos.</p>
            <NewProjectButton userId={user!.id} organizationId={organizationId} primary />
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map(project => (
              <Link key={project.id} href={`/project/${project.id}`}
                className="block bg-[#1A1B1E] border border-[#2a2b30] rounded-xl p-6 hover:border-[#C9A84C]/40 transition-colors group">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-lg group-hover:text-[#C9A84C] transition-colors">{project.name}</h2>
                    <p className="text-sm text-[#6b6d75] mt-1">{project.current_phase ?? 'Semilla'}</p>
                  </div>
                  <span className="text-xs text-[#6b6d75] bg-[#2a2b30] px-2 py-1 rounded-full">
                    {project.last_active_at
                      ? formatDistanceToNow(new Date(project.last_active_at), { addSuffix: true, locale: es })
                      : 'Nuevo'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
