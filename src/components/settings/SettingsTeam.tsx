'use client'

import { useState } from 'react'
import type { TeamMember } from '@/app/(dashboard)/settings/equipo/page'

interface Props {
  currentUserId: string
  currentUserEmail: string
  members: TeamMember[]
}

export default function SettingsTeam({ currentUserEmail, members }: Props) {
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')

  return (
    <div className="space-y-8">
      {/* MIEMBROS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-[#B8860B] uppercase tracking-[2px] font-semibold">Miembros</p>
          <button
            type="button"
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#B8860B]/10 hover:bg-[#B8860B]/20 border border-[#B8860B]/30 text-[#B8860B] text-[12px] font-medium rounded-lg transition-colors"
          >
            + Invitar colaborador
          </button>
        </div>

        <div className="bg-[#0D1535] border border-[#1E2A40] rounded-lg overflow-hidden">
          {/* Table header */}
          <div className="flex items-center gap-4 px-5 py-3 border-b border-[#1E2A4A]">
            <span className="flex-1 text-[10px] text-[#4A5568] uppercase tracking-wider">Miembro</span>
            <span className="w-32 text-[10px] text-[#4A5568] uppercase tracking-wider">Rol</span>
            <span className="w-24 text-[10px] text-[#4A5568] uppercase tracking-wider">Estado</span>
            <span className="w-28 text-[10px] text-[#4A5568] uppercase tracking-wider">Desde</span>
            <span className="w-16 text-[10px] text-[#4A5568] uppercase tracking-wider">Acción</span>
          </div>

          {/* Owner row (current user) */}
          <div className="flex items-center gap-4 px-5 py-3.5 border-b border-[#1E2A4A]/50">
            <div className="flex-1 space-y-0.5">
              <p className="text-[13px] text-white font-medium">{currentUserEmail}</p>
              <p className="text-[11px] text-[#4A5568]">Tú</p>
            </div>
            <div className="w-32">
              <span className="text-[11px] text-[#B8860B] font-medium px-2 py-0.5 bg-[#B8860B]/10 rounded">
                Propietario
              </span>
            </div>
            <div className="w-24">
              <span className="text-[11px] text-green-400">● Activo</span>
            </div>
            <div className="w-28 text-[12px] text-[#4A5568]">—</div>
            <div className="w-16" />
          </div>

          {/* Members */}
          {members.map(m => (
            <MemberRow key={m.id} member={m} />
          ))}

          {members.length === 0 && (
            <div className="px-5 py-8 text-center space-y-2">
              <p className="text-[13px] text-[#4A5568]">Sin colaboradores aún.</p>
              <p className="text-[12px] text-[#4A5568]">
                Invita a cofundadores, asesores o colaboradores a tu equipo.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-8 max-w-md w-full mx-4 space-y-5">
            <h2 className="text-[18px] text-white font-bold font-outfit">Invitar colaborador</h2>

            <div className="space-y-2">
              <label className="text-[11px] text-[#4A5568] uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="correo@empresa.com"
                className="w-full bg-[#0A1128] border border-[#1E2A4A] rounded-lg px-3 py-2 text-[14px] text-white placeholder-[#4A5568] focus:outline-none focus:border-[#B8860B]/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] text-[#4A5568] uppercase tracking-wider">Rol</label>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
                className="w-full bg-[#0A1128] border border-[#1E2A4A] rounded-lg px-3 py-2 text-[14px] text-white focus:outline-none focus:border-[#B8860B]/50"
              >
                <option value="cofounder">Cofundador</option>
                <option value="member">Colaborador</option>
                <option value="advisor">Asesor</option>
              </select>
              <p className="text-[11px] text-[#4A5568]">
                {inviteRole === 'cofounder' && 'Acceso completo al proyecto — editar, sesiones, documentos'}
                {inviteRole === 'member' && 'Puede ver y comentar — sin acceso a sesiones IA'}
                {inviteRole === 'advisor' && 'Solo lectura de documentos aprobados'}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowInvite(false); setInviteEmail('') }}
                className="flex-1 py-2.5 border border-[#1E2A4A] rounded-lg text-[13px] text-[#8892A4] hover:text-white hover:border-[#4A5568] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!inviteEmail.includes('@')}
                className="flex-1 py-2.5 bg-[#B8860B] hover:bg-[#A07710] disabled:opacity-40 text-black font-semibold text-[13px] rounded-lg transition-colors"
              >
                Enviar invitación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MemberRow({ member }: { member: TeamMember }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const roleLabel = {
    lidera: 'Lidera',
    apoya: 'Apoya',
    observa: 'Observa',
    cofounder: 'Cofundador',
    member: 'Colaborador',
    advisor: 'Asesor',
  }[member.role] ?? member.role

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 border-b border-[#1E2A4A]/50 last:border-b-0">
      <div className="flex-1 space-y-0.5">
        <p className="text-[13px] text-white font-medium">{member.name}</p>
        <p className="text-[11px] text-[#4A5568] capitalize">{member.type}</p>
      </div>
      <div className="w-32">
        <span className="text-[12px] text-[#8892A4]">{roleLabel}</span>
      </div>
      <div className="w-24">
        <span className={`text-[11px] ${member.status === 'activo' ? 'text-green-400' : 'text-[#4A5568]'}`}>
          ● {member.status === 'activo' ? 'Activo' : member.status}
        </span>
      </div>
      <div className="w-28 text-[12px] text-[#4A5568]">
        {new Date(member.joined_at).toLocaleDateString('es', { month: 'short', day: 'numeric', year: '2-digit' })}
      </div>
      <div className="w-16 flex justify-end">
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="text-[11px] text-[#4A5568] hover:text-white transition-colors"
            >
              No
            </button>
            <span className="text-[#4A5568]">/</span>
            <button
              type="button"
              className="text-[11px] text-[#E53E3E] hover:text-red-300 transition-colors"
            >
              Sí
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="text-[12px] text-[#4A5568] hover:text-[#E53E3E] transition-colors"
          >
            🗑
          </button>
        )}
      </div>
    </div>
  )
}
