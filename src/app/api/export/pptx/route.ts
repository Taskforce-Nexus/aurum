import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import PptxGenJS from 'pptxgenjs'

interface DocumentSection {
  section_name: string
  content: string
  key_points: string[]
}

const BG_DARK = '0A1128'
const BG_MID = '141F3C'
const GOLD = 'B8860B'
const TEXT_PRIMARY = 'F8F8F8'
const TEXT_SECONDARY = '8892A4'
const ACCENT = 'C8D4E8'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { docName, sections }: { docId: string; docName: string; sections: DocumentSection[] } = await req.json()

    if (!sections?.length) {
      return NextResponse.json({ error: 'No hay secciones para exportar' }, { status: 400 })
    }

    const pptx = new PptxGenJS()
    pptx.layout = 'LAYOUT_WIDE' // 13.33 x 7.5 inches

    // ── Cover slide ─────────────────────────────────────────────────────────────
    const cover = pptx.addSlide()
    cover.background = { color: BG_DARK }

    // Gold accent bar top
    cover.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: '100%', h: 0.06,
      fill: { color: GOLD },
    })

    // Document name
    cover.addText(docName, {
      x: 0.8, y: 1.8, w: 11.5, h: 1.2,
      fontSize: 36,
      bold: true,
      color: TEXT_PRIMARY,
      fontFace: 'Helvetica',
    })

    // Subtitle
    cover.addText(`${sections.length} secciones · Generado por Reason`, {
      x: 0.8, y: 3.2, w: 10, h: 0.5,
      fontSize: 14,
      color: TEXT_SECONDARY,
      fontFace: 'Helvetica',
    })

    // Date
    const dateStr = new Date().toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })
    cover.addText(dateStr, {
      x: 0.8, y: 6.8, w: 6, h: 0.4,
      fontSize: 10,
      color: '4A5568',
      fontFace: 'Helvetica',
    })

    // Gold bottom accent
    cover.addShape(pptx.ShapeType.rect, {
      x: 0, y: 7.44, w: '100%', h: 0.06,
      fill: { color: GOLD },
    })

    // ── Section slides ───────────────────────────────────────────────────────────
    for (const section of sections) {
      const slide = pptx.addSlide()
      slide.background = { color: BG_DARK }

      // Header bar
      slide.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: '100%', h: 1.0,
        fill: { color: BG_MID },
      })

      // Gold left accent
      slide.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: 0.06, h: 1.0,
        fill: { color: GOLD },
      })

      // Section name in header
      slide.addText(section.section_name, {
        x: 0.3, y: 0.15, w: 12.5, h: 0.7,
        fontSize: 20,
        bold: true,
        color: TEXT_PRIMARY,
        fontFace: 'Helvetica',
      })

      // Slide number
      const idx = sections.indexOf(section)
      slide.addText(`${idx + 1} / ${sections.length}`, {
        x: 11.5, y: 0.2, w: 1.6, h: 0.5,
        fontSize: 9,
        color: '4A5568',
        align: 'right',
        fontFace: 'Helvetica',
      })

      // Content
      const contentY = 1.3
      const contentH = section.key_points?.length > 0 ? 3.4 : 5.2

      slide.addText(section.content, {
        x: 0.8, y: contentY, w: 11.7, h: contentH,
        fontSize: 12,
        color: ACCENT,
        fontFace: 'Helvetica',
        valign: 'top',
        wrap: true,
      })

      // Key points
      if (section.key_points?.length > 0) {
        const kpStartY = contentY + contentH + 0.2

        slide.addShape(pptx.ShapeType.rect, {
          x: 0.8, y: kpStartY - 0.1, w: 11.7, h: 0.02,
          fill: { color: '1E2A4A' },
        })

        slide.addText('PUNTOS CLAVE', {
          x: 0.8, y: kpStartY + 0.1, w: 4, h: 0.35,
          fontSize: 9,
          bold: true,
          color: GOLD,
          fontFace: 'Helvetica',
        })

        const pointsText = section.key_points.map(p => ({ text: `• ${p}`, options: {} }))
        slide.addText(pointsText, {
          x: 0.8, y: kpStartY + 0.55, w: 11.7, h: 1.2,
          fontSize: 10,
          color: TEXT_SECONDARY,
          fontFace: 'Helvetica',
          valign: 'top',
          wrap: true,
          paraSpaceBefore: 2,
        })
      }

      // Footer
      slide.addText(docName, {
        x: 0.8, y: 7.15, w: 8, h: 0.3,
        fontSize: 8,
        color: '4A5568',
        fontFace: 'Helvetica',
      })
    }

    const pptxBuffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer
    const arrayBuffer = pptxBuffer.buffer.slice(
      pptxBuffer.byteOffset,
      pptxBuffer.byteOffset + pptxBuffer.byteLength
    ) as ArrayBuffer

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${docName.replace(/\s+/g, '_')}.pptx"`,
      },
    })
  } catch (err) {
    console.error('[export/pptx]', err)
    return NextResponse.json({ error: 'Error generando PPTX' }, { status: 500 })
  }
}
