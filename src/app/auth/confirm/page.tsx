'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AuthConfirmInner() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    async function confirm() {
      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type') as 'signup' | 'magiclink' | 'recovery' | null

      // Primary path: token_hash + type (OTP flow)
      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
        if (error) {
          setStatus('error')
          setMessage(
            error.message.includes('expired')
              ? 'El enlace expiró. Solicita uno nuevo.'
              : 'No pudimos verificar tu cuenta. Intenta de nuevo.'
          )
          return
        }
        if (type === 'recovery') {
          router.push('/auth/reset-password')
        } else {
          setStatus('success')
          setTimeout(() => router.push('/dashboard'), 1500)
        }
        return
      }

      // Fallback: code (PKCE flow — Supabase redirects with ?code=xxx)
      const code = searchParams.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          setStatus('error')
          setMessage('Enlace inválido o expirado.')
          return
        }
        setStatus('success')
        setTimeout(() => router.push('/dashboard'), 1500)
        return
      }

      setStatus('error')
      setMessage('Enlace inválido o expirado.')
    }
    confirm()
  }, [])

  return (
    <div className="min-h-screen bg-[#0A1128] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold tracking-widest text-[#B8860B] mb-8">Reason</h1>
        <div className="bg-[#0D1535] border border-[#1E2A4A] rounded-xl p-8">
          {status === 'loading' && (
            <>
              <svg className="animate-spin h-8 w-8 text-[#B8860B] mx-auto mb-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <p className="text-sm text-[#6b6d75]">Verificando tu cuenta...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 className="font-semibold mb-2">Cuenta verificada</h2>
              <p className="text-sm text-[#6b6d75]">Entrando a Reason...</p>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </div>
              <h2 className="font-semibold mb-2">Error de verificación</h2>
              <p className="text-sm text-[#6b6d75] mb-6">{message}</p>
              <a href="/login" className="text-sm text-[#B8860B] hover:underline">
                Volver al inicio de sesión
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={null}>
      <AuthConfirmInner />
    </Suspense>
  )
}
