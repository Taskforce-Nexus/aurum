'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Project } from '@/lib/types'

interface DocumentSection {
  section_name: string
  content: string
  key_points: string[]
}

interface ExportDocument {
  id: string
  name: string
  status: string
  generated_at: string | null
  last_edited_at: string | null
  content_json: { sections?: DocumentSection[] } | null
  document_specs: { name: string } | null
}

interface Props {
  project: Project
  documents: ExportDocument[]
}

export default function ExportCenter({ project, documents }: Props) {
  const [downloading, setDownloading] = useState<Record<string, boolean>>({})
  const [bulkLoading, setBulkLoading] = useState(false)

  const readyDocs = documents.filter(d => d.status === 'aprobado' || d.status === 'generado')
  const readyCount = readyDocs.length
  const progressBarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (progressBarRef.current) {
      const pct = documents.length > 0 ? (readyCount / documents.length) * 100 : 0
      progressBarRef.current.style.width = `${pct}%`
    }
  }, [readyCount, documents.length])

  async function downloadDoc(doc: ExportDocument, format: 'pdf' | 'pptx') {
    const sections = doc.content_json?.sections ?? []
    if (sections.length === 0) return
    const key = `${doc.id}-${format}`
    setDownloading(prev => ({ ...prev, [key]: true }))
    try {
      const res = await fetch(`/api/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId: doc.id, docName: doc.name, sections }),
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${doc.name.replace(/\s+/g, '_')}.${format === 'pdf' ? 'pdf' : 'pptx'}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silent fail
    } finally {
      setDownloading(prev => ({ ...prev, [key]: false }))
    }
  }

  async function downloadAll() {
    setBulkLoading(true)
    for (const doc of readyDocs) {
      await downloadDoc(doc, 'pdf')
    }
    setBulkLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0A1128] flex flex-col">
      {/* Nav */}
      <nav className="h-[60px] flex items-center justify-between px-16 border-b border-[#27282B] shrink-0">
        <Link href="/dashboard">
          <Image src="/branding/logo-claro-reason.png" alt="Reason" width={80} height={26} />
        </Link>
        <div className="flex items-center gap-4 text-[13px] text-[#6E8EAD]">
          <Link href={`/project/${project.id}`} className="hover:text-white transition-colors">
            {project.name}
          </Link>
          <span className="text-[#27282B]">→</span>
          <Link href={`/project/${project.id}`} className="hover:text-white transition-colors">
            Proyecto
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 px-16 py-10 space-y-8">
        {/* Page header */}
        <div className="space-y-2">
          <Link
            href={`/project/${project.id}`}
            className="text-[13px] text-[#6E8EAD] hover:text-white transition-colors"
          >
            ← {project.name} / Centro de Exportación
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-[28px] text-white font-bold">Centro de Exportación</h1>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={downloadAll}
                disabled={bulkLoading || readyCount === 0}
                className="flex items-center gap-2 px-4 py-2 bg-[#B8860B] hover:bg-[#A07710] disabled:opacity-40 text-black text-[13px] font-semibold rounded-lg transition-colors"
              >
                {bulkLoading ? 'Descargando...' : 'Descargar todo (PDF)'}
              </button>
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 border border-[#2A3A60] hover:border-[#4A5568] text-[#B0C4DE] hover:text-white text-[13px] rounded-lg transition-colors"
              >
                Exportar paquete ↑
              </button>
            </div>
          </div>
          <p className="text-[15px] text-[#8B9DB7]">
            Exporta, empaqueta y entrega tus documentos Reason. Desde PDFs individuales hasta paquetes listos para repositorio, pitch o inversionistas.
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <p className="text-[13px] text-[#B8860B] font-semibold">
            {readyCount} de {documents.length} documentos listos
          </p>
          <div className="w-full h-1.5 bg-[#1A2644] rounded-full">
            <div
              ref={progressBarRef}
              className="h-1.5 bg-[#B8860B] rounded-full transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="border border-[#27282B] rounded-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-4 px-5 py-3 bg-[#0A1128] border-b border-[#27282B]">
            <div className="w-4" />
            <div className="w-[440px] text-[11px] text-[#4A5568] uppercase tracking-wider">Documento</div>
            <div className="w-[130px] text-[11px] text-[#4A5568] uppercase tracking-wider">Estado</div>
            <div className="w-[160px] text-[11px] text-[#4A5568] uppercase tracking-wider">Última edición</div>
            <div className="flex-1 text-[11px] text-[#4A5568] uppercase tracking-wider">Acciones</div>
          </div>

          {/* Rows */}
          {documents.map(doc => (
            <TableRow
              key={doc.id}
              doc={doc}
              projectId={project.id}
              downloading={downloading}
              onDownload={downloadDoc}
            />
          ))}

          {documents.length === 0 && (
            <div className="px-5 py-10 text-center text-[13px] text-[#4A5568]">
              No hay documentos configurados en este proyecto.
            </div>
          )}

          {/* Pagination */}
          {documents.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#0A1128] border-t border-[#27282B]">
              <span className="text-[13px] text-[#4A5568]">
                Mostrando 1-{documents.length} de {documents.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled
                  className="w-7 h-7 flex items-center justify-center border border-[#27282B] rounded text-[#4A5568] text-[12px] disabled:opacity-40"
                >
                  ←
                </button>
                <button
                  type="button"
                  disabled
                  className="w-7 h-7 flex items-center justify-center border border-[#27282B] rounded text-[#4A5568] text-[12px] disabled:opacity-40"
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TableRow({
  doc,
  projectId,
  downloading,
  onDownload,
}: {
  doc: ExportDocument
  projectId: string
  downloading: Record<string, boolean>
  onDownload: (doc: ExportDocument, format: 'pdf' | 'pptx') => void
}) {
  const isReady = doc.status === 'aprobado' || doc.status === 'generado'
  const hasSections = (doc.content_json?.sections?.length ?? 0) > 0

  const statusConfig = {
    aprobado: { label: 'Listo', color: 'text-green-400', dot: 'bg-green-400' },
    generado: { label: 'Listo', color: 'text-green-400', dot: 'bg-green-400' },
    en_progreso: { label: 'En progreso', color: 'text-[#B8860B]', dot: 'bg-[#B8860B]' },
    pendiente: { label: 'Pendiente', color: 'text-[#4A5568]', dot: 'bg-[#4A5568]' },
  }[doc.status] ?? { label: doc.status, color: 'text-[#4A5568]', dot: 'bg-[#4A5568]' }

  function formatDate(iso: string | null) {
    if (!iso) return '—'
    const d = new Date(iso)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000 / 60)
    if (diff < 60) return `Hace ${diff}m`
    if (diff < 1440) return `Hace ${Math.floor(diff / 60)}h`
    return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
  }

  return (
    <div
      className={`flex items-center gap-4 px-5 py-4 border-b border-[#1A2644] last:border-b-0 bg-[#0D1535] ${
        isReady ? '' : 'opacity-60'
      }`}
    >
      {/* Checkbox */}
      <div
        className={`w-4 h-4 rounded border shrink-0 ${
          isReady ? 'border-[#27282B]' : 'border-[#1A2644]'
        }`}
      />

      {/* Document info */}
      <div className="w-[440px] space-y-0.5">
        <p className="text-[14px] text-white font-medium truncate">{doc.name}</p>
        {doc.document_specs?.name && (
          <p className="text-[11px] text-[#4A5568] truncate">{doc.document_specs.name}</p>
        )}
      </div>

      {/* Status */}
      <div className="w-[130px] flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full shrink-0 ${statusConfig.dot}`} />
        <span className={`text-[13px] ${statusConfig.color}`}>{statusConfig.label}</span>
      </div>

      {/* Date */}
      <div className="w-[160px] text-[13px] text-[#4A5568]">
        {formatDate(doc.generated_at ?? doc.last_edited_at ?? '')}
      </div>

      {/* Actions */}
      <div className="flex-1 flex items-center gap-5">
        {isReady ? (
          <>
            <Link
              href={`/project/${projectId}/documento/${doc.id}`}
              className="text-[13px] text-[#B8860B] hover:text-[#D4A017] transition-colors font-medium"
            >
              Vista previa
            </Link>
            <button
              type="button"
              disabled={!hasSections || downloading[`${doc.id}-pdf`]}
              onClick={() => onDownload(doc, 'pdf')}
              className="text-[13px] text-[#B0C4DE] hover:text-white transition-colors disabled:opacity-40"
            >
              {downloading[`${doc.id}-pdf`] ? '...' : 'Descargar'}
            </button>
            <button
              type="button"
              className="text-[13px] text-[#4A5568] hover:text-[#8892A4] transition-colors"
            >
              •••
            </button>
          </>
        ) : (
          <span className="text-[12px] text-[#4A5568] italic">
            Pendiente — se activa en la Sesión de Consejo
          </span>
        )}
      </div>
    </div>
  )
}
