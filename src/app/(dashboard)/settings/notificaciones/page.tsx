'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Notification {
  id: string
  type: string
  title: string
  is_read: boolean
  created_at: string
  project_id: string | null
}

const TYPE_ICON: Record<string, string> = {
  documento_generado: '📄',
  sesion_completada: '✅',
  saldo_bajo: '⚠️',
  pago_procesado: '💳',
  factura_disponible: '🧾',
  consejero_disponible: '🤝',
  miembro_unido: '👤',
}

const PREF_SETTINGS = [
  {
    id: 'session_complete',
    label: 'Sesión de Consejo completada',
    description: 'Cuando tu Sesión de Consejo finaliza y los documentos están listos.',
    defaultValue: true,
    category: 'Actividad',
  },
  {
    id: 'document_generated',
    label: 'Documento generado',
    description: 'Cuando un nuevo documento estratégico es generado por el consejo.',
    defaultValue: true,
    category: 'Actividad',
  },
  {
    id: 'consultation_response',
    label: 'Respuesta de consultoría',
    description: 'Cuando recibes una respuesta de tu consejo en Consultoría Activa.',
    defaultValue: false,
    category: 'Actividad',
  },
  {
    id: 'weekly_digest',
    label: 'Resumen semanal',
    description: 'Un email semanal con el progreso de tus proyectos activos.',
    defaultValue: true,
    category: 'Email',
  },
  {
    id: 'product_updates',
    label: 'Actualizaciones del producto',
    description: 'Nuevas funcionalidades y mejoras en Reason.',
    defaultValue: true,
    category: 'Email',
  },
  {
    id: 'billing_alerts',
    label: 'Alertas de facturación',
    description: 'Avisos sobre tu saldo, renovaciones y límites de uso.',
    defaultValue: true,
    category: 'Email',
  },
]

export default function NotificacionesPage() {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loadingNotifs, setLoadingNotifs] = useState(true)

  const [settings, setSettings] = useState<Record<string, boolean>>(
    Object.fromEntries(PREF_SETTINGS.map(n => [n.id, n.defaultValue]))
  )
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function loadAndMarkRead() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load recent notifications
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30)

      setNotifications(data ?? [])
      setLoadingNotifs(false)

      // Mark all as read
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
    }
    loadAndMarkRead()
  }, [])

  function toggle(id: string) {
    setSettings(prev => ({ ...prev, [id]: !prev[id] }))
    setSaved(false)
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const categories = Array.from(new Set(PREF_SETTINGS.map(n => n.category)))

  function formatDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-[11px] text-[#B8860B] uppercase tracking-[2px] font-semibold">Notificaciones</p>
        <p className="text-[13px] text-[#4A5568]">Historial de actividad y preferencias de notificación.</p>
      </div>

      {/* ── Recent notifications ── */}
      <section className="space-y-3">
        <p className="text-[10px] text-[#6E8EAD] uppercase tracking-wider font-semibold">Historial reciente</p>
        <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-lg overflow-hidden">
          {loadingNotifs ? (
            <div className="px-5 py-8 text-center text-[13px] text-[#4A5568]">Cargando...</div>
          ) : notifications.length === 0 ? (
            <div className="px-5 py-8 text-center text-[13px] text-[#4A5568]">
              Sin notificaciones aún — activa tu proyecto para comenzar.
            </div>
          ) : (
            notifications.map((n, i) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-5 py-4 ${
                  i < notifications.length - 1 ? 'border-b border-[#1E2A4A]/50' : ''
                } ${!n.is_read ? 'bg-[#B8860B]/5' : ''}`}
              >
                <span className="text-[18px] shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] ${!n.is_read ? 'text-white font-medium' : 'text-[#8892A4]'}`}>
                    {n.title}
                  </p>
                  <p className="text-[11px] text-[#4A5568] mt-0.5">{formatDate(n.created_at)}</p>
                </div>
                {!n.is_read && (
                  <span className="w-2 h-2 rounded-full bg-[#B8860B] shrink-0 mt-1.5" />
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── Preferences ── */}
      {categories.map(category => (
        <section key={category} className="space-y-3">
          <p className="text-[10px] text-[#6E8EAD] uppercase tracking-wider font-semibold">{category}</p>
          <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-lg overflow-hidden">
            {PREF_SETTINGS.filter(n => n.category === category).map((notif, i, arr) => (
              <div
                key={notif.id}
                className={`flex items-center justify-between px-5 py-4 ${
                  i < arr.length - 1 ? 'border-b border-[#1E2A4A]/50' : ''
                }`}
              >
                <div className="space-y-0.5 flex-1 pr-6">
                  <p className="text-[13px] text-white font-medium">{notif.label}</p>
                  <p className="text-[12px] text-[#4A5568]">{notif.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(notif.id)}
                  aria-label={settings[notif.id] ? `Desactivar ${notif.label}` : `Activar ${notif.label}`}
                  className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${
                    settings[notif.id] ? 'bg-[#B8860B]' : 'bg-[#1E2A4A]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      settings[notif.id] ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          className="px-5 py-2.5 bg-[#B8860B] hover:bg-[#A07710] text-black font-semibold text-[13px] rounded-lg transition-colors"
        >
          {saved ? 'Guardado ✓' : 'Guardar preferencias'}
        </button>
        <button
          type="button"
          onClick={() => {
            setSettings(Object.fromEntries(PREF_SETTINGS.map(n => [n.id, false])))
            setSaved(false)
          }}
          className="text-[13px] text-[#4A5568] hover:text-[#E53E3E] transition-colors"
        >
          Desactivar todas
        </button>
      </div>
    </div>
  )
}
