import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import IncubadoraChat from '@/components/incubadora/IncubadoraChat'
import type { Project } from '@/lib/types'

export default async function IncubadoraPage({ params }: { params: { id: string } }) {
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

  // Load or create conversation
  let { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('project_id', params.id)
    .eq('phase', 'semilla')
    .single()

  if (!conversation) {
    const { data: newConv } = await supabase.from('conversations').insert({
      project_id: params.id,
      phase: 'semilla',
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
