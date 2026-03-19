import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaude } from '@/lib/claude'
import { buildCofounderMetaPrompt } from '@/lib/prompts'
import { getModel } from '@/lib/model-router'
import { getUserPlan } from '@/lib/plan'

export async function POST(req: NextRequest) {
  const { cofounder_id } = await req.json()
  if (!cofounder_id) return NextResponse.json({ error: 'cofounder_id required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: cofounder, error } = await supabase
    .from('cofounders')
    .select('*')
    .eq('id', cofounder_id)
    .single()

  if (error || !cofounder) return NextResponse.json({ error: 'Cofounder not found' }, { status: 404 })

  const plan = await getUserPlan(user.id)
  const model = getModel(plan, 'system_prompt_generation') ?? 'claude-haiku-4-5-20251001'

  const metaPrompt = buildCofounderMetaPrompt(cofounder)

  const prompt = await callClaude({
    system: metaPrompt,
    messages: [{ role: 'user', content: 'Genera el system prompt para este cofundador.' }],
    max_tokens: 8192,
    model,
  })

  await supabase
    .from('cofounders')
    .update({ system_prompt: prompt })
    .eq('id', cofounder_id)

  return NextResponse.json({ prompt })
}
