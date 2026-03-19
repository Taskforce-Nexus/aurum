import { NextResponse } from 'next/server'
import { callClaude } from '@/lib/claude'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_CHARS = 32000 // ~8000 tokens

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const name = file.name.toLowerCase()

    if (name.endsWith('.pdf')) {
      const pdfModule = await import('pdf-parse')
      const pdfParse: (buf: Buffer) => Promise<{ text: string }> = (pdfModule as { default?: unknown }).default as never ?? pdfModule
      const result = await pdfParse(buffer)
      let text: string = result.text ?? ''
      const truncated = text.length > MAX_CHARS
      if (truncated) text = text.slice(0, MAX_CHARS)
      return NextResponse.json({ text, truncated })
    }

    if (name.endsWith('.docx') || name.endsWith('.doc')) {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      let text = result.value ?? ''
      const truncated = text.length > MAX_CHARS
      if (truncated) text = text.slice(0, MAX_CHARS)
      return NextResponse.json({ text, truncated })
    }

    if (name.endsWith('.md') || name.endsWith('.txt')) {
      let text = buffer.toString('utf-8')
      const truncated = text.length > MAX_CHARS
      if (truncated) text = text.slice(0, MAX_CHARS)
      return NextResponse.json({ text, truncated })
    }

    if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg')) {
      const base64 = buffer.toString('base64')
      const mediaType = name.endsWith('.png') ? 'image/png' : 'image/jpeg'
      try {
        const text = await callClaude({
          system: 'Extrae todo el texto visible en esta imagen. Si es un diagrama, describe su contenido detalladamente. Responde solo con el texto extraído o la descripción.',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
                { type: 'text', text: 'Extrae el texto y describe el contenido de esta imagen.' },
              ] as unknown as string,
            },
          ],
          max_tokens: 2048,
          tier: 'fast',
        })
        return NextResponse.json({ text: text.trim(), truncated: false })
      } catch {
        return NextResponse.json({ text: `[Imagen: ${file.name} — no se pudo extraer texto]`, truncated: false })
      }
    }

    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
  } catch (err) {
    console.error('[extract-text]', err)
    return NextResponse.json({ error: 'Failed to extract text' }, { status: 500 })
  }
}
