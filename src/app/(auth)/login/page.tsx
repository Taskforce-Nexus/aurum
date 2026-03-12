'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AuthBrandPanel from '@/components/auth/AuthBrandPanel'

type Mode = 'password' | 'magic'

function ErrorMsg({ msg }: { msg: string }) {
  const readable: Record<string, string> = {
    'Invalid login credentials': 'Correo o contraseña incorrectos.',
    'Email not confirmed': 'Confirma tu correo antes de entrar.',
    'Too many requests': 'Demasiados intentos. Espera unos minutos.',
  }
  return (
    <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
      {readable[msg] ?? msg}
    </p>
  )
}

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    })
    if (error) {
      setError(error.message)
    } else {
      setSuccess('Revisa tu correo — te enviamos un enlace mágico.')
    }
    setLoading(false)
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/confirm` },
    })
  }

  return (
    <div className="min-h-screen flex">
      <AuthBrandPanel variant="default" />

      {/* Right: form panel */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-20 border-l border-[#27282B]">
        <div className="w-full max-w-md">
          <h2 className="font-outfit text-3xl font-bold text-white mb-2">Iniciar Sesión</h2>
          <p className="text-sm text-[#8892A4] mb-8">Ingresa tus datos para entrar y empezar.</p>

          {/* Mode toggle */}
          <div className="flex gap-1 bg-[#0D1535] p-1 rounded-lg mb-7">
            <button
              type="button"
              onClick={() => { setMode('password'); setError(''); setSuccess('') }}
              className={`flex-1 text-sm py-2 rounded-md font-medium transition-colors ${
                mode === 'password'
                  ? 'bg-[#B8860B] text-white'
                  : 'text-[#8892A4] hover:text-white'
              }`}
            >
              Correo y contraseña
            </button>
            <button
              type="button"
              onClick={() => { setMode('magic'); setError(''); setSuccess('') }}
              className={`flex-1 text-sm py-2 rounded-md font-medium transition-colors ${
                mode === 'magic'
                  ? 'bg-[#B8860B] text-white'
                  : 'text-[#8892A4] hover:text-white'
              }`}
            >
              Enlace al correo
            </button>
          </div>

          {mode === 'password' ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm text-[#8892A4] mb-1.5">Correo electrónico</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="hola@ejemplo.com" required
                  className="w-full bg-[#0D1535] border border-[#1E2A4A] rounded-lg px-4 h-12 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:border-[#B8860B] transition-colors"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm text-[#8892A4]">Contraseña</label>
                  <Link href="/forgot-password" className="text-xs text-[#B8860B] hover:underline">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full bg-[#0D1535] border border-[#1E2A4A] rounded-lg px-4 h-12 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:border-[#B8860B] transition-colors"
                />
              </div>
              {error && <ErrorMsg msg={error} />}
              <button type="submit" disabled={loading}
                className="w-full h-12 bg-[#B8860B] hover:bg-[#a07509] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-outfit">
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-5">
              <div>
                <label className="block text-sm text-[#8892A4] mb-1.5">Correo electrónico</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="hola@ejemplo.com" required
                  className="w-full bg-[#0D1535] border border-[#1E2A4A] rounded-lg px-4 h-12 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:border-[#B8860B] transition-colors"
                />
              </div>
              {error && <ErrorMsg msg={error} />}
              {success && (
                <p className="text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2">
                  {success}
                </p>
              )}
              <button type="submit" disabled={loading || !!success}
                className="w-full h-12 bg-[#B8860B] hover:bg-[#a07509] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-outfit">
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </form>
          )}

          {/* Divider + Google */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#1E2A4A]" />
            <span className="text-xs text-[#4A5568]">o continuar con</span>
            <div className="flex-1 h-px bg-[#1E2A4A]" />
          </div>
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full h-12 border border-[#1E2A4A] rounded-lg text-sm text-[#8892A4] hover:text-white hover:border-[#B8860B] transition-colors flex items-center justify-center gap-3"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </button>

          <p className="text-center text-sm text-[#8892A4] mt-8">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-[#B8860B] hover:underline">Crea cuenta</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
