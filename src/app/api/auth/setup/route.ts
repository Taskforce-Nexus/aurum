import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { PLAN_LIMITS } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const { user_id, full_name } = await req.json()

  if (!user_id) {
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Validate user exists
  const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(user_id)
  if (userError || !user) {
    return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
  }

  // Upsert profile — column is `name` (not full_name)
  await supabase.from('profiles').upsert(
    { id: user_id, name: full_name },
    { onConflict: 'id' }
  )

  // Create subscription — free plan, active status (no credit card required)
  await supabase.from('subscriptions').upsert(
    { user_id, plan: 'free', status: 'activa' },
    { onConflict: 'user_id' }
  )

  // Create token_balances — free tier initial balance ($1.00)
  const initialBalance = PLAN_LIMITS['free']?.initial_balance ?? 1.00
  await supabase.from('token_balances').upsert(
    { user_id, balance_usd: initialBalance },
    { onConflict: 'user_id' }
  )

  return NextResponse.json({ ok: true }, { status: 201 })
}
