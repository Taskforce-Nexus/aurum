'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toast'

interface Profile {
  name: string
  avatar_url: string | null
  language: string
  timezone: string
}

interface Props {
  userId: string
  email: string
  profile: Profile
}

const LANGUAGES = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
]

const TIMEZONES = [
  'America/Mexico_City',
  'America/Bogota',
  'America/Lima',
  'America/Santiago',
  'America/Buenos_Aires',
  'America/Caracas',
  'America/New_York',
  'Europe/Madrid',
]

export default function SettingsAccount({ email, profile: initialProfile }: Props) {
  const [profile, setProfile] = useState(initialProfile)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleChangePassword() {
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm`,
    })
    if (error) {
      toast('Error al enviar el email. Intenta de nuevo.')
    } else {
      toast('Te enviamos un enlace para cambiar tu contraseña — revisa tu email.')
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    try {
      const res = await fetch('/api/auth/delete-account', { method: 'DELETE' })
      if (res.ok) {
        await supabase.auth.signOut()
        router.push('/')
      } else {
        const data = await res.json()
        toast(data.error ?? 'Error al eliminar la cuenta. Intenta de nuevo.')
        setShowDeleteConfirm(false)
      }
    } catch {
      toast('Error de red. Intenta de nuevo.')
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  const initials = profile.name
    ? profile.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
    : email.slice(0, 2).toUpperCase()

  async function handleSave() {
    setSaving(true)
    try {
      await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          language: profile.language,
          timezone: profile.timezone,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* PERFIL */}
      <section className="space-y-3">
        <p className="text-[11px] text-[#B8860B] uppercase tracking-[2px] font-semibold">Perfil</p>
        <div className="bg-[#0D1535] border border-[#1E2A40] rounded-lg p-6 space-y-6">
          {/* Avatar + name row */}
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-full bg-[#B8860B]/20 border-2 border-[#B8860B]/40 flex items-center justify-center shrink-0">
              <span className="text-[18px] text-[#B8860B] font-bold font-outfit">{initials}</span>
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[11px] text-[#4A5568] uppercase tracking-wider">Nombre</label>
              <input
                type="text"
                value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-[#0A1128] border border-[#1E2A4A] rounded-lg px-3 py-2 text-[14px] text-white focus:outline-none focus:border-[#B8860B]/50"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-[11px] text-[#4A5568] uppercase tracking-wider">Email</label>
            <div className="flex items-center gap-3">
              <input
                type="email"
                value={email}
                disabled
                className="flex-1 bg-[#0A1128] border border-[#1E2A4A] rounded-lg px-3 py-2 text-[14px] text-[#8892A4] cursor-not-allowed"
              />
              <span className="text-[11px] text-green-400 font-medium px-2 py-1 bg-green-400/10 rounded">
                Verificado
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-[#B8860B] hover:bg-[#A07710] disabled:opacity-40 text-black font-semibold text-[13px] rounded-lg transition-colors"
          >
            {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar cambios'}
          </button>
        </div>
      </section>

      {/* PREFERENCIAS */}
      <section className="space-y-3">
        <p className="text-[11px] text-[#B8860B] uppercase tracking-[2px] font-semibold">Preferencias</p>
        <div className="bg-[#0D1535] border border-[#1E2A40] rounded-lg p-6 space-y-5">
          {/* Idioma */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] text-white">Idioma de la interfaz</p>
            </div>
            <select
              value={profile.language}
              onChange={e => setProfile(p => ({ ...p, language: e.target.value }))}
              className="bg-[#0A1128] border border-[#1E2A4A] rounded-lg px-3 py-1.5 text-[13px] text-white focus:outline-none focus:border-[#B8860B]/50"
            >
              {LANGUAGES.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          <div className="border-t border-[#1E2A4A]" />

          {/* Zona horaria */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] text-white">Zona horaria</p>
            </div>
            <select
              value={profile.timezone}
              onChange={e => setProfile(p => ({ ...p, timezone: e.target.value }))}
              className="bg-[#0A1128] border border-[#1E2A4A] rounded-lg px-3 py-1.5 text-[13px] text-white focus:outline-none focus:border-[#B8860B]/50"
            >
              {TIMEZONES.map(tz => (
                <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div className="border-t border-[#1E2A4A]" />

          {/* Notificaciones email */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] text-white">Notificaciones por email</p>
              <p className="text-[12px] text-[#4A5568]">Resúmenes de sesión y alertas de proyecto</p>
            </div>
            <Toggle defaultChecked />
          </div>

          <div className="border-t border-[#1E2A4A]" />

          {/* Voz por defecto */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] text-white">Modo de voz por defecto</p>
              <p className="text-[12px] text-[#4A5568]">Activar VAD al iniciar sesiones</p>
            </div>
            <Toggle defaultChecked={false} />
          </div>
        </div>
      </section>

      {/* SEGURIDAD */}
      <section className="space-y-3">
        <p className="text-[11px] text-[#B8860B] uppercase tracking-[2px] font-semibold">Seguridad</p>
        <div className="bg-[#0D1535] border border-[#1E2A40] rounded-lg p-6 space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-[14px] text-white">Contraseña</p>
            <button
              type="button"
              onClick={handleChangePassword}
              className="text-[13px] text-[#B8860B] hover:text-[#D4A017] transition-colors"
            >
              Cambiar contraseña
            </button>
          </div>

          <div className="border-t border-[#1E2A4A]" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] text-white">Sesiones activas</p>
              <p className="text-[12px] text-[#4A5568]">1 sesión activa ahora</p>
            </div>
            <button
              type="button"
              onClick={() => toast('Sesiones cerradas — vuelve a iniciar sesión si es necesario.')}
              className="text-[13px] text-[#E53E3E] hover:text-red-300 transition-colors"
            >
              Cerrar todas las sesiones
            </button>
          </div>
        </div>
      </section>

      {/* ZONA DE PELIGRO */}
      <section className="space-y-3">
        <p className="text-[11px] text-[#E53E3E] uppercase tracking-[2px] font-semibold">Zona de peligro</p>
        <div className="bg-[#1A0A0A] border border-[#4A1010] rounded-lg p-6 flex items-center justify-between">
          <div>
            <p className="text-[14px] text-white font-medium">Eliminar cuenta</p>
            <p className="text-[12px] text-[#8892A4]">Esta acción es permanente. Se eliminarán todos tus proyectos y documentos.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-[#E53E3E] hover:bg-red-600 text-white text-[13px] font-semibold rounded-lg transition-colors shrink-0"
          >
            Eliminar cuenta
          </button>
        </div>
      </section>

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-8 max-w-md w-full mx-4 space-y-4">
            <h2 className="text-[18px] text-white font-bold font-outfit">¿Eliminar cuenta?</h2>
            <p className="text-[14px] text-[#8892A4]">
              Esta acción es irreversible. Se eliminarán todos tus proyectos, documentos y datos asociados.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 border border-[#1E2A4A] rounded-lg text-[13px] text-[#8892A4] hover:text-white hover:border-[#4A5568] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 py-2.5 bg-[#E53E3E] hover:bg-red-600 disabled:opacity-40 text-white text-[13px] font-semibold rounded-lg transition-colors"
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Toggle({ defaultChecked }: { defaultChecked: boolean }) {
  const [on, setOn] = useState(defaultChecked)
  return (
    <button
      type="button"
      onClick={() => setOn(!on)}
      className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${
        on ? 'bg-[#B8860B]' : 'bg-[#1E2A4A]'
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
          on ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
