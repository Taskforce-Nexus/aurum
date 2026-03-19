'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      router.push('/login?reset=success')
    }
  }

  return (
    <div className="min-h-screen bg-[#0A1128] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold tracking-widest text-[#B8860B] mb-8 text-center">Reason</h1>
        <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-8 space-y-6">
          <div>
            <h2 className="text-[20px] font-bold text-white font-outfit">Nueva contraseña</h2>
            <p className="text-[13px] text-[#8892A4] mt-1">Elige una contraseña segura para tu cuenta.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] text-[#4A5568] uppercase tracking-wider mb-1.5">
                Nueva contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
                className="w-full bg-[#0A1128] border border-[#1E2A4A] rounded-lg px-3 h-11 text-[14px] text-white placeholder-[#4A5568] focus:outline-none focus:border-[#B8860B]/50"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#4A5568] uppercase tracking-wider mb-1.5">
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repite la contraseña"
                required
                className="w-full bg-[#0A1128] border border-[#1E2A4A] rounded-lg px-3 h-11 text-[14px] text-white placeholder-[#4A5568] focus:outline-none focus:border-[#B8860B]/50"
              />
            </div>

            {error && (
              <p className="text-[13px] text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#B8860B] hover:bg-[#A07710] disabled:opacity-40 text-black font-semibold text-[14px] rounded-lg transition-colors font-outfit"
            >
              {loading ? 'Guardando...' : 'Establecer nueva contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
