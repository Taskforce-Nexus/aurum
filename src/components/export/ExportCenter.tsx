'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Project } from '@/lib/types'
import { safeFetch } from '@/lib/fetch402'
import type { ExportDocument, ContentJson } from '@/app/(dashboard)/project/[id]/export/page'

interface Props {
  project: Project
  documents: ExportDocument[]
}

// ─── Section helpers ────────────────────────────────────────────────────────

function getSectionTitle(s: NonNullable<ContentJson['sections']>[number]) {
  return s.title ?? s.section_name ?? 'Sección'
}

function isReady(doc: ExportDocument) {
  return doc.status === 'generado' || doc.status === 'aprobado'
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000 / 60)
  if (diff < 60) return `Hace ${diff}m`
  if (diff < 1440) return `Hace ${Math.floor(diff / 60)}h`
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function ExportCenter({ project, documents }: Props) {
  const [localDocuments, setLocalDocuments] = useState<ExportDocument[]>(documents)
  const [downloading, setDownloading] = useState<Record<string, boolean>>({})
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkPptxLoading, setBulkPptxLoading] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<ExportDocument | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)

  const readyDocs = localDocuments.filter(isReady)
  const readyCount = readyDocs.length

  useEffect(() => {
    if (progressBarRef.current) {
      const pct = localDocuments.length > 0 ? (readyCount / localDocuments.length) * 100 : 0
      progressBarRef.current.style.width = `${pct}%`
    }
  }, [readyCount, localDocuments.length])

  async function downloadPDF(doc: ExportDocument) {
    const cj = doc.content_json
    if (!cj) return
    const key = `${doc.id}-pdf`
    setDownloading(prev => ({ ...prev, [key]: true }))
    try {
      const res = await safeFetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docId: doc.id,
          docName: doc.name,
          keyQuestion: doc.key_question,
          contentJson: cj,
        }),
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${doc.name.replace(/\s+/g, '_')}-${project.name.replace(/\s+/g, '_')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silent fail
    } finally {
      setDownloading(prev => ({ ...prev, [key]: false }))
    }
  }

  async function downloadPptx(doc: ExportDocument) {
    if (!doc.content_json) return
    const key = `${doc.id}-pptx`
    setDownloading(prev => ({ ...prev, [key]: true }))
    try {
      const res = await safeFetch('/api/export/pptx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: doc.id, project_name: project.name }),
      })
      if (!res.ok) throw new Error('PPTX export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${doc.name.replace(/\s+/g, '-')}-${project.name.replace(/\s+/g, '-')}.pptx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silent fail
    } finally {
      setDownloading(prev => ({ ...prev, [key]: false }))
    }
  }

  async function downloadAllPptx() {
    setBulkPptxLoading(true)
    try {
      const res = await safeFetch('/api/export/pptx/all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: project.id }),
      })
      if (!res.ok) throw new Error('PPTX all export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.name.replace(/\s+/g, '-')}-sesion-consejo.pptx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silent fail
    } finally {
      setBulkPptxLoading(false)
    }
  }

  async function copyJSON(doc: ExportDocument) {
    if (!doc.content_json) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(doc.content_json, null, 2))
      setCopied(doc.id)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // silent fail
    }
  }

  async function downloadAll() {
    setBulkLoading(true)
    for (const doc of readyDocs) {
      await downloadPDF(doc)
    }
    setBulkLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0A1128] flex flex-col">
      {/* Nav */}
      <nav className="h-[60px] flex items-center justify-between px-16 border-b border-[#1E2A4A] shrink-0">
        <Link href="/dashboard">
          <Image src="/branding/logo-claro-reason.png" alt="Reason" width={80} height={26} />
        </Link>
        <div className="flex items-center gap-2 text-[13px] text-[#6E8EAD]">
          <Link href={`/project/${project.id}`} className="hover:text-white transition-colors">
            {project.name}
          </Link>
          <span className="text-[#1E2A4A]">→</span>
          <span className="text-[#e0e0e5]">Export Center</span>
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
            ← {project.name}
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[28px] text-white font-bold">Export Center</h1>
              <p className="text-[15px] text-[#8892A4] mt-1">
                Documentos generados en tu Sesión de Consejo
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={downloadAllPptx}
                disabled={bulkPptxLoading || readyCount === 0}
                className="flex items-center gap-2 px-4 py-2 border border-[#B8860B]/40 hover:border-[#B8860B] text-[#B8860B] hover:text-white text-[13px] font-semibold rounded-lg transition-colors disabled:opacity-40"
              >
                {bulkPptxLoading ? 'Generando...' : 'Descargar todo (PPTX)'}
              </button>
              <button
                type="button"
                onClick={downloadAll}
                disabled={bulkLoading || readyCount === 0}
                className="flex items-center gap-2 px-4 py-2 bg-[#B8860B] hover:bg-[#A07710] disabled:opacity-40 text-[#0A1128] text-[13px] font-semibold rounded-lg transition-colors"
              >
                {bulkLoading ? 'Descargando...' : 'Descargar todo (PDF)'}
              </button>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <p className="text-[13px] text-[#B8860B] font-semibold">
            {readyCount} de {localDocuments.length} documentos listos
          </p>
          <div className="w-full h-1.5 bg-[#1E2A4A] rounded-full">
            <div ref={progressBarRef} className="h-1.5 bg-[#B8860B] rounded-full transition-all" />
          </div>
        </div>

        {/* Empty state — no documents at all */}
        {localDocuments.length === 0 && (
          <div className="border border-[#1E2A4A] rounded-xl px-8 py-16 text-center">
            <p className="text-sm text-[#8892A4] mb-4">
              Aún no tienes documentos generados. Completa tu Sesión de Consejo para ver tus
              entregables aquí.
            </p>
            <Link
              href={`/project/${project.id}/sesion-consejo`}
              className="inline-flex items-center gap-2 bg-[#B8860B] hover:bg-[#A07710] text-[#0A1128] text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              Ir a Sesión de Consejo →
            </Link>
          </div>
        )}

        {/* Table */}
        {localDocuments.length > 0 && (
          <div className="border border-[#1E2A4A] rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-4 px-5 py-3 bg-[#0A1128] border-b border-[#1E2A4A]">
              <div className="flex-1 text-[11px] text-[#4A5568] uppercase tracking-wider">Entregable</div>
              <div className="w-[130px] text-[11px] text-[#4A5568] uppercase tracking-wider">Estado</div>
              <div className="w-[120px] text-[11px] text-[#4A5568] uppercase tracking-wider">Generado</div>
              <div className="w-[300px] text-[11px] text-[#4A5568] uppercase tracking-wider">Acciones</div>
            </div>

            {localDocuments.map(doc => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                projectName={project.name}
                downloading={downloading}
                copied={copied}
                onView={() => setSelectedDoc(doc)}
                onDownloadPdf={() => downloadPDF(doc)}
                onDownloadPptx={() => downloadPptx(doc)}
                onCopy={() => copyJSON(doc)}
              />
            ))}

            {/* Pagination placeholder */}
            <div className="flex items-center justify-between px-5 py-3 bg-[#0A1128] border-t border-[#1E2A4A]">
              <span className="text-[13px] text-[#4A5568]">
                {localDocuments.length} entregable{localDocuments.length !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled
                  className="w-7 h-7 flex items-center justify-center border border-[#1E2A4A] rounded text-[#4A5568] text-[12px] disabled:opacity-40"
                >
                  ←
                </button>
                <button
                  type="button"
                  disabled
                  className="w-7 h-7 flex items-center justify-center border border-[#1E2A4A] rounded text-[#4A5568] text-[12px] disabled:opacity-40"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Document preview drawer */}
      {selectedDoc && (
        <DocumentDrawer
          doc={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onDocumentUpdate={(updated) => {
            setLocalDocuments(prev => prev.map(d => d.id === updated.id ? updated : d))
            setSelectedDoc(updated)
          }}
        />
      )}
    </div>
  )
}

// ─── Table row ───────────────────────────────────────────────────────────────

function DocumentRow({
  doc,
  downloading,
  copied,
  onView,
  onDownloadPdf,
  onDownloadPptx,
  onCopy,
}: {
  doc: ExportDocument
  projectName: string
  downloading: Record<string, boolean>
  copied: string | null
  onView: () => void
  onDownloadPdf: () => void
  onDownloadPptx: () => void
  onCopy: () => void
}) {
  const ready = isReady(doc)
  const hasContent = (doc.content_json?.sections?.length ?? 0) > 0

  const statusConfig =
    {
      generado: { label: 'Listo', color: 'text-green-400', dot: 'bg-green-400' },
      aprobado: { label: 'Listo', color: 'text-green-400', dot: 'bg-green-400' },
      en_progreso: { label: 'En progreso', color: 'text-[#B8860B]', dot: 'bg-[#B8860B]' },
      pendiente: { label: 'Pendiente', color: 'text-[#4A5568]', dot: 'bg-[#4A5568]' },
    }[doc.status] ?? { label: doc.status, color: 'text-[#4A5568]', dot: 'bg-[#4A5568]' }

  return (
    <div
      className={`flex items-center gap-4 px-5 py-4 border-b border-[#1E2A4A] last:border-b-0 hover:bg-[#0D1535]/60 transition-colors ${
        ready ? '' : 'opacity-60'
      }`}
    >
      {/* Name + key question */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-[14px] text-white font-medium truncate">{doc.name}</p>
        {doc.key_question && (
          <p className="text-[11px] text-[#4A5568] italic truncate">{doc.key_question}</p>
        )}
      </div>

      {/* Status */}
      <div className="w-[130px] flex items-center gap-2 shrink-0">
        <div className={`w-2 h-2 rounded-full shrink-0 ${statusConfig.dot}`} />
        <span className={`text-[13px] ${statusConfig.color}`}>{statusConfig.label}</span>
      </div>

      {/* Date */}
      <div className="w-[120px] text-[13px] text-[#4A5568] shrink-0">
        {formatDate(doc.generated_at)}
      </div>

      {/* Actions */}
      <div className="w-[300px] flex items-center gap-4 shrink-0">
        <button
          type="button"
          onClick={onView}
          className="text-[13px] text-[#B8860B] hover:text-[#D4A017] transition-colors font-medium"
        >
          Ver
        </button>
        {ready && hasContent && (
          <>
            <button
              type="button"
              onClick={onDownloadPdf}
              disabled={downloading[`${doc.id}-pdf`]}
              className="text-[13px] text-[#B8860B] hover:text-[#D4A017] font-semibold transition-colors disabled:opacity-40"
            >
              {downloading[`${doc.id}-pdf`] ? '...' : 'PDF'}
            </button>
            <button
              type="button"
              onClick={onDownloadPptx}
              disabled={downloading[`${doc.id}-pptx`]}
              className="text-[13px] text-[#B8860B] hover:text-[#D4A017] font-semibold transition-colors disabled:opacity-40"
            >
              {downloading[`${doc.id}-pptx`] ? '...' : 'PPTX'}
            </button>
            <button
              type="button"
              onClick={onCopy}
              className="text-[13px] text-[#6E8EAD] hover:text-white transition-colors"
            >
              {copied === doc.id ? '✓ Copiado' : 'Copiar JSON'}
            </button>
          </>
        )}
        {!ready && (
          <span className="text-[12px] text-[#4A5568] italic">
            Pendiente de sesión
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Preview drawer ──────────────────────────────────────────────────────────

function DocumentDrawer({
  doc,
  onClose,
  onDocumentUpdate,
}: {
  doc: ExportDocument
  onClose: () => void
  onDocumentUpdate?: (updated: ExportDocument) => void
}) {
  const [liveDoc, setLiveDoc] = useState<ExportDocument>(doc)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showAiInput, setShowAiInput] = useState(false)
  const [aiInstruction, setAiInstruction] = useState('')
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [editError, setEditError] = useState('')

  const cj = liveDoc.content_json
  const compositionSections = liveDoc.composition?.sections ?? []

  function startEdit(index: number) {
    const sec = cj?.sections?.[index]
    if (!sec) return
    setEditingIndex(index)
    setEditValue(sec.content ?? '')
    setShowAiInput(false)
    setAiInstruction('')
    setEditError('')
  }

  function cancelEdit() {
    setEditingIndex(null)
    setEditValue('')
    setShowAiInput(false)
    setAiInstruction('')
    setEditError('')
  }

  async function handleSave() {
    if (editingIndex === null) return
    setSaving(true)
    setEditError('')
    try {
      const res = await fetch(`/api/documents/${liveDoc.id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section_index: editingIndex, field: 'content', value: editValue }),
      })
      const data = await res.json()
      if (!res.ok) { setEditError(data.error ?? 'Error guardando'); return }
      const updated = { ...liveDoc, content_json: data.content_json }
      setLiveDoc(updated)
      onDocumentUpdate?.(updated)
      cancelEdit()
    } catch {
      setEditError('Error de red. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  async function handleAiImprove() {
    if (editingIndex === null || !aiInstruction.trim()) return
    setAiLoading(true)
    setEditError('')
    try {
      const res = await fetch(`/api/documents/${liveDoc.id}/edit-with-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section_index: editingIndex, instruction: aiInstruction.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setEditError(data.error ?? 'Error con IA'); return }
      const updated = { ...liveDoc, content_json: data.content_json }
      setLiveDoc(updated)
      onDocumentUpdate?.(updated)
      cancelEdit()
    } catch {
      setEditError('Error de red. Intenta de nuevo.')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 h-full w-[420px] bg-[#0D1535] border-l border-[#1E2A4A] z-50 flex flex-col overflow-hidden">
        {/* Drawer header */}
        <div className="shrink-0 px-6 py-5 border-b border-[#1E2A4A] flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-white leading-tight">{liveDoc.name}</h2>
            {liveDoc.key_question && (
              <p className="text-xs text-[#8892A4] italic mt-1 leading-relaxed">
                {liveDoc.key_question}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8892A4] hover:text-white transition-colors shrink-0 text-lg leading-none mt-0.5"
          >
            ✕
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Has content_json */}
          {cj ? (
            <>
              {/* Key question answer */}
              {cj.key_question_answer && (
                <div className="bg-[#0A1128] border border-[#B8860B]/20 rounded-xl px-4 py-4">
                  <p className="text-[10px] text-[#B8860B] uppercase tracking-wider font-medium mb-2">
                    Respuesta a la pregunta clave
                  </p>
                  <p className="text-sm text-[#e0e0e5] leading-relaxed">{cj.key_question_answer}</p>
                </div>
              )}

              {/* Sections — editable */}
              {(cj.sections ?? []).length > 0 && (
                <div className="space-y-4">
                  {(cj.sections ?? []).map((sec, i) => (
                    <div key={i} className="group relative">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs text-[#B8860B] font-semibold uppercase tracking-wider">
                          {getSectionTitle(sec)}
                        </h3>
                        {editingIndex !== i && (
                          <button
                            type="button"
                            onClick={() => startEdit(i)}
                            title="Editar sección"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-[#4A5568] hover:text-[#B8860B] p-1"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                        )}
                      </div>

                      {editingIndex === i ? (
                        /* Edit mode */
                        <div className="space-y-2">
                          <textarea
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            rows={6}
                            className="w-full bg-[#0A1128] border border-[#1E2A4A] focus:border-[#B8860B]/50 rounded-lg px-3 py-2 text-sm text-white leading-relaxed resize-none focus:outline-none"
                          />

                          {!showAiInput ? (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-1.5 bg-[#B8860B] hover:bg-[#A07710] disabled:opacity-40 text-black text-xs font-semibold rounded-lg transition-colors"
                              >
                                {saving ? 'Guardando...' : 'Guardar'}
                              </button>
                              <button
                                type="button"
                                onClick={() => { setShowAiInput(true); setEditError('') }}
                                className="flex-1 py-1.5 border border-[#B8860B]/40 hover:border-[#B8860B] text-[#B8860B] text-xs font-semibold rounded-lg transition-colors"
                              >
                                ✨ Mejorar con IA
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="px-3 py-1.5 border border-[#1E2A4A] text-[#8892A4] hover:text-white text-xs rounded-lg transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={aiInstruction}
                                onChange={e => setAiInstruction(e.target.value)}
                                placeholder="¿Qué quieres cambiar? Ej: Agrega datos de mercado para México 2024"
                                className="w-full bg-[#0A1128] border border-[#1E2A4A] focus:border-[#B8860B]/50 rounded-lg px-3 py-2 text-xs text-white placeholder-[#4A5568] focus:outline-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={handleAiImprove}
                                  disabled={aiLoading || !aiInstruction.trim()}
                                  className="flex-1 py-1.5 bg-[#B8860B] hover:bg-[#A07710] disabled:opacity-40 text-black text-xs font-semibold rounded-lg transition-colors"
                                >
                                  {aiLoading ? 'Procesando (~10s)...' : 'Aplicar con IA'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowAiInput(false)}
                                  className="px-3 py-1.5 border border-[#1E2A4A] text-[#8892A4] hover:text-white text-xs rounded-lg transition-colors"
                                >
                                  ←
                                </button>
                              </div>
                            </div>
                          )}

                          {editError && (
                            <p className="text-[11px] text-red-400">{editError}</p>
                          )}
                        </div>
                      ) : (
                        /* View mode */
                        <>
                          <p className="text-sm text-[#e0e0e5] leading-relaxed whitespace-pre-line">
                            {sec.content}
                          </p>
                          {sec.key_points && sec.key_points.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {sec.key_points.map((pt, pi) => (
                                <li key={pi} className="flex items-start gap-2 text-xs text-[#8892A4]">
                                  <span className="text-[#B8860B] mt-0.5 shrink-0">•</span>
                                  {pt}
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Key insights */}
              {(cj.key_insights ?? []).length > 0 && (
                <div>
                  <h3 className="text-xs text-[#B8860B] font-semibold uppercase tracking-wider mb-2">
                    Insights clave
                  </h3>
                  <ul className="space-y-1.5">
                    {(cj.key_insights ?? []).map((ins, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#e0e0e5]">
                        <span className="text-[#B8860B] mt-0.5 shrink-0">→</span>
                        {ins}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {(cj.recommendations ?? []).length > 0 && (
                <div>
                  <h3 className="text-xs text-green-400 font-semibold uppercase tracking-wider mb-2">
                    Recomendaciones
                  </h3>
                  <ul className="space-y-1.5">
                    {(cj.recommendations ?? []).map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#e0e0e5]">
                        <span className="text-green-400 mt-0.5 shrink-0">✓</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risks */}
              {(cj.risks ?? []).length > 0 && (
                <div>
                  <h3 className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-2">
                    Riesgos identificados
                  </h3>
                  <ul className="space-y-1.5">
                    {(cj.risks ?? []).map((risk, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#e0e0e5]">
                        <span className="text-red-400 mt-0.5 shrink-0">!</span>
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            /* No content_json — show composition placeholders */
            <div className="space-y-3">
              <p className="text-xs text-[#8892A4] italic">
                Este documento se generará al completar la fase correspondiente en la Sesión de Consejo.
              </p>
              {compositionSections.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] text-[#B8860B] uppercase tracking-wider font-medium">
                    Secciones planificadas
                  </p>
                  {compositionSections.map((sec, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-[#0A1128] border border-[#1E2A4A] rounded-lg opacity-60">
                      <div className="w-3 h-3 rounded-full border border-[#1E2A4A] shrink-0" />
                      <p className="text-xs text-[#8892A4]">{sec.title}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer footer */}
        <div className="shrink-0 px-6 py-4 border-t border-[#1E2A4A]">
          <button
            type="button"
            onClick={onClose}
            className="w-full text-sm text-[#8892A4] border border-[#1E2A4A] py-2.5 rounded-xl hover:text-white hover:border-[#8892A4] transition-colors"
          >
            Cerrar
          </button>
        </div>
      </aside>
    </>
  )
}
