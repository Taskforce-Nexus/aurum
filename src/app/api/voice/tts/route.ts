import { NextResponse } from 'next/server'

// Cartesia voice selected for Nexo:
// Name: "Manuel - Newsman"
// ID:   948196a7-fe02-417b-9b6d-c45ee0803565
// Spanish-language male voice — newsman style, faster delivery.
// Alt: Alejandro - Calm Mentor (3a35daa1-ba81-451c-9b21-59332e9db2f3)
// Alt: Jeronimo - Empathetic Advisor (7c1ecd2d-1c83-4d5d-a25c-b3820a274a2e)

const NEXO_VOICE_ID = '948196a7-fe02-417b-9b6d-c45ee0803565'

export async function POST(req: Request) {
  try {
    const { text, voiceId: overrideVoiceId, speed: overrideSpeed } = (await req.json()) as {
      text: string
      voiceId?: string
      speed?: number
    }
    const effectiveVoiceId = overrideVoiceId ?? NEXO_VOICE_ID
    const effectiveSpeed   = overrideSpeed   ?? 1.15

    if (!text?.trim()) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    const cartesiaRes = await fetch('https://api.cartesia.ai/tts/bytes', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CARTESIA_API_KEY}`,
        'Cartesia-Version': '2025-04-16',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: 'sonic-3',
        transcript: text,
        voice: { mode: 'id', id: effectiveVoiceId },
        language: 'es',
        speed: effectiveSpeed,
        output_format: {
          container: 'mp3',
          sample_rate: 44100,
          bit_rate: 128000,
        },
      }),
    })

    if (!cartesiaRes.ok) {
      const err = await cartesiaRes.text()
      console.error('[TTS] Cartesia error:', cartesiaRes.status, err)
      return NextResponse.json({ error: 'Cartesia error' }, { status: 502 })
    }

    const audioBuffer = await cartesiaRes.arrayBuffer()

    return new NextResponse(audioBuffer, {
      headers: { 'Content-Type': 'audio/mpeg' },
    })
  } catch (err) {
    console.error('[TTS] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
