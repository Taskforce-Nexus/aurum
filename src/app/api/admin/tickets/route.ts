import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  if (!(await isAdmin(user.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')

  const admin = createAdminClient()

  let query = admin
    .from('support_tickets')
    .select(`
      id, subject, status, priority, aria_resolved, created_at, updated_at,
      profiles!user_id(email, full_name),
      ticket_messages(count)
    `)
    .order('updated_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (priority) query = query.eq('priority', priority)

  const { data: tickets, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Count escalated
  const { count: escalatedCount } = await admin
    .from('support_tickets')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'escalado')

  return NextResponse.json({ tickets: tickets ?? [], escalated_count: escalatedCount ?? 0 })
}
