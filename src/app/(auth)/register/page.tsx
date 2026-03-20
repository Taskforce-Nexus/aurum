'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import AuthBrandPanel from '@/components/auth/AuthBrandPanel'
import LocaleSelector from '@/components/shared/LocaleSelector'

export default function RegisterPage() {
  const t = useTranslations('auth')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Capture ?plan= param and store for post-registration checkout redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const planParam = params.get('plan')
    if (planParam && ['core', 'pro', 'enterprise'].includes(planParam)) {
      localStorage.setItem('pending_plan', planParam)
    }
  }, [])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError(t('invalidCredentials'))
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

      // If there's a pending plan from /pricing, redirect to Stripe Checkout
      const pendingPlan = localStorage.getItem('pending_plan')
      if (pendingPlan && pendingPlan !== 'free') {
        try {
          const res = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan: pendingPlan }),
          })
          if (res.ok) {
            const { url } = await res.json()
            if (url) {
              localStorage.removeItem('pending_plan')
              window.location.href = url
              return
            }
          }
        } catch {
          // Checkout failed — keep pending_plan so dashboard can retry
        }
      }
    }

    router.push(`/verify-email?email=${encodeURIComponent(email)}`)
  }

  return (
    <div className="min-h-screen flex relative">
      <div className="absolute top-4 right-4 z-10">
        <LocaleSelector />
      </div>
      <AuthBrandPanel variant="register" />

      <div className="flex-1 flex items-center justify-center p-8 lg:p-20 border-l border-[#27282B]">
        <div className="w-full max-w-md">
          <h2 className="font-outfit text-3xl font-bold text-white mb-2">{t('register')}</h2>
          <p className="text-sm text-[#8892A4] mb-8">{t('registerSubtitle')}</p>

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm text-[#8892A4] mb-1.5">{t('email')}</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="hola@ejemplo.com" required
                className="w-full bg-[#0D1535] border border-[#1E2A4A] rounded-lg px-4 h-12 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:border-[#B8860B] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-[#8892A4] mb-1.5">{t('password')}</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder={t('passwordMin')} required minLength={6}
                className="w-full bg-[#0D1535] border border-[#1E2A4A] rounded-lg px-4 h-12 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:border-[#B8860B] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-[#8892A4] mb-1.5">{t('confirmPassword')}</label>
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
              {loading ? t('creatingAccount') : t('register')}
            </button>
            <p className="text-xs text-[#4A5568] text-center">
              {t('termsAccept')}{' '}
              <Link href="/terms" className="text-[#8892A4] hover:text-white">{t('termsOfService')}</Link>{' '}
              {t('and')}{' '}
              <Link href="/privacy" className="text-[#8892A4] hover:text-white">{t('privacyPolicy')}</Link>
            </p>
          </form>

          <p className="text-center text-sm text-[#8892A4] mt-8">
            {t('hasAccount')}{' '}
            <Link href="/login" className="text-[#B8860B] hover:underline">{t('signIn')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
