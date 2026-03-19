import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  if (!(await isAdmin(user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id: featureId } = await params
  const body = await req.json()
  const admin = createAdminClient()

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.status !== undefined)      update.status = body.status
  if (body.admin_notes !== undefined) update.admin_notes = body.admin_notes

  const { error } = await admin
    .from('feature_requests')
    .update(update)
    .eq('id', featureId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
