import { NextResponse } from 'next/server'

const VALID_LOCALES = ['es', 'en', 'zh', 'hi', 'fr', 'ar', 'bn', 'pt', 'ru', 'ja']

export async function POST(req: Request) {
  const { locale } = await req.json()

  if (!VALID_LOCALES.includes(locale)) {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 })
  }

  const response = NextResponse.json({ locale })
  response.cookies.set('locale', locale, {
    path: '/',
    maxAge: 365 * 24 * 60 * 60,
    sameSite: 'lax',
  })
  return response
}
