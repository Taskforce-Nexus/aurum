import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/claude'
import type { Message } from '@/lib/types'

// ─── In-memory stores ─────────────────────────────────────────────────────────
// LLM conversation history (LLM callback turns)
const historyMap = new Map<string, Message[]>()

// Webhook utterance transcript (conversation.utterance events)
type TranscriptEntry = { role: string; text: string; timestamp: number }
const transcriptStore = new Map<string, TranscriptEntry[]>()

// ─── System prompt ────────────────────────────────────────────────────────────
const NEXO_CVI_SYSTEM = `Eres Nexo. Estás en videollamada con un founder.

REGLA PRINCIPAL: El founder habla. Tú escuchas y haces UNA sola pregunta.

Cómo responder:
- Máximo 1-2 oraciones en total
- Nunca hagas más de una pregunta por turno
- No repitas lo que dijo el founder
- No expliques nada que no te hayan pedido
- No digas "entiendo", "claro", "por supuesto", "qué interesante"
- Si el founder da información incompleta, pregunta solo por lo más importante que falta
- Si el founder da información completa, avanza al siguiente tema con una sola pregunta

Temas que necesitas entender (en orden, uno a la vez):
1. El problema que resuelve
2. A quién le resuelve ese problema
3. Por qué el founder es quien debe resolverlo
4. Con qué recursos cuenta hoy
5. Qué espera lograr en 12 meses

Cuando tengas respuesta suficiente de los 5 temas, di: "Con esto tengo lo que necesito para estructurar tu venture. Voy a generar tu Resumen del Fundador."

Formato: conversación natural, sin listas, sin estructura visible.`

// ─── POST — LLM callback from Tavus + utterance webhook ──────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      event_type?: string
      conversation_id?: string
      role?: string
      transcript?: string
      session_id?: string
      messages?: Array<{ role: string; content: string }>
    }

    console.log('[Tavus webhook] body:', JSON.stringify(body))

    const conversationId = body.conversation_id ?? 'default'

    // ── Utterance webhook (transcription events)
    if (body.event_type === 'conversation.utterance') {
      const entries = transcriptStore.get(conversationId) ?? []
      entries.push({
        role: body.role === 'replica' ? 'Nexo' : 'user',
        text: body.transcript ?? '',
        timestamp: Date.now(),
      })
      transcriptStore.set(conversationId, entries)
      return NextResponse.json({ ok: true })
    }

    // ── LLM callback (generate reply)
    let userText: string | undefined
    if (body.transcript?.trim()) {
      userText = body.transcript.trim()
    } else if (body.messages) {
      const last = body.messages.at(-1)
      if (last?.role === 'user') userText = last.content
    }

    if (!userText) {
      return NextResponse.json({ message: '' })
    }

    const history = historyMap.get(conversationId) ?? []
    history.push({ role: 'user', content: userText })

    const claudeMessages = history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    const response = await callClaude(
      NEXO_CVI_SYSTEM,
      claudeMessages,
      512,
      'claude-haiku-4-5-20251001'
    )

    const clean = response.replace(/\[CONSEJO:[^\]]+\]\s*/g, '').trim()

    history.push({ role: 'assistant', content: clean, author: 'Nexo' })
    historyMap.set(conversationId, history)

    return NextResponse.json({ message: clean })
  } catch (err) {
    console.error('[tavus/llm] Error:', err)
    return NextResponse.json({ message: 'Ocurrió un error. Por favor intenta de nuevo.' })
  }
}

// ─── GET — polling endpoint for NexoModal ────────────────────────────────────
export async function GET(req: NextRequest) {
  const conversationId = req.nextUrl.searchParams.get('conversationId') ?? 'default'
  const history = historyMap.get(conversationId) ?? []
  const transcript = transcriptStore.get(conversationId) ?? []
  return NextResponse.json({ messages: history, transcript })
}
