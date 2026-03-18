import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaude } from '@/lib/claude'
import { checkBalance, trackUsage } from '@/lib/usage'

const EDIT_DELIVERABLE_PROMPT = `Eres Nexo, arquitecto de entregables estratégicos.

El usuario quiere modificar un entregable específico de su Sesión de Consejo.
Mantén la estructura JSON exacta. Solo modifica lo que el usuario pide.
Mantén nombre, pregunta clave, frameworks, secciones y dependencias que no se mencionan.

ENTREGABLE ACTUAL:
{current_composition}

INSTRUCCIÓN DEL USUARIO:
{instruction}

CONTEXTO DEL FUNDADOR:
{founder_brief}

RESPONDE SOLO EN JSON con la estructura del entregable (sin arrays wrapper):
{
  "name": "Nombre del entregable",
  "key_question": "La pregunta estratégica central",
  "frameworks_used": ["framework1", "framework2"],
  "sections": [
    { "title": "Título sección", "description": "Descripción", "questions": ["Pregunta 1"] }
  ],
  "advisors_needed": ["categoria1"],
  "depends_on": [],
  "feeds_into": []
}`

const ADD_DELIVERABLE_PROMPT = `Eres Nexo, arquitecto de entregables estratégicos.

El usuario quiere agregar UN entregable adicional a su Sesión de Consejo.
Genera solo uno. Debe complementar los existentes sin duplicar.

ENTREGABLES EXISTENTES:
{existing_deliverables}

PETICIÓN DEL USUARIO:
{instruction}

CONTEXTO DEL FUNDADOR:
{founder_brief}

RESPONDE SOLO EN JSON con la estructura del nuevo entregable:
{
  "name": "Nombre del entregable",
  "key_question": "La pregunta estratégica central",
  "frameworks_used": ["framework1"],
  "sections": [
    { "title": "Título sección", "description": "Descripción", "questions": ["Pregunta 1"] }
  ],
  "advisors_needed": ["categoria1"],
  "depends_on": [],
  "feeds_into": []
}`

export async function POST(req: NextRequest) {
  const { project_id, action, document_id, instruction, existing_deliverables } = await req.json()

  if (!project_id || !action) {
    return NextResponse.json({ error: 'project_id and action required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  if (action !== 'remove') {
    const { canProceed } = await checkBalance(user.id)
    if (!canProceed) {
      return NextResponse.json({
        error: 'Saldo insuficiente. Recarga tu saldo para continuar.',
        balance: 0,
      }, { status: 402 })
    }
  }

  // ── remove ───────────────────────────────────────────────────────────────
  if (action === 'remove') {
    if (!document_id) return NextResponse.json({ error: 'document_id required' }, { status: 400 })

    await supabase.from('project_documents').delete().eq('id', document_id)

    // Re-number remaining documents
    const { data: remaining } = await supabase
      .from('project_documents')
      .select('id, deliverable_index')
      .eq('project_id', project_id)
      .eq('status', 'pendiente')
      .order('deliverable_index', { ascending: true })

    if (remaining && remaining.length > 0) {
      for (let i = 0; i < remaining.length; i++) {
        await supabase
          .from('project_documents')
          .update({ deliverable_index: i })
          .eq('id', remaining[i].id)
      }
    }

    return NextResponse.json({ success: true })
  }

  // ── edit ─────────────────────────────────────────────────────────────────
  if (action === 'edit') {
    if (!document_id || !instruction) {
      return NextResponse.json({ error: 'document_id and instruction required' }, { status: 400 })
    }

    const [{ data: docData }, { data: project }] = await Promise.all([
      supabase
        .from('project_documents')
        .select('id, name, key_question, composition, deliverable_index')
        .eq('id', document_id)
        .single(),
      supabase.from('projects').select('founder_brief').eq('id', project_id).single(),
    ])

    if (!docData) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    const prompt = EDIT_DELIVERABLE_PROMPT
      .replace('{current_composition}', JSON.stringify(docData.composition ?? {}, null, 2))
      .replace('{instruction}', instruction)
      .replace('{founder_brief}', project?.founder_brief ?? 'No disponible')

    let updated: Record<string, unknown>
    try {
      const raw = await callClaude({
        system: prompt,
        messages: [{ role: 'user', content: 'Genera el entregable modificado.' }],
        max_tokens: 2048,
        tier: 'strong',
      })
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON in response')
      updated = JSON.parse(jsonMatch[0])
    } catch (e) {
      const err = e as Error
      return NextResponse.json({ error: `Claude error: ${err.message}` }, { status: 502 })
    }

    const { data: saved, error: saveErr } = await supabase
      .from('project_documents')
      .update({
        name: (updated.name as string) ?? docData.name,
        key_question: (updated.key_question as string) ?? docData.key_question,
        composition: updated,
      })
      .eq('id', document_id)
      .select()
      .single()

    if (saveErr) return NextResponse.json({ error: saveErr.message }, { status: 500 })

    try { await trackUsage(user.id, project_id, 'compose_edit') } catch (e) { console.error('Usage tracking failed:', e) }

    return NextResponse.json({ deliverable: saved })
  }

  // ── add ──────────────────────────────────────────────────────────────────
  if (action === 'add') {
    if (!instruction) return NextResponse.json({ error: 'instruction required' }, { status: 400 })

    const { data: project } = await supabase
      .from('projects')
      .select('founder_brief')
      .eq('id', project_id)
      .single()

    const existingText = (existing_deliverables ?? [])
      .map((d: { name: string; key_question: string }) => `- ${d.name}: ${d.key_question}`)
      .join('\n')

    const prompt = ADD_DELIVERABLE_PROMPT
      .replace('{existing_deliverables}', existingText || 'Ninguno aún.')
      .replace('{instruction}', instruction)
      .replace('{founder_brief}', project?.founder_brief ?? 'No disponible')

    let newDoc: Record<string, unknown>
    try {
      const raw = await callClaude({
        system: prompt,
        messages: [{ role: 'user', content: 'Genera el nuevo entregable.' }],
        max_tokens: 2048,
        tier: 'strong',
      })
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON in response')
      newDoc = JSON.parse(jsonMatch[0])
    } catch (e) {
      const err = e as Error
      return NextResponse.json({ error: `Claude error: ${err.message}` }, { status: 502 })
    }

    // Get max deliverable_index
    const { data: existing } = await supabase
      .from('project_documents')
      .select('deliverable_index')
      .eq('project_id', project_id)
      .eq('status', 'pendiente')
      .order('deliverable_index', { ascending: false })
      .limit(1)

    const nextIndex = (existing?.[0]?.deliverable_index ?? -1) + 1

    const { data: inserted, error: insertErr } = await supabase
      .from('project_documents')
      .insert({
        project_id,
        name: newDoc.name as string,
        key_question: newDoc.key_question as string,
        composition: newDoc,
        deliverable_index: nextIndex,
        status: 'pendiente',
      })
      .select()
      .single()

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

    try { await trackUsage(user.id, project_id, 'compose_edit') } catch (e) { console.error('Usage tracking failed:', e) }

    return NextResponse.json({ deliverable: inserted })
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
}
