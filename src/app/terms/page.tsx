export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0A1128] text-[#F8F8F8]">
      <div className="max-w-3xl mx-auto px-6 py-16">

        <h1 className="font-['Outfit'] text-3xl font-bold text-white mb-2">
          Términos de Servicio
        </h1>
        <p className="text-[#8892A4] text-sm mb-12">
          Última actualización: marzo 2026
        </p>

        <div className="space-y-10 font-['Open_Sans'] text-[#C8D0DC] leading-relaxed">

          <section>
            <h2 className="font-['Outfit'] text-lg font-semibold text-white mb-3">
              1. Descripción del servicio
            </h2>
            <p className="text-sm">
              Reason es una plataforma de creación de ventures guiada por inteligencia artificial. Permite a fundadores transformar una idea de negocio en un conjunto de entregables estratégicos — incluyendo análisis de mercado, modelo de negocio, arquitectura de producto y plan de ejecución — a través de sesiones de consejo con agentes IA especializados.
            </p>
            <p className="text-sm mt-3">
              El servicio se provee &quot;tal cual está&quot; en su estado actual. Continuamos mejorándolo activamente.
            </p>
          </section>

          <section>
            <h2 className="font-['Outfit'] text-lg font-semibold text-white mb-3">
              2. Uso aceptable
            </h2>
            <p className="text-sm mb-3">
              Al usar Reason aceptas que:
            </p>
            <ul className="text-sm space-y-2 list-disc list-inside text-[#8892A4]">
              <li>Usarás el servicio únicamente para fines legales y legítimos de emprendimiento.</li>
              <li>No intentarás vulnerar, sobrecargar o hacer ingeniería inversa de la plataforma.</li>
              <li>No usarás el servicio para generar contenido fraudulento, engañoso o que infrinja derechos de terceros.</li>
              <li>Eres responsable de mantener la confidencialidad de tus credenciales de acceso.</li>
              <li>No revenderás ni redistribuirás el acceso a la plataforma sin autorización expresa.</li>
            </ul>
            <p className="text-sm mt-3">
              Nos reservamos el derecho de suspender cuentas que violen estos términos sin previo aviso.
            </p>
          </section>

          <section>
            <h2 className="font-['Outfit'] text-lg font-semibold text-white mb-3">
              3. Propiedad intelectual
            </h2>
            <p className="text-sm mb-3">
              <span className="text-white font-medium">Los documentos generados son tuyos.</span> Todos los entregables, análisis y documentos estratégicos que se produzcan en tus sesiones de consejo son de tu propiedad. Puedes usarlos, modificarlos, distribuirlos o compartirlos libremente.
            </p>
            <p className="text-sm">
              La plataforma Reason, incluyendo su código, diseño, agentes IA, prompts del sistema y marca, son propiedad de Taskforce Labs. No se otorga ninguna licencia sobre la plataforma más allá del acceso para usar el servicio.
            </p>
          </section>

          <section>
            <h2 className="font-['Outfit'] text-lg font-semibold text-white mb-3">
              4. Planes y pagos
            </h2>
            <p className="text-sm mb-3">
              Reason opera bajo dos modelos de pago:
            </p>
            <ul className="text-sm space-y-2 list-disc list-inside text-[#8892A4]">
              <li><span className="text-[#C8D0DC]">Suscripción mensual</span> — planes Core ($29/mes), Pro ($79/mes) y Enterprise ($199/mes), con acceso a funcionalidades según el plan.</li>
              <li><span className="text-[#C8D0DC]">Créditos de saldo</span> — recarga de tokens para consumo de sesiones de consejo y generación de entregables.</li>
            </ul>
            <p className="text-sm mt-3">
              Los pagos se procesan a través de Stripe. Los precios pueden cambiar con 30 días de aviso previo por correo electrónico.
            </p>
          </section>

          <section>
            <h2 className="font-['Outfit'] text-lg font-semibold text-white mb-3">
              5. Cancelación y reembolsos
            </h2>
            <p className="text-sm mb-3">
              <span className="text-white font-medium">Cancelación:</span> Puedes cancelar tu suscripción en cualquier momento desde Configuración → Facturación. La cancelación es efectiva al final del período de facturación vigente. No hay penalidades por cancelar.
            </p>
            <p className="text-sm mb-3">
              <span className="text-white font-medium">Reembolsos:</span> Los créditos de saldo no utilizados son reembolsables dentro de los primeros 7 días de la compra, siempre que se haya consumido menos del 10% del saldo adquirido. Las suscripciones no son reembolsables una vez iniciado el período.
            </p>
            <p className="text-sm">
              Para solicitar un reembolso, escríbenos a{' '}
              <a href="mailto:legal@taskforce.fyi" className="text-[#B8860B] hover:underline">
                legal@taskforce.fyi
              </a>{' '}
              dentro del plazo indicado.
            </p>
          </section>

          <section>
            <h2 className="font-['Outfit'] text-lg font-semibold text-white mb-3">
              6. Limitación de responsabilidad
            </h2>
            <p className="text-sm mb-3">
              Los entregables generados por Reason son producto de inteligencia artificial y deben ser revisados y validados por el usuario antes de su uso en decisiones de negocio reales. Reason no garantiza la precisión, completitud o idoneidad de los documentos para ningún propósito específico.
            </p>
            <p className="text-sm">
              En ningún caso Taskforce Labs será responsable por daños indirectos, incidentales, especiales o consecuentes derivados del uso o la imposibilidad de usar el servicio, incluyendo pérdidas de negocio, datos o ganancias esperadas. La responsabilidad máxima total no excederá el monto pagado en los últimos 3 meses de servicio.
            </p>
          </section>

          <section>
            <h2 className="font-['Outfit'] text-lg font-semibold text-white mb-3">
              7. Modificaciones al servicio
            </h2>
            <p className="text-sm">
              Podemos modificar estos términos en cualquier momento. Los cambios materiales serán notificados por correo con al menos 15 días de anticipación. El uso continuado del servicio después de la notificación constituye aceptación de los nuevos términos.
            </p>
          </section>

          <section>
            <h2 className="font-['Outfit'] text-lg font-semibold text-white mb-3">
              8. Contacto
            </h2>
            <p className="text-sm">
              Para consultas legales o sobre estos términos, contáctanos en{' '}
              <a href="mailto:legal@taskforce.fyi" className="text-[#B8860B] hover:underline">
                legal@taskforce.fyi
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
