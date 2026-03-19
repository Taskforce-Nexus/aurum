import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callAria } from '@/lib/aria'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { ticket_id } = await req.json()
  if (!ticket_id) return NextResponse.json({ error: 'ticket_id required' }, { status: 400 })

  try {
    const result = await callAria(ticket_id, user.id)
    return NextResponse.json(result)
  } catch (e) {
    const err = e as Error
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
