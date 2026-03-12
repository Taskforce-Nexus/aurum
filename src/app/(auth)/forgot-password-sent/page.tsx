import Link from 'next/link'
import AuthBrandPanel from '@/components/auth/AuthBrandPanel'

export default function ForgotPasswordSentPage() {
  return (
    <div className="min-h-screen flex">
      <AuthBrandPanel variant="default" />

      <div className="flex-1 flex items-center justify-center p-8 lg:p-20 border-l border-[#27282B]">
        <div className="w-full max-w-md">
          <h2 className="font-outfit text-3xl font-bold text-white mb-2">Revisa tu correo</h2>
          <p className="text-sm text-[#8892A4] mb-6">Te lo enviamos a:</p>

          <p className="text-[#B8860B] font-medium mb-4">correo@ejemplo.com</p>
          <p className="text-sm text-[#8892A4] mb-8">El enlace expira en 15 minutos</p>

          <Link
            href="/login"
            className="block w-full h-12 bg-[#B8860B] hover:bg-[#a07509] text-white font-semibold rounded-lg transition-colors font-outfit flex items-center justify-center"
          >
            Volver a Iniciar sesión
          </Link>

          <p className="text-center text-sm text-[#8892A4] mt-6">
            ¿Ya lo ves?{' '}
            <Link href="/forgot-password" className="text-[#B8860B] hover:underline">Reenviar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
