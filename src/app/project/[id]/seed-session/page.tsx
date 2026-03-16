import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import IncubadoraChat from '@/components/incubadora/IncubadoraChat'
import SeedSessionFlow from '@/components/seed-session/SeedSessionFlow'
import type { Project, DocumentSpec, Advisor, Cofounder } from '@/lib/types'

export default async function SeedSessionPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!project) notFound()

  // Si ya tiene founder_brief → SeedSessionFlow (Sesión de Consejo, pasos 2-7)
  if (project.founder_brief) {
    const [{ data: documentSpecs }, { data: advisors }, { data: cofounders }] = await Promise.all([
      supabase.from('document_specs').select('*').eq('icp', 'founder').order('created_at'),
      supabase.from('advisors').select('*').eq('is_native', true).order('created_at'),
      supabase.from('cofounders').select('*').eq('is_native', true).order('created_at'),
    ])

    return (
      <SeedSessionFlow
        project={project as Project}
        documentSpecs={(documentSpecs ?? []) as DocumentSpec[]}
        advisors={(advisors ?? []) as Advisor[]}
        cofounders={(cofounders ?? []) as Cofounder[]}
        userEmail={user.email ?? ''}
      />
    )
  }

  // Seed Session aún no completa → chat con Nexo
  const { data: conversations } = await supabase
    .from('conversations')
    .select('*')
    .eq('project_id', params.id)
    .eq('type', 'semilla')
    .order('updated_at', { ascending: false })
    .limit(1)
  let conversation = conversations?.[0] ?? null

  if (!conversation) {
    const { data: newConv } = await supabase.from('conversations').insert({
      project_id: params.id,
      type: 'semilla',
      messages: [],
      progress: { founder_context: 0, product_idea: 0 },
    }).select().single()
    conversation = newConv
  }

  return (
    <IncubadoraChat
      project={project as Project}
      conversation={conversation}
      userEmail={user.email ?? ''}
    />
  )
}
