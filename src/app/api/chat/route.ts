import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callClaude } from '@/lib/claude'
import { NEXO_SEED_SYSTEM } from '@/lib/prompts'
import type { Message } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { projectId, conversationId, messages, phase } = await req.json()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    // Verify project ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()
    if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

    const systemPrompt = NEXO_SEED_SYSTEM

    // Build message history for Claude (exclude last empty if initial)
    const claudeMessages: Array<{ role: 'user' | 'assistant'; content: string }> =
      messages.length === 0
        ? [{ role: 'user', content: 'Inicia la sesión semilla.' }]
        : messages.map((m: Message) => ({ role: m.role, content: m.content }))

    const response = await callClaude(systemPrompt, claudeMessages)

    // Save messages to DB
    const updatedMessages: Message[] = [
      ...messages,
      { role: 'assistant' as const, content: response, author: 'Nexo' }
    ]

    if (conversationId) {
      await supabase.from('conversations')
        .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
        .eq('id', conversationId)
    }

    // Update project last_active_at
    await supabase.from('projects')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', projectId)

    return NextResponse.json({ message: response })
  } catch (err) {
    console.error('Chat API error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
