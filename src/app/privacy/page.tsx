export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0A1128] text-[#F8F8F8]">
      <div className="max-w-3xl mx-auto px-6 py-16">

        <h1 className="font-['Outfit'] text-3xl font-bold text-white mb-2">
          Política de Privacidad
        </h1>
        <p className="text-[#8892A4] text-sm mb-12">
          Última actualización: marzo 2026
        </p>

        <div className="space-y-10 font-['Open_Sans'] text-[#C8D0DC] leading-relaxed">

          <section>
            <h2 className="font-['Outfit'] text-lg font-semibold text-white mb-3">
              1. Qué datos recopilamos
            </h2>
            <p className="text-sm mb-3">
              Al usar Reason recopilamos los siguientes datos personales y de uso:
            </p>
            <ul className="text-sm space-y-2 list-disc list-inside text-[#8892A4]">
              <li><span className="text-[#C8D0DC]">Información de cuenta</span> — nombre, dirección de correo electrónico, foto de perfil (vía Google OAuth).</li>
              <li><span className="text-[#C8D0DC]">Datos del proyecto</span> — nombre del venture, descripción, documentos generados en sesiones de consejo, respuestas a preguntas de incubación.</li>
              <li><span className="text-[#C8D0DC]">Datos de facturación</span> — historial de transacciones, plan de suscripción. Los datos de tarjeta de crédito son procesados directamente por Stripe y nunca pasan por nuestros servidores.</li>
              <li><span className="text-[#C8D0DC]">Datos de uso</span> — logs de sesiones, tokens consumidos, interacciones con el consejo IA.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-['Outfit'] text-lg font-semibold text-white mb-3">
              2. Cómo usamos tus datos
            </h2>
            <p className="text-sm mb-3">
              Usamos tu información exclusivamente para:
            </p>
            <ul className="text-sm space-y-2 list-disc list-inside text-[#8892A4]">
              <li>Proveer el servicio — autenticar tu acceso, gestionar tus proyectos y generar entregables estratégicos con el consejo IA.</li>
              <li>Procesar pagos — gestionar tu suscripción y saldo de créditos a través de Stripe.</li>
              <li>Mejorar la experiencia — analizar patrones de uso para optimizar la calidad de los agentes y entregables.</li>
              <li>Comunicaciones del servicio — enviarte actualizaciones sobre tu cuenta o cambios importantes en el servicio.</li>
            </ul>
            <p className="text-sm mt-3">
              No vendemos, alquilamos ni compartimos tus datos personales con terceros con fines comerciales o publicitarios.
            </p>
          </section>

          <section>
            <h2 className="font-['Outfit'] text-lg font-semibold text-white mb-3">
              3. Con quién compartimos tus datos
            </h2>
            <p className="text-sm mb-3">
              Compartimos datos únicamente con proveedores de infraestructura necesarios para operar el servicio:
            </p>
            <ul className="text-sm space-y-2 list-disc list-inside text-[#8892A4]">
              <li><span className="text-[#C8D0DC]">Supabase</span> — almacenamiento de datos y autenticación (Google OAuth). <a href="https://supabase.com/privacy" target="_blank" rel="noreferrer" className="text-[#B8860B] hover:underline">Política de privacidad →</a></li>
              <li><span className="text-[#C8D0DC]">Stripe</span> — procesamiento de pagos. Los datos de tarjeta son cifrados directamente en los servidores de Stripe. <a href="https://stripe.com/privacy" target="_blank" rel="noreferrer" className="text-[#B8860B] hover:underline">Política de privacidad →</a></li>
              <li><span className="text-[#C8D0DC]">Anthropic (Claude API)</span> — las respuestas de tu sesión de consejo se procesan a través de la API de Claude para generar entregables. Las conversaciones no se usan para entrenar modelos según los términos de uso empresarial de Anthropic. <a href="https://www.anthropic.com/privacy" target="_blank" rel="noreferrer" className="text-[#B8860B] hover:underline">Política de privacidad →</a></li>
            </ul>
          </section>

          <section>
            <h2 className="font-['Outfit'] text-lg font-semibold text-white mb-3">
              4. Tus derechos
            </h2>
            <p className="text-sm mb-3">
              Como usuario de Reason tienes derecho a:
            </p>
            <ul className="text-sm space-y-2 list-disc list-inside text-[#8892A4]">
              <li><span className="text-[#C8D0DC]">Acceso</span> — solicitar una copia de todos los datos personales que tenemos sobre ti.</li>
              <li><span className="text-[#C8D0DC]">Rectificación</span> — corregir datos inexactos o incompletos.</li>
              <li><span className="text-[#C8D0DC]">Eliminación</span> — solicitar la eliminación de tu cuenta y todos los datos asociados.</li>
              <li><span className="text-[#C8D0DC]">Portabilidad</span> — recibir tus datos en un formato estructurado y legible por máquina.</li>
              <li><span className="text-[#C8D0DC]">Oposición</span> — oponerte al procesamiento de tus datos en cualquier momento.</li>
            </ul>
            <p className="text-sm mt-3">
              Para ejercer cualquiera de estos derechos, escríbenos a{' '}
              <a href="mailto:privacy@taskforce.fyi" className="text-[#B8860B] hover:underline">
                privacy@taskforce.fyi
              </a>.
            </p>
          </section>

          <section>
            <h2 className="font-['Outfit'] text-lg font-semibold text-white mb-3">
              5. Seguridad
            </h2>
            <p className="text-sm">
              Implementamos medidas técnicas y organizativas estándar de la industria para proteger tus datos: cifrado en tránsito (TLS), control de acceso basado en roles, y monitoreo de seguridad continuo a través de Supabase. Sin embargo, ningún sistema es completamente infalible — en caso de una brecha de seguridad que afecte tus datos te notificaremos en un plazo máximo de 72 horas.
            </p>
          </section>

          <section>
            <h2 className="font-['Outfit'] text-lg font-semibold text-white mb-3">
              6. Contacto
            </h2>
            <p className="text-sm">
              Para preguntas, solicitudes o reportes relacionados con privacidad, contáctanos en{' '}
              <a href="mailto:privacy@taskforce.fyi" className="text-[#B8860B] hover:underline">
                privacy@taskforce.fyi
              </a>.
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-[#1E2A4A]">
          <a href="/" className="text-sm text-[#8892A4] hover:text-white transition-colors">
            ← Volver a Reason
          </a>
        </div>

      </div>
    </div>
  )
}
