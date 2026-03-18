import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ consultationId: string }> }
) {
  const { consultationId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: consultation, error } = await supabase
    .from('consultations')
    .select('*, project:projects(id, name, user_id)')
    .eq('id', consultationId)
    .single()

  if (error || !consultation) {
    return NextResponse.json({ error: 'Consultation not found' }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((consultation as any).project?.user_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  return NextResponse.json({ consultation })
}
