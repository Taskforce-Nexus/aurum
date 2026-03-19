import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callAria } from '@/lib/aria'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: tickets, error } = await admin
    .from('support_tickets')
    .select(`
      id, subject, description, status, priority, aria_resolved, created_at, updated_at,
      ticket_messages(count)
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tickets: tickets ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { subject, description, project_id } = await req.json()
  if (!subject || !description) {
    return NextResponse.json({ error: 'subject y description requeridos' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 1. Create ticket
  const { data: ticket, error: ticketErr } = await admin
    .from('support_tickets')
    .insert({
      user_id: user.id,
      subject,
      description,
      status: 'abierto',
      priority: 'normal',
      ...(project_id ? { project_id } : {}),
    })
    .select()
    .single()

  if (ticketErr || !ticket) {
    return NextResponse.json({ error: ticketErr?.message ?? 'Error creando ticket' }, { status: 500 })
  }

  // 2. Save initial user message
  await admin.from('ticket_messages').insert({
    ticket_id: ticket.id,
    sender_id: user.id,
    sender_role: 'user',
    content: description,
  })

  // 3. Invoke Aria automatically
  let ariaResponse: { content: string; escalated: boolean } | null = null
  try {
    ariaResponse = await callAria(ticket.id, user.id)
  } catch (e) {
    console.error('[aria-auto]', e)
  }

  return NextResponse.json({ ticket, aria_response: ariaResponse?.content ?? null })
}
