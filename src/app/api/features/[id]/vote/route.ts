import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id: featureId } = await params
  const admin = createAdminClient()

  // Check if already voted
  const { data: existing } = await admin
    .from('feature_votes')
    .select('id')
    .eq('feature_id', featureId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    // Remove vote + decrement
    await admin.from('feature_votes').delete().eq('id', existing.id)
    const { data: feat } = await admin.from('feature_requests').select('votes').eq('id', featureId).single()
    await admin.from('feature_requests').update({ votes: Math.max(0, (feat?.votes ?? 1) - 1) }).eq('id', featureId)
    return NextResponse.json({ voted: false })
  } else {
    // Add vote
    await admin.from('feature_votes').insert({ feature_id: featureId, user_id: user.id })
    const { data: feat } = await admin.from('feature_requests').select('votes').eq('id', featureId).single()
    await admin.from('feature_requests').update({ votes: (feat?.votes ?? 0) + 1 }).eq('id', featureId)
    return NextResponse.json({ voted: true })
  }
}
