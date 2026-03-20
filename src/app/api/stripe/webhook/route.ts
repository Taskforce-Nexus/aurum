import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createNotification } from '@/lib/notifications'
import { sendEmail } from '@/lib/email'
import { paymentReceivedEmail } from '@/lib/email-templates'

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()

  console.log('[STRIPE WEBHOOK] Event:', event.type)
  console.log('[STRIPE WEBHOOK] Data:', JSON.stringify(event.data.object).slice(0, 200))

  // Fallback: map price ID → plan using env vars (in case Stripe price lacks metadata.tier)
  const PRICE_TO_PLAN: Record<string, string> = {}
  if (process.env.STRIPE_PRICE_CORE) PRICE_TO_PLAN[process.env.STRIPE_PRICE_CORE] = 'core'
  if (process.env.STRIPE_PRICE_PRO) PRICE_TO_PLAN[process.env.STRIPE_PRICE_PRO] = 'pro'
  if (process.env.STRIPE_PRICE_ENTERPRISE) PRICE_TO_PLAN[process.env.STRIPE_PRICE_ENTERPRISE] = 'enterprise'

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id || session.metadata?.userId
      if (!userId) break

      if (session.mode === 'subscription' && session.subscription) {
        // Fetch actual subscription to get period dates and tier from price metadata
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = await stripe.subscriptions.retrieve(session.subscription as string) as any
        const priceId = sub.items?.data[0]?.price?.id as string | undefined
        const tier = sub.items?.data[0]?.price?.metadata?.tier
          || (priceId ? PRICE_TO_PLAN[priceId] : undefined)
          || 'core'
        console.log('[WEBHOOK] checkout.session.completed — subscription')
        console.log('[WEBHOOK] Price ID:', priceId)
        console.log('[WEBHOOK] Mapped plan:', tier)
        console.log('[WEBHOOK] Customer:', session.customer)
        console.log('[WEBHOOK] User ID:', userId)
        const periodStart = sub.current_period_start
          ? new Date(sub.current_period_start * 1000).toISOString()
          : new Date().toISOString()
        const periodEnd = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        const priceMonthly = (sub.items?.data[0]?.price?.unit_amount ?? 0) / 100

        await admin.from('subscriptions').upsert({
          user_id: userId,
          plan: tier,
          status: 'activa',
          stripe_subscription_id: session.subscription as string,
          stripe_customer_id: session.customer as string,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          price_monthly: priceMonthly,
        }, { onConflict: 'user_id' })

        // Save stripe_customer_id to profiles for future checkout sessions
        await admin.from('profiles')
          .update({ stripe_customer_id: session.customer as string })
          .eq('id', userId)

        try {
          await createNotification({
            userId,
            type: 'pago_procesado',
            title: `Pago de $${priceMonthly.toFixed(2)} procesado correctamente`,
          })
        } catch (e) { console.error('[notify] subscription paid:', e) }

        // D5 — Email: payment received (subscription)
        try {
          const { data: profile } = await admin.from('profiles').select('name, email').eq('id', userId).single()
          if (profile?.email) {
            await sendEmail({ to: profile.email, ...paymentReceivedEmail(profile.name || 'ahí', priceMonthly, `Suscripción ${tier}`) })
          }
        } catch (e) { console.error('[EMAIL] payment subscription failed:', e) }
      }

      if (session.mode === 'payment') {
        const amount = (session.amount_total || 0) / 100

        // Actualizar saldo de tokens
        const { data: balance } = await admin.from('token_balances')
          .select('balance_usd')
          .eq('user_id', userId)
          .single()

        await admin.from('token_balances').upsert({
          user_id: userId,
          balance_usd: (balance?.balance_usd || 0) + amount,
        }, { onConflict: 'user_id' })

        // Registrar invoice
        await admin.from('invoices').insert({
          user_id: userId,
          concept: `Recarga de saldo — $${amount} USD`,
          amount_usd: amount,
          status: 'pagada',
        })

        try {
          await createNotification({
            userId,
            type: 'pago_procesado',
            title: `Recarga de $${amount.toFixed(2)} acreditada a tu saldo`,
          })
        } catch (e) { console.error('[notify] token topup:', e) }

        // D5 — Email: payment received (token top-up)
        try {
          const { data: profile } = await admin.from('profiles').select('name, email').eq('id', userId).single()
          if (profile?.email) {
            await sendEmail({ to: profile.email, ...paymentReceivedEmail(profile.name || 'ahí', amount, 'Recarga de saldo') })
          }
        } catch (e) { console.error('[EMAIL] payment topup failed:', e) }
      }
      break
    }

    case 'customer.subscription.updated': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub = event.data.object as any
      const { data: existing } = await admin.from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', sub.id)
        .single()

      if (existing) {
        await admin.from('subscriptions').update({
          status: sub.status === 'active' ? 'activa' : sub.status === 'canceled' ? 'cancelada' : sub.status,
          current_period_start: sub.current_period_start
            ? new Date(sub.current_period_start * 1000).toISOString() : undefined,
          current_period_end: sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString() : undefined,
          cancel_at: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
        }).eq('stripe_subscription_id', sub.id)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await admin.from('subscriptions').update({
        status: 'cancelada',
        cancel_at: new Date().toISOString(),
      }).eq('stripe_subscription_id', sub.id)
      break
    }

    case 'invoice.paid': {
      const inv = event.data.object as Stripe.Invoice
      const customerId = inv.customer as string

      const { data: subscription } = await admin.from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (subscription) {
        const amountPaid = (inv.amount_paid || 0) / 100
        await admin.from('invoices').insert({
          user_id: subscription.user_id,
          concept: `Suscripción Reason — ${inv.lines?.data[0]?.description || 'mensual'}`,
          amount_usd: amountPaid,
          status: 'pagada',
          pdf_url: inv.invoice_pdf,
        })

        try {
          await createNotification({
            userId: subscription.user_id,
            type: 'pago_procesado',
            title: `Pago de $${amountPaid.toFixed(2)} procesado correctamente`,
          })
        } catch (e) { console.error('[notify] invoice.paid:', e) }

        // D5 — Email: payment received (invoice renewal)
        try {
          const { data: profile } = await admin.from('profiles').select('name, email').eq('id', subscription.user_id).single()
          if (profile?.email) {
            await sendEmail({ to: profile.email, ...paymentReceivedEmail(profile.name || 'ahí', amountPaid, `Suscripción Reason — renovación`) })
          }
        } catch (e) { console.error('[EMAIL] payment invoice.paid failed:', e) }
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
