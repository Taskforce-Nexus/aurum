import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createAdminClient()

  const { data: features } = await admin
    .from('feature_requests')
    .select('id, user_id, title, description, status, votes, created_at')
    .order('votes', { ascending: false })

  if (!user) {
    return NextResponse.json({
      features: (features ?? []).map(f => ({ ...f, user_voted: false })),
    })
  }

  // Get user's votes
  const featureIds = (features ?? []).map(f => f.id)
  const { data: userVotes } = featureIds.length > 0
    ? await admin.from('feature_votes').select('feature_id').eq('user_id', user.id).in('feature_id', featureIds)
    : { data: [] }

  const votedSet = new Set((userVotes ?? []).map(v => v.feature_id))

  return NextResponse.json({
    features: (features ?? []).map(f => ({
      ...f,
      user_voted: votedSet.has(f.id),
      is_own: f.user_id === user.id,
    })),
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { title, description } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: 'title requerido' }, { status: 400 })

  const admin = createAdminClient()

  const { data: feature, error } = await admin
    .from('feature_requests')
    .insert({
      user_id: user.id,
      title,
      description: description ?? null,
      status: 'recibida',
      votes: 1,
    })
    .select()
    .single()

  if (error || !feature) return NextResponse.json({ error: error?.message ?? 'Error' }, { status: 500 })

  // Auto-vote by creator
  await admin.from('feature_votes').insert({ feature_id: feature.id, user_id: user.id })

  return NextResponse.json({ feature })
}
