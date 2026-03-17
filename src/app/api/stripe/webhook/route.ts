import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

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

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      if (!userId) break

      if (session.mode === 'subscription') {
        await admin.from('subscriptions').upsert({
          user_id: userId,
          plan: session.metadata?.plan || 'core',
          status: 'activa',
          stripe_subscription_id: session.subscription as string,
          stripe_customer_id: session.customer as string,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }, { onConflict: 'user_id' })
      }

      if (session.mode === 'payment') {
        const amount = (session.amount_total || 0) / 100
        const { data: balance } = await admin.from('token_balances')
          .select('balance_usd')
          .eq('user_id', userId)
          .single()

        await admin.from('token_balances').upsert({
          user_id: userId,
          balance_usd: (balance?.balance_usd || 0) + amount,
        }, { onConflict: 'user_id' })
      }
      break
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string

      const { data: subscription } = await admin.from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (subscription) {
        await admin.from('subscriptions').update({
          status: sub.status === 'active' ? 'activa' : 'cancelada',
          cancel_at: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
        }).eq('user_id', subscription.user_id)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
