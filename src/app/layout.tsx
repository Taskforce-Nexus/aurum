import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { ToastProvider } from '@/components/ui/Toast'
import './globals.css'

const outfit = localFont({
  src: '../../public/fonts/Outfit-VariableFont.woff2',
  variable: '--font-outfit',
  display: 'swap',
})

const openSans = localFont({
  src: '../../public/fonts/OpenSans-VariableFont.woff2',
  variable: '--font-open-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Reason — Strategic Reasoning Partner',
  description: 'Reason ayuda a founders, CEOs y dueños de negocio a tomar mejores decisiones estratégicas con un consejo asesor de IA especializado.',
  keywords: 'estrategia de negocio, consejo IA, validación de startups, modelo de negocio, plan de negocio',
  icons: { icon: '/branding/favicon-claro-reason.png' },
  openGraph: {
    title: 'Reason — Strategic Reasoning Partner',
    description: 'Decisiones más inteligentes en un mundo de cambio exponencial.',
    url: 'https://reason.guru',
    siteName: 'Reason',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reason — Strategic Reasoning Partner',
    description: 'Decisiones más inteligentes en un mundo de cambio exponencial.',
  },
  robots: { index: true, follow: true },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} className="dark">
      <head>
        {process.env.NEXT_PUBLIC_CLARITY_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_ID}");`,
            }}
          />
        )}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID}');`,
              }}
            />
          </>
        )}
      </head>
      <body className={`${outfit.variable} ${openSans.variable} font-sans bg-[#0A1128] text-white antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <ToastProvider>{children}</ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
