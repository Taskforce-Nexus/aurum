import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
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

    const admin = createAdminClient()

    switch (step) {

      case 'entregables': {
        // compose/route.ts already saved project_documents — nothing to do here.
        // documentSpecIds are project_document IDs, not document_spec IDs.
        // Just acknowledge the step; do NOT delete or re-insert documents.
        break
      }

      case 'cofounders': {
        if (!body.cofounderIds?.length) break
        // Ensure council exists
        const councilId = await ensureCouncil(admin, projectId)
        if (!councilId) break
        // Upsert cofounders
        await admin.from('council_cofounders').delete().eq('council_id', councilId)
        const { data: cfs } = await supabase
          .from('cofounders').select('id, role').in('id', body.cofounderIds)
        if (cfs?.length) {
          await admin.from('council_cofounders').insert(
            cfs.map(c => ({ council_id: councilId, cofounder_id: c.id, role: c.role }))
          )
        }
        break
      }

      case 'consejo_principal': {
        if (!body.advisorIds?.length) break
        const councilId = await ensureCouncil(admin, projectId)
        if (!councilId) break
        // Upsert advisors
        await admin.from('council_advisors').delete().eq('council_id', councilId)
        const { data: advs } = await supabase
          .from('advisors').select('id, level').in('id', body.advisorIds)
        if (advs?.length) {
          await admin.from('council_advisors').insert(
            advs.map(a => ({ council_id: councilId, advisor_id: a.id, level: a.level }))
          )
        }
        break
      }

      case 'especialistas': {
        if (!body.specialists?.length) break
        // Delete existing and insert new
        await admin.from('specialists').delete().eq('project_id', projectId)
        await admin.from('specialists').insert(
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
        await admin.from('buyer_personas').delete().eq('project_id', projectId)
        await admin.from('buyer_personas').insert(
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
        const councilId = await ensureCouncil(admin, projectId)
        if (councilId) {
          await admin.from('councils').update({ status: 'listo' }).eq('id', councilId)
        }
        await admin.from('projects')
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
  admin: ReturnType<typeof createAdminClient>,
  projectId: string
): Promise<string | null> {
  const { data: existing } = await admin
    .from('councils').select('id').eq('project_id', projectId).maybeSingle()
  if (existing) return existing.id
  const { data: created } = await admin
    .from('councils').insert({ project_id: projectId, status: 'configurando' }).select('id').single()
  return created?.id ?? null
}
