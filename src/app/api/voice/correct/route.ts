import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/claude'

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()
    if (!text?.trim()) return NextResponse.json({ corrected: text })

    const corrected = await callClaude(
      'Eres un corrector de transcripciones de voz al español. Corrige ortografía, puntuación y palabras mal reconocidas. Devuelve SOLO el texto corregido, sin explicaciones ni comillas.',
      [{ role: 'user', content: text }],
      256,
      'claude-haiku-4-5-20251001'
    )

    return NextResponse.json({ corrected: corrected.trim() })
  } catch {
    return NextResponse.json({ corrected: null })
  }
}
