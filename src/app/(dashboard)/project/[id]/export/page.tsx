import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ExportCenter from '@/components/export/ExportCenter'
import type { Project } from '@/lib/types'

export default async function ExportPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!project) notFound()

  const { data: documents } = await supabase
    .from('project_documents')
    .select('id, name, status, generated_at, last_edited_at, content_json, document_specs(name)')
    .eq('project_id', params.id)
    .order('generated_at', { ascending: true, nullsFirst: true })

  return (
    <ExportCenter
      project={project as Project}
      documents={(documents ?? []) as unknown as ExportDocument[]}
    />
  )
}

export interface ExportDocument {
  id: string
  name: string
  status: string
  generated_at: string | null
  last_edited_at: string | null
  content_json: { sections?: { section_name: string; content: string; key_points: string[] }[] } | null
  document_specs: { name: string } | null
}
