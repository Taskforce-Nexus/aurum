import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio provided' }, { status: 400 })
    }

    const audioBuffer = await audioFile.arrayBuffer()
    const contentType = audioFile.type || 'audio/webm'

    const dgRes = await fetch(
      'https://api.deepgram.com/v1/listen?model=nova-3&language=es-419&smart_format=true&punctuate=true&utterance_end_ms=1000',
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
          'Content-Type': contentType,
        },
        body: audioBuffer,
      }
    )

    if (!dgRes.ok) {
      const err = await dgRes.text()
      console.error('[STT] Deepgram error:', dgRes.status, err)
      return NextResponse.json({ error: 'Deepgram error', transcript: '' }, { status: 502 })
    }

    const data = await dgRes.json()
    const transcript: string =
      data?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? ''

    return NextResponse.json({ transcript })
  } catch (err) {
    console.error('[STT] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal error', transcript: '' }, { status: 500 })
  }
}
