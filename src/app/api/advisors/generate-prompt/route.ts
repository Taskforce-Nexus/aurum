import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaude } from '@/lib/claude'
import { GENERATE_ADVISOR_PROMPT, ELEMENT_DESCRIPTIONS, HAT_DESCRIPTIONS } from '@/lib/prompts'
import { getModel } from '@/lib/model-router'
import { getUserPlan } from '@/lib/plan'

export async function POST(req: NextRequest) {
  const { advisor_id } = await req.json()
  if (!advisor_id) return NextResponse.json({ error: 'advisor_id required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: advisor, error } = await supabase
    .from('advisors')
    .select('*')
    .eq('id', advisor_id)
    .single()

  if (error || !advisor) return NextResponse.json({ error: 'Advisor not found' }, { status: 404 })

  const plan = await getUserPlan(user.id)
  const model = getModel(plan, 'system_prompt_generation') ?? 'claude-haiku-4-5-20251001'

  const elementDesc = advisor.element ? (ELEMENT_DESCRIPTIONS[advisor.element] ?? '') : ''
  const hats = (advisor.hats ?? []) as string[]
  const hatsDesc = hats.map((h: string) => `${h} (${HAT_DESCRIPTIONS[h] ?? h})`).join(', ')

  const metaPrompt = GENERATE_ADVISOR_PROMPT
    .replace('{name}', advisor.name ?? '')
    .replace('{specialty}', advisor.specialty ?? '')
    .replace('{category}', advisor.category ?? '')
    .replace('{element}', advisor.element ?? '')
    .replace('{element_description}', elementDesc)
    .replace('{communication_style}', advisor.communication_style ?? '')
    .replace('{hats_description}', hatsDesc)
    .replace('{bio}', advisor.bio ?? '')
    .replace('{specialties_tags}', JSON.stringify(advisor.specialties_tags ?? []))
    .replace('{industries_tags}', JSON.stringify(advisor.industries_tags ?? []))
    .replace('{experience}', JSON.stringify(advisor.experience ?? []))
    .replace('{language}', advisor.language ?? 'Español')

  const prompt = await callClaude({
    system: metaPrompt,
    messages: [{ role: 'user', content: 'Genera el system prompt para este consejero.' }],
    max_tokens: 8192,
    model,
  })

  await supabase
    .from('advisors')
    .update({ system_prompt: prompt })
    .eq('id', advisor_id)

  return NextResponse.json({ prompt })
}
