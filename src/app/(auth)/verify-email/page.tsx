'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AuthBrandPanel from '@/components/auth/AuthBrandPanel'

function VerifyEmailContent() {
  const params = useSearchParams()
  const email = params.get('email') ?? ''
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleResend() {
    if (!email) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      <AuthBrandPanel variant="default" />

      <div className="flex-1 flex items-center justify-center p-8 lg:p-20 border-l border-[#27282B]">
        <div className="w-full max-w-md">
          <h2 className="font-outfit text-3xl font-bold text-white mb-2">Revisa tu correo</h2>
          <p className="text-sm text-[#8892A4] mb-6">Te enviamos un enlace de acceso a:</p>

          {email && (
            <p className="text-[#B8860B] font-medium mb-6">{email}</p>
          )}

          <p className="text-sm text-[#8892A4] mb-8">
            Una vez que hagas clic en el enlace quedará activa tu cuenta. Si no aparece, revisa tu carpeta de spam.
          </p>

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 mb-4">
              {error}
            </p>
          )}
          {sent && (
            <p className="text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2 mb-4">
              Correo reenviado.
            </p>
          )}

          <button
            onClick={handleResend}
            disabled={loading || sent || !email}
            className="w-full h-12 border border-[#1E2A4A] rounded-lg text-sm text-[#8892A4] hover:text-white hover:border-[#B8860B] transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-6">
            {loading ? 'Enviando...' : 'Reenviar enlace'}
          </button>

          <p className="text-center text-sm text-[#8892A4]">
            ¿Tienes cuenta?{' '}
            <Link href="/login" className="text-[#B8860B] hover:underline">Conéctate</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A1128] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
