import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/claude'
import { NEXO_SEED_SYSTEM } from '@/lib/prompts'
import type { Message } from '@/lib/types'

// In-memory conversation history per Tavus conversation_id.
// Resets on server restart — acceptable for development and short sessions.
const historyMap = new Map<string, Message[]>()

// ─── POST — LLM callback from Tavus ──────────────────────────────────────────
// Tavus sends: { conversation_id, transcript, session_id, ... }
// We respond: { message: string }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      conversation_id?: string
      transcript?: string
      session_id?: string
      // Tavus may send OpenAI-compatible format as well
      messages?: Array<{ role: string; content: string }>
    }

    const conversationId = body.conversation_id ?? 'default'

    // Extract the user message from either format
    let userText: string | undefined
    if (body.transcript?.trim()) {
      userText = body.transcript.trim()
    } else if (body.messages) {
      // OpenAI-compatible fallback
      const last = body.messages.at(-1)
      if (last?.role === 'user') userText = last.content
    }

    if (!userText) {
      return NextResponse.json({ message: '' })
    }

    // Build history
    const history = historyMap.get(conversationId) ?? []
    history.push({ role: 'user', content: userText })

    // Call Claude with Nexo system prompt
    const claudeMessages = history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    const response = await callClaude(
      NEXO_SEED_SYSTEM,
      claudeMessages,
      512,
      'claude-haiku-4-5-20251001'
    )

    // Strip [CONSEJO:...] signal — not relevant for voice session
    const clean = response.replace(/\[CONSEJO:[^\]]+\]\s*/g, '').trim()

    // Store assistant response in history
    history.push({ role: 'assistant', content: clean, author: 'Nexo' })
    historyMap.set(conversationId, history)

    return NextResponse.json({ message: clean })
  } catch (err) {
    console.error('[tavus/llm] Error:', err)
    return NextResponse.json({ message: 'Ocurrió un error. Por favor intenta de nuevo.' })
  }
}

// ─── GET — polling endpoint for NexoModal transcript ────────────────────────
// NexoModal polls this to display real-time transcription in the right panel.
export async function GET(req: NextRequest) {
  const conversationId = req.nextUrl.searchParams.get('conversationId') ?? 'default'
  const history = historyMap.get(conversationId) ?? []
  return NextResponse.json({ messages: history })
}
