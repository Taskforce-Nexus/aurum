'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AuthBrandPanel from '@/components/auth/AuthBrandPanel'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?type=recovery`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/forgot-password-sent')
  }

  return (
    <div className="min-h-screen flex">
      <AuthBrandPanel variant="default" />

      <div className="flex-1 flex items-center justify-center p-8 lg:p-20 border-l border-[#27282B]">
        <div className="w-full max-w-md">
          <h2 className="font-outfit text-3xl font-bold text-white mb-2">Recupera tu acceso</h2>
          <p className="text-sm text-[#8892A4] mb-8">
            Ingresa tu correo y te enviaremos un enlace para tener acceso y restablecer tu contraseña.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-[#8892A4] mb-1.5">Correo electrónico</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="hola@ejemplo.com" required
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
              {loading ? 'Enviando...' : 'Tomar enviar'}
            </button>
          </form>

          <p className="text-center text-sm text-[#8892A4] mt-8">
            ¿Lo recuerdas?{' '}
            <Link href="/login" className="text-[#B8860B] hover:underline">Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
