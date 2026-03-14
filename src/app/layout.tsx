import type { Metadata } from 'next'
import { Outfit, Open_Sans } from 'next/font/google'
import './globals.css'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })
const openSans = Open_Sans({ subsets: ['latin'], variable: '--font-open-sans' })

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
