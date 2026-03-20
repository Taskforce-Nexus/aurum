function baseTemplate(content: string): string {
  return `
    <div style="background-color: #0A1128; padding: 40px 20px; font-family: 'Open Sans', Arial, sans-serif;">
      <div style="max-width: 560px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 32px;">
          <img src="https://reason-production-e205.up.railway.app/branding/logo-claro-reason.png" alt="Reason" width="140" />
        </div>
        <div style="background-color: #0D1535; border: 1px solid #1E2A4A; border-radius: 8px; padding: 32px;">
          ${content}
        </div>
        <div style="text-align: center; margin-top: 24px; color: #8892A4; font-size: 12px;">
          <p>Reason — Strategic Reasoning Partner</p>
          <p><a href="https://reason.guru" style="color: #B8860B;">reason.guru</a></p>
        </div>
      </div>
    </div>
  `;
}

export function welcomeEmail(name: string): { subject: string; html: string } {
  return {
    subject: 'Bienvenido a Reason',
    html: baseTemplate(`
      <h2 style="color: #F8F8F8; font-family: 'Outfit', Arial, sans-serif; margin: 0 0 16px;">
        Bienvenido, ${name}.
      </h2>
      <p style="color: #C0C0C0; line-height: 1.6; margin: 0 0 16px;">
        Tu cuenta está lista. Tienes $1 USD de saldo para explorar Reason.
      </p>
      <p style="color: #C0C0C0; line-height: 1.6; margin: 0 0 24px;">
        Crea tu primer proyecto, cuéntale a Nexo sobre tu decisión estratégica,
        y deja que tu consejo asesor de IA trabaje para ti.
      </p>
      <div style="text-align: center;">
        <a href="https://reason-production-e205.up.railway.app"
           style="display: inline-block; background: #B8860B; color: #0A1128;
                  padding: 12px 32px; border-radius: 4px; text-decoration: none;
                  font-weight: 600; font-family: 'Outfit', Arial, sans-serif;">
          Crear mi primer proyecto
        </a>
      </div>
    `),
  };
}

export function sessionCompletedEmail(name: string, projectName: string, documentCount: number): { subject: string; html: string } {
  return {
    subject: 'Sesión de Consejo completada — ' + projectName,
    html: baseTemplate(`
      <h2 style="color: #F8F8F8; font-family: 'Outfit', Arial, sans-serif; margin: 0 0 16px;">
        Tu Sesión de Consejo terminó.
      </h2>
      <p style="color: #C0C0C0; line-height: 1.6; margin: 0 0 16px;">
        ${name}, tu consejo generó ${documentCount} documento${documentCount > 1 ? 's' : ''} para <strong style="color: #F8F8F8;">${projectName}</strong>.
      </p>
      <p style="color: #C0C0C0; line-height: 1.6; margin: 0 0 24px;">
        Revísalos en el Export Center y descarga en PDF o PPTX.
      </p>
      <div style="text-align: center;">
        <a href="https://reason-production-e205.up.railway.app"
           style="display: inline-block; background: #B8860B; color: #0A1128;
                  padding: 12px 32px; border-radius: 4px; text-decoration: none;
                  font-weight: 600;">
          Ver documentos
        </a>
      </div>
    `),
  };
}

export function documentReadyEmail(name: string, projectName: string, documentName: string): { subject: string; html: string } {
  return {
    subject: documentName + ' listo — ' + projectName,
    html: baseTemplate(`
      <h2 style="color: #F8F8F8; font-family: 'Outfit', Arial, sans-serif; margin: 0 0 16px;">
        Tu ${documentName} está listo.
      </h2>
      <p style="color: #C0C0C0; line-height: 1.6; margin: 0 0 24px;">
        ${name}, el documento <strong style="color: #F8F8F8;">${documentName}</strong>
        de tu proyecto <strong style="color: #F8F8F8;">${projectName}</strong> fue generado
        por tu consejo y está listo para revisión.
      </p>
      <div style="text-align: center;">
        <a href="https://reason-production-e205.up.railway.app"
           style="display: inline-block; background: #B8860B; color: #0A1128;
                  padding: 12px 32px; border-radius: 4px; text-decoration: none;
                  font-weight: 600;">
          Revisar documento
        </a>
      </div>
    `),
  };
}

export function lowBalanceEmail(name: string, balance: number): { subject: string; html: string } {
  return {
    subject: 'Tu saldo en Reason es bajo',
    html: baseTemplate(`
      <h2 style="color: #F8F8F8; font-family: 'Outfit', Arial, sans-serif; margin: 0 0 16px;">
        Tu saldo es $${balance.toFixed(2)} USD.
      </h2>
      <p style="color: #C0C0C0; line-height: 1.6; margin: 0 0 24px;">
        ${name}, con este saldo podrías no completar tu próxima sesión.
        Recarga para continuar usando Reason sin interrupciones.
      </p>
      <div style="text-align: center;">
        <a href="https://reason-production-e205.up.railway.app/settings/facturacion"
           style="display: inline-block; background: #B8860B; color: #0A1128;
                  padding: 12px 32px; border-radius: 4px; text-decoration: none;
                  font-weight: 600;">
          Recargar saldo
        </a>
      </div>
    `),
  };
}

export function paymentReceivedEmail(name: string, amount: number, concept: string): { subject: string; html: string } {
  return {
    subject: 'Recibo de pago — $' + amount.toFixed(2) + ' USD',
    html: baseTemplate(`
      <h2 style="color: #F8F8F8; font-family: 'Outfit', Arial, sans-serif; margin: 0 0 16px;">
        Pago recibido.
      </h2>
      <p style="color: #C0C0C0; line-height: 1.6; margin: 0 0 8px;">
        ${name}, recibimos tu pago:
      </p>
      <div style="background: #0A1128; border-radius: 6px; padding: 16px; margin: 16px 0;">
        <p style="color: #F8F8F8; margin: 0;"><strong>Concepto:</strong> ${concept}</p>
        <p style="color: #B8860B; font-size: 24px; margin: 8px 0 0; font-weight: 700;">
          $${amount.toFixed(2)} USD
        </p>
      </div>
      <p style="color: #8892A4; font-size: 13px;">
        Puedes ver tu historial completo en
        <a href="https://reason-production-e205.up.railway.app/settings/facturacion" style="color: #B8860B;">Facturación</a>.
      </p>
    `),
  };
}
