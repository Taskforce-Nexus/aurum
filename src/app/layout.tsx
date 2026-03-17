import type { Metadata } from 'next'
import localFont from 'next/font/local'
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
  title: 'Reason',
  description: 'Sistema de creación de proyectos guiado por IA',
  icons: { icon: '/branding/favicon-claro-reason.png' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <body className={`${outfit.variable} ${openSans.variable} font-sans bg-[#0A1128] text-white antialiased`}>
        {children}
      </body>
    </html>
  )
}
