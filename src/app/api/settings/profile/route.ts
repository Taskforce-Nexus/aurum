import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { name, language, timezone } = await req.json()

    const updateData: Record<string, string> = {}
    if (name !== undefined) updateData.name = name
    if (language !== undefined) updateData.language = language
    if (timezone !== undefined) updateData.timezone = timezone

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[settings/profile]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
