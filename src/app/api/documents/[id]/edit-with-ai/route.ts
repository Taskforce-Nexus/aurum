import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaude } from '@/lib/claude'
import { trackUsage } from '@/lib/usage'
import { getModel } from '@/lib/model-router'
import { getUserPlan } from '@/lib/plan'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { section_index, instruction } = await req.json()

  if (section_index === undefined || !instruction?.trim()) {
    return NextResponse.json({ error: 'section_index and instruction required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  // Load document
  const { data: doc, error: docErr } = await supabase
    .from('project_documents')
    .select('id, name, key_question, content_json, project_id')
    .eq('id', id)
    .single()

  if (docErr || !doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

  // Verify ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', doc.project_id)
    .eq('user_id', user.id)
    .single()

  if (!project) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const plan = await getUserPlan(user.id)
  const model = getModel(plan, 'edit_document')
  if (!model) {
    return NextResponse.json({ error: 'upgrade_required', feature: 'edit_document', message: 'La edición con IA requiere plan Core o superior' }, { status: 403 })
  }

  const contentJson = (doc.content_json ?? {}) as {
    sections?: Array<Record<string, unknown>>
    [key: string]: unknown
  }
  const sections = contentJson.sections ?? []

  if (section_index < 0 || section_index >= sections.length) {
    return NextResponse.json({ error: `section_index ${section_index} out of bounds` }, { status: 400 })
  }

  const currentSection = sections[section_index]
  const sectionTitle = (currentSection.title ?? currentSection.section_name ?? `Sección ${section_index + 1}`) as string
  const currentContent = (currentSection.content ?? '') as string

  const systemPrompt = `Eres un editor de documentos estratégicos de alta calidad.
Recibirás el contenido actual de una sección de un documento y una instrucción de mejora del usuario.
Devuelve ÚNICAMENTE el nuevo contenido de la sección — sin títulos, sin encabezados, sin explicaciones.
Solo el texto mejorado listo para reemplazar el contenido actual.`

  const userMessage = `DOCUMENTO: ${doc.name}
PREGUNTA CLAVE: ${doc.key_question ?? 'No especificada'}
SECCIÓN: ${sectionTitle}

CONTENIDO ACTUAL:
${currentContent}

INSTRUCCIÓN DEL USUARIO:
${instruction.trim()}

Devuelve el contenido mejorado de esta sección:`

  let improvedContent: string
  try {
    improvedContent = await callClaude({
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      max_tokens: 2048,
      model,
    })
  } catch (e) {
    const err = e as Error
    return NextResponse.json({ error: `Claude error: ${err.message}` }, { status: 502 })
  }

  try { await trackUsage(user.id, doc.project_id, 'compose_edit') } catch { /* non-blocking */ }

  // Update the section
  sections[section_index] = { ...currentSection, content: improvedContent.trim() }
  contentJson.sections = sections

  await supabase
    .from('project_documents')
    .update({
      content_json: contentJson,
      last_edited_at: new Date().toISOString(),
    })
    .eq('id', id)

  return NextResponse.json({ content_json: contentJson, improved_content: improvedContent.trim() })
}
