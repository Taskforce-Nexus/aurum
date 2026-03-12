import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

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

  // Create token_balances — column is `balance_usd`
  await supabase.from('token_balances').upsert(
    { user_id, balance_usd: 0 },
    { onConflict: 'user_id' }
  )

  // Create subscription — core plan, trial status
  await supabase.from('subscriptions').upsert(
    { user_id, plan: 'core', status: 'trial' },
    { onConflict: 'user_id' }
  )

  return NextResponse.json({ ok: true }, { status: 201 })
}
