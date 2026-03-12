'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AuthBrandPanel from '@/components/auth/AuthBrandPanel'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: data.user.id, full_name: '' }),
      })
    }

    router.push(`/verify-email?email=${encodeURIComponent(email)}`)
  }

  return (
    <div className="min-h-screen flex">
      <AuthBrandPanel variant="register" />

      <div className="flex-1 flex items-center justify-center p-8 lg:p-20 border-l border-[#27282B]">
        <div className="w-full max-w-md">
          <h2 className="font-outfit text-3xl font-bold text-white mb-2">Crear Cuenta</h2>
          <p className="text-sm text-[#8892A4] mb-8">Registrarte y dale vida a tu idea estratégica con tu consejería.</p>

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm text-[#8892A4] mb-1.5">Correo electrónico</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="hola@ejemplo.com" required
                className="w-full bg-[#0D1535] border border-[#1E2A4A] rounded-lg px-4 h-12 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:border-[#B8860B] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-[#8892A4] mb-1.5">Contraseña</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres" required minLength={6}
                className="w-full bg-[#0D1535] border border-[#1E2A4A] rounded-lg px-4 h-12 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:border-[#B8860B] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-[#8892A4] mb-1.5">Confirmar contraseña</label>
              <input
                type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••" required minLength={6}
                className="w-full bg-[#0D1535] border border-[#1E2A4A] rounded-lg px-4 h-12 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:border-[#B8860B] transition-colors"
              />
            </div>
            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <button type="submit" disabled={loading}
              className="w-full h-12 bg-[#B8860B] hover:bg-[#a07509] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-outfit">
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
            <p className="text-xs text-[#4A5568] text-center">
              Al crear tu cuenta aceptas los{' '}
              <span className="text-[#8892A4]">Términos de Servicio</span>{' '}
              y la{' '}
              <span className="text-[#8892A4]">Política de Privacidad</span>
            </p>
          </form>

          <p className="text-center text-sm text-[#8892A4] mt-8">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-[#B8860B] hover:underline">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
