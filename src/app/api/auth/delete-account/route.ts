import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = createAdminClient()
  const userId = user.id

  try {
    // Delete in dependency order (notifications, usages, subscriptions, projects cascade, profiles, auth user)
    await admin.from('notifications').delete().eq('user_id', userId)
    await admin.from('token_usages').delete().eq('user_id', userId)
    await admin.from('invoices').delete().eq('user_id', userId)
    await admin.from('token_balances').delete().eq('user_id', userId)
    await admin.from('subscriptions').delete().eq('user_id', userId)
    // Projects cascade-deletes sessions, documents, councils, etc. via FK
    await admin.from('projects').delete().eq('user_id', userId)
    await admin.from('profiles').delete().eq('id', userId)

    // Delete the auth user (requires service role)
    const { error: authErr } = await admin.auth.admin.deleteUser(userId)
    if (authErr) {
      console.error('[delete-account] auth.deleteUser error:', authErr)
      return NextResponse.json({ error: authErr.message }, { status: 500 })
    }

    return NextResponse.json({ deleted: true })
  } catch (err) {
    console.error('[delete-account] error:', err)
    return NextResponse.json({ error: 'Error al eliminar la cuenta' }, { status: 500 })
  }
}
