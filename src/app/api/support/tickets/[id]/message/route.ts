import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callAria } from '@/lib/aria'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id: ticketId } = await params
  const { content } = await req.json()
  if (!content) return NextResponse.json({ error: 'content requerido' }, { status: 400 })

  const admin = createAdminClient()

  // Verify ticket ownership
  const { data: ticket } = await admin
    .from('support_tickets')
    .select('id, status, user_id')
    .eq('id', ticketId)
    .eq('user_id', user.id)
    .single()

  if (!ticket) return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })

  if (ticket.status === 'resuelto' || ticket.status === 'cerrado') {
    return NextResponse.json({ error: 'Ticket cerrado' }, { status: 400 })
  }

  // Save user message
  const { data: userMsg } = await admin
    .from('ticket_messages')
    .insert({
      ticket_id: ticketId,
      sender_id: user.id,
      sender_role: 'user',
      content,
    })
    .select()
    .single()

  // Update ticket updated_at
  await admin
    .from('support_tickets')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', ticketId)

  // If already escalated, don't auto-call Aria — wait for human
  if (ticket.status === 'escalado') {
    return NextResponse.json({ message: userMsg, aria_response: null })
  }

  // Call Aria automatically
  let ariaResponse: { content: string; escalated: boolean } | null = null
  try {
    ariaResponse = await callAria(ticketId, user.id)
  } catch (e) {
    console.error('[aria-follow-up]', e)
  }

  return NextResponse.json({
    message: userMsg,
    aria_response: ariaResponse?.content ?? null,
    escalated: ariaResponse?.escalated ?? false,
  })
}
