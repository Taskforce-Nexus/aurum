import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await req.json() as {
      step: string
      projectId: string
      documentSpecIds?: string[]
      advisorIds?: string[]
      cofounderIds?: string[]
      specialists?: { name: string; specialty: string; justification: string }[]
      personas?: { name: string; archetype_label: string; demographics: string; quote: string }[]
    }

    const { step, projectId } = body

    // Verify project ownership
    const { data: project } = await supabase
      .from('projects').select('id').eq('id', projectId).eq('user_id', user.id).single()
    if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

    switch (step) {

      case 'entregables': {
        if (!body.documentSpecIds?.length) break
        // Upsert project_documents for each accepted spec
        const docs = body.documentSpecIds.map(specId => ({
          project_id: projectId,
          spec_id: specId,
          name: '', // will be updated from spec
          status: 'pendiente',
        }))
        // Get spec names
        const { data: specs } = await supabase
          .from('document_specs').select('id, name').in('id', body.documentSpecIds)
        const specNames = Object.fromEntries((specs ?? []).map(s => [s.id, s.name]))
        const docsWithNames = docs.map(d => ({ ...d, name: specNames[d.spec_id ?? ''] ?? d.name }))
        // Delete existing and re-insert
        await supabase.from('project_documents').delete().eq('project_id', projectId)
        await supabase.from('project_documents').insert(docsWithNames)
        break
      }

      case 'cofounders': {
        if (!body.cofounderIds?.length) break
        // Ensure council exists
        const councilId = await ensureCouncil(supabase, projectId)
        if (!councilId) break
        // Upsert cofounders
        await supabase.from('council_cofounders').delete().eq('council_id', councilId)
        const { data: cfs } = await supabase
          .from('cofounders').select('id, role').in('id', body.cofounderIds)
        if (cfs?.length) {
          await supabase.from('council_cofounders').insert(
            cfs.map(c => ({ council_id: councilId, cofounder_id: c.id, role: c.role }))
          )
        }
        break
      }

      case 'consejo_principal': {
        if (!body.advisorIds?.length) break
        const councilId = await ensureCouncil(supabase, projectId)
        if (!councilId) break
        // Upsert advisors
        await supabase.from('council_advisors').delete().eq('council_id', councilId)
        const { data: advs } = await supabase
          .from('advisors').select('id, level').in('id', body.advisorIds)
        if (advs?.length) {
          await supabase.from('council_advisors').insert(
            advs.map(a => ({ council_id: councilId, advisor_id: a.id, level: a.level }))
          )
        }
        break
      }

      case 'especialistas': {
        if (!body.specialists?.length) break
        // Delete existing and insert new
        await supabase.from('specialists').delete().eq('project_id', projectId)
        await supabase.from('specialists').insert(
          body.specialists.map(s => ({
            project_id: projectId,
            name: s.name,
            specialty: s.specialty,
            justification: s.justification,
            is_confirmed: true,
          }))
        )
        break
      }

      case 'icps': {
        if (!body.personas?.length) break
        await supabase.from('buyer_personas').delete().eq('project_id', projectId)
        await supabase.from('buyer_personas').insert(
          body.personas.map(p => ({
            project_id: projectId,
            name: p.name,
            archetype_label: p.archetype_label,
            demographics: p.demographics,
            quote: p.quote,
            is_confirmed: true,
          }))
        )
        break
      }

      case 'consejo_listo': {
        // Mark council as ready + update project phase
        const councilId = await ensureCouncil(supabase, projectId)
        if (councilId) {
          await supabase.from('councils').update({ status: 'listo' }).eq('id', councilId)
        }
        await supabase.from('projects')
          .update({ current_phase: 'sesion_consejo', last_active_at: new Date().toISOString() })
          .eq('id', projectId)
        break
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[seed-session/save]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

async function ensureCouncil(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  projectId: string
): Promise<string | null> {
  const { data: existing } = await supabase
    .from('councils').select('id').eq('project_id', projectId).maybeSingle()
  if (existing) return existing.id
  const { data: created } = await supabase
    .from('councils').insert({ project_id: projectId, status: 'configurando' }).select('id').single()
  return created?.id ?? null
}
