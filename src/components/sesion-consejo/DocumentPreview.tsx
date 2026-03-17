'use client'

import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'

export interface DocumentSection {
  section_name: string
  content: string
  key_points: string[]
}

interface Props {
  documentName: string
  sections: DocumentSection[]
  totalSections: number
  isGenerating: boolean
}

export default function DocumentPreview({ documentName, sections, totalSections, isGenerating }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to latest section
  useEffect(() => {
    if (sections.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [sections.length])

  if (sections.length === 0 && !isGenerating) {
    return (
      <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl px-4 py-3">
        <p className="text-[10px] text-[#8892A4] leading-relaxed">
          {`El documento "${documentName}" se construirá a medida que el consejo debate.`}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1E2A4A] flex items-center justify-between">
        <p className="text-[10px] text-white font-medium truncate">{documentName}</p>
        <span className="text-[9px] text-[#8892A4] shrink-0 ml-2">
          {sections.length} / {Math.max(totalSections, sections.length)} secciones
        </span>
      </div>

      {/* Sections list */}
      <div className="max-h-72 overflow-y-auto">
        {sections.map((section, i) => (
          <SectionItem key={i} section={section} index={i} />
        ))}

        {/* Generating indicator */}
        {isGenerating && (
          <div className="px-4 py-3 border-t border-[#1E2A4A] flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#B8860B]/40 animate-pulse shrink-0" />
            <p className="text-[10px] text-[#B8860B]">Generando sección...</p>
          </div>
        )}

        {/* Pending section placeholders */}
        {!isGenerating && (() => {
          const remaining = totalSections - sections.length
          if (remaining <= 0) return null
          return Array.from({ length: Math.min(remaining, 3) }).map((_, i) => (
            <div key={`pending-${i}`} className="px-4 py-2.5 border-t border-[#1E2A4A] flex items-center gap-2 opacity-40">
              <div className="w-3 h-3 rounded-full border border-[#8892A4]/40 shrink-0" />
              <p className="text-[10px] text-[#8892A4]">Sección pendiente</p>
            </div>
          ))
        })()}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}

function SectionItem({ section, index }: { section: DocumentSection; index: number }) {
  const hasContent = section.content?.length > 0

  return (
    <details className="group border-t border-[#1E2A4A] first:border-t-0">
      <summary className="px-4 py-2.5 flex items-center gap-2 cursor-pointer list-none select-none hover:bg-[#1E2A4A]/30 transition-colors">
        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
        </div>
        <p className="text-[10px] text-[#e0e0e5] flex-1 truncate">{section.section_name}</p>
        <span className="text-[8px] text-[#8892A4] shrink-0 group-open:hidden">▸</span>
        <span className="text-[8px] text-[#8892A4] shrink-0 hidden group-open:inline">▾</span>
      </summary>

      {hasContent && (
        <div className="px-4 pb-3 space-y-2">
          <div className="text-[10px] text-[#8892A4] leading-relaxed prose prose-invert max-w-none" style={{ fontSize: '10px' }}>
            <ReactMarkdown>{section.content.length > 300 ? section.content.slice(0, 300) + '...' : section.content}</ReactMarkdown>
          </div>

          {section.key_points?.length > 0 && (
            <div className="space-y-1">
              {section.key_points.map((point, pi) => (
                <div key={pi} className="flex items-start gap-1.5">
                  <span className="text-[#B8860B] text-[8px] mt-0.5 shrink-0">•</span>
                  <p className="text-[9px] text-[#8892A4]">{point}</p>
                </div>
              ))}
            </div>
          )}

          {index === 0 && section.content.length > 300 && (
            <p className="text-[9px] text-[#B8860B]/60 italic">Ver documento completo →</p>
          )}
        </div>
      )}
    </details>
  )
}
