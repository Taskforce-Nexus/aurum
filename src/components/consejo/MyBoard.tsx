'use client'

import Link from 'next/link'
import type { Project, Advisor, Cofounder } from '@/lib/types'
import type { Specialist, BuyerPersona } from '@/app/(dashboard)/project/[id]/consejo/page'
import { toast } from '@/components/ui/Toast'

interface Props {
  project: Project
  advisors: Advisor[]
  cofounders: Cofounder[]
  specialists: Specialist[]
  buyerPersonas: BuyerPersona[]
  council: { id: string; status: string; hats_coverage?: Record<string, boolean> } | null
}

const ALL_HATS = ['blanco', 'negro', 'rojo', 'amarillo', 'verde', 'azul'] as const
type HatKey = typeof ALL_HATS[number]

const HAT_COLORS: Record<HatKey, string> = {
  blanco: '#F5F5F5',
  negro: '#374151',
  rojo: '#EF4444',
  amarillo: '#B8860B',
  verde: '#48BB78',
  azul: '#4299E1',
}

const HAT_BG_CLASSES: Record<HatKey, string> = {
  blanco: 'bg-[#F5F5F5]',
  negro: 'bg-[#374151]',
  rojo: 'bg-[#EF4444]',
  amarillo: 'bg-[#B8860B]',
  verde: 'bg-[#48BB78]',
  azul: 'bg-[#4299E1]',
}

const HAT_LABELS: Record<HatKey, string> = {
  blanco: 'datos',
  negro: 'cautela',
  rojo: 'emociones',
  amarillo: 'optimismo',
  verde: 'creatividad',
  azul: 'proceso',
}

export default function MyBoard({ project, advisors, cofounders, specialists, buyerPersonas }: Props) {
  // Compute hat coverage from all advisors
  const coveredHats = new Set<string>()
  advisors.forEach(a => {
    if (Array.isArray(a.hats)) a.hats.forEach(h => coveredHats.add(h))
  })
  cofounders.forEach(c => {
    if (Array.isArray(c.hats)) c.hats.forEach(h => coveredHats.add(h))
  })
  const coveredCount = ALL_HATS.filter(h => coveredHats.has(h)).length

  const aiCofounders = cofounders.filter(c => !c.is_native)
  const humanCofounders = cofounders.filter(c => c.is_native)

  return (
    <div className="h-screen flex flex-col bg-[#0A1128]">
      {/* Nav */}
      <nav className="h-[60px] flex items-center justify-between px-6 border-b border-[#27282B] shrink-0 bg-[#0A1128]">
        <div className="flex items-center gap-2 text-[13px]">
          <Link href={`/project/${project.id}`} className="text-[#6E8EAD] hover:text-white transition-colors">
            {project.name}
          </Link>
          <span className="text-[#27282B]">/</span>
          <span className="text-white font-medium">Consejo Asesor</span>
        </div>
        <Link
          href={`/project/${project.id}`}
          className="text-[13px] text-[#6E8EAD] hover:text-white transition-colors"
        >
          → Proyecto
        </Link>
      </nav>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main: orgCol */}
        <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Hat Tracker */}
          <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-[#B8860B] uppercase tracking-[2px] font-semibold">Sombreros</span>
              <div className="flex items-center gap-2">
                {ALL_HATS.map(hat => (
                  <div key={hat} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-[6px] h-[6px] rounded-sm ${HAT_BG_CLASSES[hat]} ${coveredHats.has(hat) ? 'opacity-100' : 'opacity-25'}`}
                    />
                    <span className="text-[9px] text-[#4A5568]">{HAT_LABELS[hat]}</span>
                  </div>
                ))}
              </div>
            </div>
            <span className={`text-[12px] font-medium ${coveredCount === 6 ? 'text-[#48BB78]' : 'text-[#B8860B]'}`}>
              {coveredCount}/6 {coveredCount === 6 ? '✓ Cubiertos' : 'cubiertos'}
            </span>
          </div>

          {/* CONSEJEROS */}
          <section className="space-y-3">
            <p className="text-[10px] text-[#B8860B] uppercase tracking-[2px] font-semibold">Consejo Asesor</p>
            {advisors.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {advisors.map(a => <AdvisorCard key={a.id} advisor={a} />)}
              </div>
            ) : (
              <EmptySection label="Sin consejeros configurados aún" />
            )}
          </section>

          {/* ESPECIALISTAS */}
          {specialists.length > 0 && (
            <section className="space-y-3">
              <p className="text-[10px] text-[#6E8EAD] uppercase tracking-[2px] font-semibold">Asesores invitados</p>
              <div className="grid grid-cols-2 gap-3">
                {specialists.map(s => (
                  <div key={s.id} className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#6E8EAD] uppercase tracking-wider font-medium">
                        {s.category_tag ?? 'Especialista'}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                        s.is_confirmed
                          ? 'bg-[#48BB78]/10 text-[#48BB78]'
                          : 'bg-[#B8860B]/10 text-[#B8860B]'
                      }`}>
                        {s.is_confirmed ? 'Confirmado' : 'Pendiente'}
                      </span>
                    </div>
                    <p className="text-[14px] text-[#F8F8F8] font-bold">{s.name}</p>
                    {s.specialty && (
                      <p className="text-[12px] text-[#8B9DB7]">{s.specialty}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* BUYER PERSONAS */}
          {buyerPersonas.length > 0 && (
            <section className="space-y-3">
              <p className="text-[10px] text-[#6E8EAD] uppercase tracking-[2px] font-semibold">Perspectivas de cliente</p>
              <div className="grid grid-cols-2 gap-3">
                {buyerPersonas.map(bp => (
                  <div key={bp.id} className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#6E8EAD] uppercase tracking-wider font-medium">
                        {bp.archetype_label ?? 'ICP'}
                      </span>
                      {bp.is_confirmed && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-[#48BB78]/10 text-[#48BB78]">
                          Confirmado
                        </span>
                      )}
                    </div>
                    <p className="text-[14px] text-[#F8F8F8] font-bold">{bp.name}</p>
                    {bp.demographics && (
                      <p className="text-[11px] text-[#4A5568]">{bp.demographics}</p>
                    )}
                    {bp.quote && (
                      <p className="text-[12px] text-[#8B9DB7] italic">&ldquo;{bp.quote}&rdquo;</p>
                    )}
                    {bp.behavior_tags && bp.behavior_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {bp.behavior_tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 bg-[#0A1128] border border-[#1E2A4A] rounded text-[#6E8EAD]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {advisors.length === 0 && specialists.length === 0 && buyerPersonas.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <p className="text-[16px] text-[#4A5568]">El consejo está vacío</p>
              <p className="text-[13px] text-[#374151] text-center max-w-xs">
                Completa la Sesión de Consejo para configurar tu equipo asesor.
              </p>
              <Link
                href={`/project/${project.id}/sesion-consejo`}
                className="mt-4 px-5 py-2.5 bg-[#B8860B] hover:bg-[#A07710] text-black font-semibold text-[13px] rounded-lg transition-colors"
              >
                Iniciar Sesión de Consejo →
              </Link>
            </div>
          )}
        </main>

        {/* Founders Sidebar */}
        <aside className="w-[280px] shrink-0 overflow-y-auto px-4 py-6">
          <div className="bg-[#0D1535] rounded-[14px] p-5 space-y-5">
            {/* Header */}
            <div>
              <p className="text-[10px] text-[#B8860B] uppercase tracking-[2px] font-semibold">Cofounders</p>
            </div>

            {/* IA cofounders */}
            {aiCofounders.length > 0 && (
              <div className="space-y-2">
                <p className="text-[9px] text-[#48BB78] uppercase tracking-wider font-semibold">IA</p>
                <div className="space-y-2">
                  {aiCofounders.map(c => (
                    <div key={c.id} className="bg-[#0A1128] rounded-lg p-3 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] text-[#F8F8F8] font-medium">{c.name}</p>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                          c.role === 'constructivo'
                            ? 'bg-[#48BB78]/10 text-[#48BB78]'
                            : 'bg-[#E53E3E]/10 text-[#E53E3E]'
                        }`}>
                          {c.role === 'constructivo' ? 'Constructiva' : 'Crítico'}
                        </span>
                      </div>
                      {c.specialty && (
                        <p className="text-[11px] text-[#6E8EAD]">{c.specialty}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Human cofounders */}
            <div className="space-y-2">
              <p className="text-[9px] text-[#8B9DB7] uppercase tracking-wider font-semibold">Humanos</p>
              {humanCofounders.length > 0 ? (
                <div className="space-y-1">
                  {humanCofounders.map(c => (
                    <div key={c.id} className="flex items-center gap-2 py-1.5">
                      <div className="w-6 h-6 rounded-full bg-[#1E2A4A] flex items-center justify-center shrink-0">
                        <span className="text-[9px] text-[#8B9DB7] font-bold uppercase">
                          {c.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-[12px] text-[#F8F8F8]">{c.name}</p>
                        {c.specialty && <p className="text-[10px] text-[#4A5568]">{c.specialty}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-[#4A5568] italic">Sin cofounders humanos</p>
              )}
            </div>

            {/* Divider + total */}
            <div className="border-t border-[#1E2A4A] pt-3 space-y-1">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-[#4A5568]">Total consejeros</span>
                <span className="text-[#F8F8F8] font-medium">{advisors.length}</span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-[#4A5568]">Cofounders</span>
                <span className="text-[#F8F8F8] font-medium">{cofounders.length}</span>
              </div>
              {specialists.length > 0 && (
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[#4A5568]">Especialistas</span>
                  <span className="text-[#F8F8F8] font-medium">{specialists.length}</span>
                </div>
              )}
            </div>

            {/* CTA */}
            <Link
              href={`/project/${project.id}/consultoria`}
              className="block w-full py-3 bg-[#B8860B] hover:bg-[#A07710] text-black font-semibold text-[13px] rounded-lg transition-colors text-center"
            >
              Consultar al consejo →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}

function AdvisorCard({ advisor }: { advisor: Advisor }) {
  const coveredHats = Array.isArray(advisor.hats) ? advisor.hats : []

  return (
    <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-4 space-y-2">
      <div className="flex items-start justify-between">
        <div className="space-y-0.5">
          <p className="text-[10px] text-[#6E8EAD] uppercase tracking-wider font-medium">
            {advisor.specialty ?? advisor.category ?? 'Generalista'}
          </p>
          <p className="text-[14px] text-[#F8F8F8] font-bold">{advisor.name}</p>
          {advisor.communication_style && (
            <p className="text-[12px] text-[#8B9DB7]/50">{advisor.communication_style}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => toast('Próximamente — el selector de consejeros se implementará en la siguiente versión.')}
          className="text-[11px] text-[#B8860B] hover:text-[#D4A017] transition-colors shrink-0 ml-2"
        >
          Cambiar ↗
        </button>
      </div>

      {/* Hat dots */}
      {coveredHats.length > 0 && (
        <div className="flex items-center gap-1 pt-1">
          {ALL_HATS.map(hat => (
            <div
              key={hat}
              className={`w-[6px] h-[6px] rounded-sm ${HAT_BG_CLASSES[hat]} ${coveredHats.includes(hat) ? 'opacity-100' : 'opacity-15'}`}
              title={HAT_LABELS[hat]}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptySection({ label }: { label: string }) {
  return (
    <div className="bg-[#0D1535] border border-[#1E2A4A] border-dashed rounded-xl p-4 text-center">
      <p className="text-[12px] text-[#4A5568]">{label}</p>
    </div>
  )
}
