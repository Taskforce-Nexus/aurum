import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import jsPDF from 'jspdf'

interface DocumentSection {
  section_name: string
  content: string
  key_points: string[]
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { docName, sections }: { docId: string; docName: string; sections: DocumentSection[] } = await req.json()

    if (!sections?.length) {
      return NextResponse.json({ error: 'No hay secciones para exportar' }, { status: 400 })
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentW = pageW - margin * 2

    // ── Cover page ──────────────────────────────────────────────────────────────
    doc.setFillColor(10, 17, 40) // #0A1128
    doc.rect(0, 0, pageW, pageH, 'F')

    // Gold accent line
    doc.setDrawColor(184, 134, 11)
    doc.setLineWidth(0.5)
    doc.line(margin, 50, pageW - margin, 50)

    // Title
    doc.setTextColor(248, 248, 248)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    const titleLines = doc.splitTextToSize(docName, contentW)
    doc.text(titleLines, margin, 65)

    // Subtitle
    doc.setTextColor(136, 146, 164)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`${sections.length} secciones generadas por Reason`, margin, 80)

    // Date
    const dateStr = new Date().toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })
    doc.setFontSize(9)
    doc.setTextColor(74, 85, 104)
    doc.text(dateStr, margin, pageH - 15)
    doc.text('Generado por Reason', pageW - margin, pageH - 15, { align: 'right' })

    // ── Sections ────────────────────────────────────────────────────────────────
    for (const section of sections) {
      doc.addPage()

      // Background
      doc.setFillColor(10, 17, 40)
      doc.rect(0, 0, pageW, pageH, 'F')

      let y = margin + 10

      // Section name
      doc.setFillColor(20, 31, 60) // #141F3C
      doc.rect(margin - 4, y - 6, contentW + 8, 16, 'F')

      doc.setTextColor(184, 134, 11)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(section.section_name.toUpperCase(), margin, y + 4)
      y += 20

      // Gold divider
      doc.setDrawColor(184, 134, 11)
      doc.setLineWidth(0.3)
      doc.line(margin, y, pageW - margin, y)
      y += 8

      // Content
      doc.setTextColor(200, 212, 232)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const contentLines = doc.splitTextToSize(section.content, contentW)

      for (const line of contentLines) {
        if (y > pageH - 30) {
          doc.addPage()
          doc.setFillColor(10, 17, 40)
          doc.rect(0, 0, pageW, pageH, 'F')
          y = margin
        }
        doc.text(line, margin, y)
        y += 5.5
      }

      // Key points
      if (section.key_points?.length > 0) {
        y += 6

        if (y > pageH - 40) {
          doc.addPage()
          doc.setFillColor(10, 17, 40)
          doc.rect(0, 0, pageW, pageH, 'F')
          y = margin
        }

        doc.setTextColor(184, 134, 11)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text('PUNTOS CLAVE', margin, y)
        y += 6

        doc.setFont('helvetica', 'normal')
        doc.setTextColor(136, 146, 164)
        doc.setFontSize(9)

        for (const point of section.key_points) {
          if (y > pageH - 20) {
            doc.addPage()
            doc.setFillColor(10, 17, 40)
            doc.rect(0, 0, pageW, pageH, 'F')
            y = margin
          }
          const pointLines = doc.splitTextToSize(`• ${point}`, contentW - 4)
          for (const pl of pointLines) {
            doc.text(pl, margin + 2, y)
            y += 5
          }
        }
      }

      // Page footer
      doc.setFontSize(8)
      doc.setTextColor(74, 85, 104)
      doc.text(docName, margin, pageH - 10)
      doc.text(`${sections.indexOf(section) + 1} / ${sections.length}`, pageW - margin, pageH - 10, { align: 'right' })
    }

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${docName.replace(/\s+/g, '_')}.pdf"`,
      },
    })
  } catch (err) {
    console.error('[export/pdf]', err)
    return NextResponse.json({ error: 'Error generando PDF' }, { status: 500 })
  }
}
