import { getStripe, PRICE_IDS } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const body = await req.json()
  // Support multiple naming conventions: price_id (spec), priceId (legacy), plan (from register/dashboard flow)
  const { mode, price_id, priceId, plan, amount } = body
  const planToPriceId: Record<string, string> = {
    core: PRICE_IDS.core_monthly,
    pro: PRICE_IDS.pro_monthly,
    enterprise: PRICE_IDS.enterprise_monthly,
  }
  const resolvedPriceId: string | undefined = price_id || priceId || (plan ? planToPriceId[plan] : undefined) || undefined
  const stripe = getStripe()
  const admin = createAdminClient()

  // Buscar o crear Stripe customer usando profiles.stripe_customer_id
  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  let customerId = profile?.stripe_customer_id as string | undefined
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
  }

  let session

  if (mode === 'payment') {
    if (resolvedPriceId) {
      // Recarga con precio predefinido (token_10, token_25, etc.)
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment',
        line_items: [{ price: resolvedPriceId, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/facturacion?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/facturacion?canceled=true`,
        metadata: { supabase_user_id: user.id },
      })
    } else {
      // Recarga con monto libre (legacy — $5–$1,000)
      const num = parseFloat(amount)
      if (!num || num < 5 || num > 1000) {
        return NextResponse.json({ error: 'Monto entre $5 y $1,000' }, { status: 400 })
      }
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Créditos Reason — $${num} USD`,
              description: 'Saldo para usar en sesiones, consultoría y documentos.',
            },
            unit_amount: Math.round(num * 100),
          },
          quantity: 1,
        }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/facturacion?success=true&amount=${num}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/facturacion?canceled=true`,
        metadata: { supabase_user_id: user.id },
      })
    }
  } else {
    // Suscripción
    if (!resolvedPriceId) {
      return NextResponse.json({ error: 'price_id required for subscription' }, { status: 400 })
    }
    session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: resolvedPriceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/facturacion?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/facturacion?canceled=true`,
      metadata: { supabase_user_id: user.id },
    })
  }

  return NextResponse.json({ url: session.url })
}
