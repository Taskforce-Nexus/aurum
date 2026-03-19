import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/claude'
import { createClient } from '@/lib/supabase/server'
import { getModel } from '@/lib/model-router'
import { getUserPlan } from '@/lib/plan'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_CHARS = 15000

export async function POST(req: NextRequest) {
  try {
    const { file_url, file_type } = await req.json()
    if (!file_url || !file_type) {
      return NextResponse.json({ error: 'file_url and file_type required' }, { status: 400 })
    }

    // Optional auth — used for model routing; defaults to free tier if not authenticated
    let visionModel = 'claude-haiku-4-5-20251001'
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const plan = await getUserPlan(user.id)
        visionModel = getModel(plan, 'file_extract') ?? visionModel
      }
    } catch { /* non-blocking */ }

    // Download the file
    const response = await fetch(file_url)
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to download file' }, { status: 400 })
    }

    const ext = file_type.toLowerCase().replace('.', '')
    let text = ''

    if (ext === 'pdf') {
      const buffer = Buffer.from(await response.arrayBuffer())
      const pdfModule = await import('pdf-parse')
      const pdfParse: (buf: Buffer) => Promise<{ text: string }> = (pdfModule as { default?: unknown }).default as never ?? pdfModule
      const result = await pdfParse(buffer)
      text = result.text ?? ''
    } else if (ext === 'docx' || ext === 'doc') {
      const buffer = Buffer.from(await response.arrayBuffer())
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      text = result.value ?? ''
    } else if (ext === 'txt' || ext === 'md') {
      text = await response.text()
    } else if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') {
      // Use Claude Vision to extract text from image
      const arrayBuffer = await response.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      const mediaType = ext === 'png' ? 'image/png' : 'image/jpeg'
      try {
        text = await callClaude({
          system: 'Extrae todo el texto visible en esta imagen. Si es un diagrama, describe su contenido detalladamente. Responde solo con el texto extraído o la descripción, sin explicaciones adicionales.',
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
          model: visionModel,
        })
      } catch {
        text = `[Imagen: ${file_url.split('/').pop()} — no se pudo extraer texto]`
      }
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    if (text.length > MAX_CHARS) {
      text = text.slice(0, MAX_CHARS) + '\n\n[Nota: documento truncado a 15,000 caracteres]'
    }

    return NextResponse.json({ text: text.trim(), char_count: text.trim().length })
  } catch (err) {
    console.error('[files/extract]', err)
    return NextResponse.json({ error: 'Failed to extract text' }, { status: 500 })
  }
}
