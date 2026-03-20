'use client'

import { useLocale } from 'next-intl'
import { useState, useRef, useEffect } from 'react'

const LOCALES = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'bn', label: 'বাংলা', flag: '🇧🇩' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
]

export default function LocaleSelector() {
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const current = LOCALES.find(l => l.code === locale) || LOCALES[0]

  async function switchLocale(code: string) {
    setOpen(false)
    await fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: code }),
    })
    window.location.reload()
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm text-[#8892A4] hover:text-[#F8F8F8] transition-colors"
      >
        <span>{current.flag}</span>
        <span>{current.code.toUpperCase()}</span>
      </button>
      {open && (
        <div className="absolute bottom-full mb-2 right-0 bg-[#0D1535] border border-[#1E2A4A] rounded-lg shadow-xl py-1 min-w-[180px] z-50">
          {LOCALES.map(l => (
            <button
              key={l.code}
              type="button"
              onClick={() => switchLocale(l.code)}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-[#1E2A4A] transition-colors ${
                l.code === locale ? 'text-[#B8860B]' : 'text-[#F8F8F8]'
              }`}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
              {l.code === locale && <span className="ml-auto text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
