import { Resend } from 'resend';

const FROM_EMAIL = 'Reason <noreply@reason.guru>';

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.log('[EMAIL] Skipped (no RESEND_API_KEY):', subject, '→', to);
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
    console.log('[EMAIL] Sent:', subject, '→', to);
  } catch (error) {
    console.error('[EMAIL] Failed:', subject, '→', to, error);
  }
}
