import { NextRequest, NextResponse } from 'next/server'

const TAVUS_API = 'https://tavusapi.com/v2'
const REPLICA_ID = 'r72f7f7f7c8b'

const NEXO_GREETING =
  'Hola, soy Nexo. Estoy aquí para ayudarte a estructurar tu idea en un venture real. ' +
  'Cuéntame — ¿qué problema viste que nadie está resolviendo bien?'

export async function POST(req: NextRequest) {
  try {
    const { project_id } = (await req.json()) as { project_id: string }

    if (!process.env.TAVUS_API_KEY) {
      return NextResponse.json({ error: 'TAVUS_API_KEY no configurada' }, { status: 503 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const requestBody = {
      replica_id: REPLICA_ID,
      callback_url: `${appUrl}/api/tavus/llm`,
      conversation_name: `AURUM Semilla - ${project_id}`,
      custom_greeting: NEXO_GREETING,
      properties: {
        language: 'Spanish',
        enable_transcription: true,
        apply_greenscreen: false,
      },
    }
    console.log('[Tavus] creating conversation, body:', JSON.stringify(requestBody))

    const tavusRes = await fetch(`${TAVUS_API}/conversations`, {
      method: 'POST',
      headers: {
        'x-api-key': process.env.TAVUS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const data = await tavusRes.json()
    console.log('[Tavus] status:', tavusRes.status)
    console.log('[Tavus] response:', JSON.stringify(data))

    if (!tavusRes.ok) {
      return NextResponse.json({ error: data }, { status: tavusRes.status })
    }

    return NextResponse.json({
      conversation_url: data.conversation_url,
      conversation_id: data.conversation_id,
    })
  } catch (err) {
    console.error('[Tavus] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { conversation_id } = (await req.json()) as { conversation_id: string }

    if (!process.env.TAVUS_API_KEY || !conversation_id) {
      return NextResponse.json({ ok: true })
    }

    await fetch(`${TAVUS_API}/conversations/${conversation_id}`, {
      method: 'DELETE',
      headers: { 'x-api-key': process.env.TAVUS_API_KEY },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[tavus/conversation] DELETE error:', err)
    return NextResponse.json({ ok: true }) // non-blocking — always succeed for client
  }
}
