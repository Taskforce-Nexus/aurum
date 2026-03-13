'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Project } from '@/lib/types'

interface DocumentSection {
  section_name: string
  content: string
  key_points: string[]
}

interface DocumentRecord {
  id: string
  name: string
  status: string
  content_json: { sections?: DocumentSection[] } | null
  document_specs: {
    id: string
    name: string
    sections: { nombre: string; descripcion: string }[]
    strategic_decision: string | null
    icp: string
  } | null
}

interface NavDoc {
  id: string
  name: string
  status: string
}

interface Props {
  project: Project
  document: DocumentRecord
  allDocuments: NavDoc[]
}

type Tab = 'ajustar' | 'contenido' | 'identidad'

export default function DocumentoViewer({ project, document, allDocuments }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('contenido')
  const [chatInput, setChatInput] = useState('')
  const [activeSlideIdx, setActiveSlideIdx] = useState(0)

  const sections: DocumentSection[] = document.content_json?.sections ?? []
  const specSections = document.document_specs?.sections ?? []
  const currentDocIdx = allDocuments.findIndex(d => d.id === document.id)

  return (
    <div className="h-screen flex flex-col bg-[#0A1128]">
      {/* Header */}
      <header className="h-12 flex items-center justify-between px-5 bg-[#141F3C] border-b-2 border-[#2A3A60] shrink-0">
        {/* Left: breadcrumb */}
        <div className="flex items-center gap-1.5 text-[13px]">
          <Link href={`/project/${project.id}`} className="text-[#8B9DB7] hover:text-white transition-colors">
            ← {project.name}
          </Link>
          <span className="text-[#4A5568]">/</span>
          <span className="text-white font-semibold">{document.name}</span>
        </div>

        {/* Center: document dots nav */}
        <div className="flex items-center gap-2">
          {allDocuments.map((doc, i) => (
            <Link key={doc.id} href={`/project/${project.id}/documento/${doc.id}`}>
              {i === currentDocIdx ? (
                <span className="w-2 h-2 rounded-full bg-[#B8860B] inline-block" />
              ) : (
                <span
                  className="w-2 h-2 rounded-full inline-block border border-[#2A3A60] hover:border-[#8892A4] transition-colors"
                  style={{ background: doc.status === 'aprobado' ? '#16a34a22' : 'transparent' }}
                />
              )}
            </Link>
          ))}
        </div>

        {/* Right: export buttons */}
        <div className="flex items-center gap-2 text-[11px]">
          <ExportBtn label="↓ PDF" docId={document.id} docName={document.name} format="pdf" sections={sections} />
          <div className="w-px h-5 bg-[#2A3A60]" />
          <ExportBtn label="↓ PPT" docId={document.id} docName={document.name} format="pptx" sections={sections} />
          <div className="w-px h-5 bg-[#2A3A60]" />
          <Link
            href={`/project/${project.id}/export`}
            className="text-[#B0C4DE] hover:text-white transition-colors px-2 py-1.5 rounded"
          >
            ↓ Google Slides
          </Link>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left area: slide sidebar + content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Slide sidebar */}
          <div className="w-10 flex flex-col bg-[#0D1535] border-r border-[#1E2A4A] overflow-y-auto">
            {sections.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveSlideIdx(i)}
                className={`h-16 flex items-center justify-center text-[9px] font-mono transition-colors shrink-0 border-b border-[#1E2A4A] ${
                  activeSlideIdx === i
                    ? 'bg-[#B8860B]/10 text-[#B8860B] border-l-2 border-l-[#B8860B]'
                    : 'text-[#4A5568] hover:text-[#8892A4] hover:bg-[#1E2A4A]/30'
                }`}
              >
                {i + 1}
              </button>
            ))}
            {sections.length === 0 &&
              specSections.map((_, i) => (
                <div
                  key={i}
                  className="h-16 flex items-center justify-center text-[9px] font-mono text-[#4A5568] border-b border-[#1E2A4A] shrink-0"
                >
                  {i + 1}
                </div>
              ))}
          </div>

          {/* Main slide viewer */}
          <div className="flex-1 overflow-y-auto p-8 flex justify-center">
            {sections.length > 0 ? (
              <SlideView
                section={sections[activeSlideIdx]}
                index={activeSlideIdx}
                total={sections.length}
                documentName={document.name}
              />
            ) : (
              <EmptyDocumentView document={document} specSections={specSections} />
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px bg-[#1E2A4A] shrink-0" />

        {/* Right panel */}
        <div className="w-[380px] flex flex-col bg-[#0D1535] shrink-0">
          {/* Tab row */}
          <div className="flex border-b border-[#1E2A4A]">
            {(
              [
                { key: 'ajustar' as Tab, label: '💬 Ajustar' },
                { key: 'contenido' as Tab, label: '✏️ Contenido' },
                { key: 'identidad' as Tab, label: '🎨 Identidad' },
              ] as const
            ).map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 h-11 text-[13px] transition-colors ${
                  activeTab === tab.key
                    ? 'text-[#B8860B] font-semibold border-b-2 border-[#B8860B]'
                    : 'text-[#B0C4DE] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'ajustar' && (
              <AjustarPanel chatInput={chatInput} setChatInput={setChatInput} />
            )}
            {activeTab === 'contenido' && (
              <ContenidoPanel
                sections={sections}
                specSections={specSections}
                activeIdx={activeSlideIdx}
                onSelectSection={setActiveSlideIdx}
              />
            )}
            {activeTab === 'identidad' && (
              <IdentidadPanel project={project} documentName={document.name} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Slide View ───────────────────────────────────────────────────────────────

function SlideView({
  section,
  index,
  total,
  documentName,
}: {
  section: DocumentSection
  index: number
  total: number
  documentName: string
}) {
  return (
    <div className="w-full max-w-3xl">
      <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl overflow-hidden">
        {/* Slide header */}
        <div className="px-10 py-8 border-b border-[#1E2A4A] flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[#4A5568] uppercase tracking-widest mb-1">{documentName}</p>
            <h2 className="text-xl text-white font-semibold">{section.section_name}</h2>
          </div>
          <span className="text-[11px] text-[#4A5568]">
            {index + 1} / {total}
          </span>
        </div>

        {/* Content */}
        <div className="px-10 py-8 space-y-6">
          <p className="text-[14px] text-[#C8D4E8] leading-relaxed whitespace-pre-line">
            {section.content}
          </p>

          {section.key_points?.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#1E2A4A]">
              <p className="text-[10px] text-[#B8860B] uppercase tracking-widest font-semibold">Puntos clave</p>
              <ul className="space-y-2">
                {section.key_points.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#B8860B] text-[12px] mt-0.5 shrink-0">•</span>
                    <span className="text-[13px] text-[#8892A4]">{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyDocumentView({
  document,
  specSections,
}: {
  document: DocumentRecord
  specSections: { nombre: string; descripcion: string }[]
}) {
  return (
    <div className="w-full max-w-3xl">
      <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-10 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#1E2A4A] flex items-center justify-center mx-auto">
          <span className="text-[#4A5568] text-xl">📄</span>
        </div>
        <div>
          <p className="text-white font-semibold">{document.name}</p>
          <p className="text-[13px] text-[#8892A4] mt-1">
            {document.status === 'pendiente'
              ? 'Este documento aún no ha sido generado. Inicia una Sesión de Consejo para construirlo.'
              : 'El contenido se está generando en la Sesión de Consejo.'}
          </p>
        </div>
        {specSections.length > 0 && (
          <div className="text-left space-y-2 pt-4 border-t border-[#1E2A4A]">
            <p className="text-[10px] text-[#4A5568] uppercase tracking-widest">Secciones planificadas</p>
            {specSections.map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4A5568] mt-1.5 shrink-0" />
                <div>
                  <p className="text-[12px] text-[#8892A4] font-medium">{s.nombre}</p>
                  <p className="text-[11px] text-[#4A5568]">{s.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Right Panel Tabs ─────────────────────────────────────────────────────────

function AjustarPanel({
  chatInput,
  setChatInput,
}: {
  chatInput: string
  setChatInput: (v: string) => void
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-5 space-y-3">
        <div className="bg-[#B8860B]/10 rounded-lg p-3">
          <p className="text-[12px] text-[#C8A84B] leading-relaxed">
            Menciona <span className="font-semibold text-[#B8860B]">@Nexo</span>, <span className="font-semibold text-[#B8860B]">@Camila</span>, <span className="font-semibold text-[#B8860B]">@Andrés</span> o cualquier asesor para ajustar secciones del documento.
          </p>
        </div>

        <div className="bg-[#1E2A4A]/40 rounded-lg p-3 border-l-2 border-[#3B82F6]">
          <p className="text-[11px] text-[#4A5568] font-medium mb-1">Nexo Constructivo</p>
          <p className="text-[12px] text-[#8892A4] leading-relaxed">
            Esta sección está lista para ajustes. Puedes pedirme que refine el tono, amplíe un punto o adapte el contenido a un nuevo contexto.
          </p>
        </div>
      </div>

      <div className="border-t border-[#1E2A4A] p-4 space-y-2">
        <p className="text-[10px] text-[#4A5568]">Menciona @Nexo, @Camila, @Andrés o cualquier asesor</p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            placeholder="Escribe aquí..."
            className="flex-1 bg-[#0A1128] border border-[#1E2A4A] rounded-lg px-3 py-2 text-[12px] text-white placeholder-[#4A5568] focus:outline-none focus:border-[#B8860B]/50"
          />
          <button
            type="button"
            className="px-3 py-2 bg-[#B8860B]/20 hover:bg-[#B8860B]/30 text-[#B8860B] rounded-lg text-[12px] transition-colors"
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}

function ContenidoPanel({
  sections,
  specSections,
  activeIdx,
  onSelectSection,
}: {
  sections: DocumentSection[]
  specSections: { nombre: string; descripcion: string }[]
  activeIdx: number
  onSelectSection: (i: number) => void
}) {
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-[#8892A4] font-medium uppercase tracking-widest">Secciones</p>
        <span className="text-[10px] text-[#4A5568]">
          {sections.length} / {Math.max(specSections.length, sections.length)}
        </span>
      </div>

      {sections.length > 0 ? (
        <div className="space-y-1">
          {sections.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelectSection(i)}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2 ${
                activeIdx === i
                  ? 'bg-[#B8860B]/10 border border-[#B8860B]/30'
                  : 'hover:bg-[#1E2A4A]/40'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-green-500/60 border border-green-400/60 shrink-0" />
              <span className={`text-[12px] truncate ${activeIdx === i ? 'text-[#B8860B]' : 'text-[#8892A4]'}`}>
                {s.section_name}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {specSections.map((s, i) => (
            <div
              key={i}
              className="px-3 py-2.5 flex items-center gap-2 opacity-40"
            >
              <div className="w-2 h-2 rounded-full border border-[#4A5568] shrink-0" />
              <span className="text-[12px] text-[#4A5568] truncate">{s.nombre}</span>
            </div>
          ))}
        </div>
      )}

      {sections.length > 0 && (
        <div className="pt-3 border-t border-[#1E2A4A] space-y-2">
          <p className="text-[10px] text-[#4A5568] uppercase tracking-widest">Decisión estratégica</p>
          <p className="text-[11px] text-[#8892A4] leading-relaxed">
            Documento generado a partir de la Sesión de Consejo. Para modificar secciones usa la pestaña Ajustar.
          </p>
        </div>
      )}
    </div>
  )
}

function IdentidadPanel({
  project,
  documentName,
}: {
  project: Project
  documentName: string
}) {
  return (
    <div className="p-5 space-y-6">
      {/* Marca */}
      <div className="space-y-3">
        <p className="text-[10px] text-[#B8860B] uppercase tracking-widest font-semibold">Marca</p>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Image
              src="/branding/logo-claro-reason.png"
              alt="Reason"
              width={60}
              height={20}
              className="opacity-70 mt-0.5"
            />
          </div>
          <div>
            <p className="text-[11px] text-[#4A5568]">Proyecto</p>
            <p className="text-[12px] text-[#8892A4]">{project.name}</p>
          </div>
          <div>
            <p className="text-[11px] text-[#4A5568]">Documento</p>
            <p className="text-[12px] text-[#8892A4]">{documentName}</p>
          </div>
        </div>
      </div>

      {/* Paleta */}
      <div className="space-y-3">
        <p className="text-[10px] text-[#B8860B] uppercase tracking-widest font-semibold">Paleta</p>
        <div className="flex gap-2">
          {['#0A1128', '#141F3C', '#B8860B', '#E0E0E5', '#8892A4'].map(color => (
            <div key={color} className="space-y-1 text-center">
              <div
                className="w-8 h-8 rounded-md border border-[#1E2A4A]"
                style={{ background: color }}
              />
              <p className="text-[8px] text-[#4A5568] font-mono">{color}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tipografía */}
      <div className="space-y-3">
        <p className="text-[10px] text-[#B8860B] uppercase tracking-widest font-semibold">Tipografía</p>
        <div className="space-y-2">
          <div>
            <p className="text-[18px] text-white font-semibold" style={{ fontFamily: 'Open Sans' }}>Open Sans</p>
            <p className="text-[11px] text-[#4A5568]">Títulos / Semibold 600</p>
          </div>
          <div>
            <p className="text-[13px] text-[#8892A4]" style={{ fontFamily: 'Open Sans' }}>Cuerpo de texto</p>
            <p className="text-[11px] text-[#4A5568]">Cuerpo / Regular 400</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-[#1E2A4A]">
        <p className="text-[10px] text-[#4A5568] text-center">
          Identidad visual generada por Reason
        </p>
      </div>
    </div>
  )
}

// ─── Export Button ─────────────────────────────────────────────────────────────

function ExportBtn({
  label,
  docId,
  docName,
  format,
  sections,
}: {
  label: string
  docId: string
  docName: string
  format: 'pdf' | 'pptx'
  sections: DocumentSection[]
}) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    if (sections.length === 0) return
    setLoading(true)
    try {
      const res = await fetch(`/api/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId, docName, sections }),
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = window.document.createElement('a')
      a.href = url
      a.download = `${docName.replace(/\s+/g, '_')}.${format === 'pdf' ? 'pdf' : 'pptx'}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading || sections.length === 0}
      className="text-[#B0C4DE] hover:text-white transition-colors px-2 py-1.5 rounded disabled:opacity-40"
    >
      {loading ? '...' : label}
    </button>
  )
}
