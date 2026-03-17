import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const body = await req.json()
  const { mode, priceId, amount } = body
  const stripe = getStripe()

  let session

  if (mode === 'payment') {
    const num = parseFloat(amount)
    if (!num || num < 5 || num > 1000) {
      return NextResponse.json({ error: 'Monto entre $5 y $1,000' }, { status: 400 })
    }
    session = await stripe.checkout.sessions.create({
      customer_email: user.email!,
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
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success&amount=${num}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/facturacion?checkout=cancel`,
      metadata: { userId: user.id, plan: 'tokens', amount: String(num) },
    })
  } else {
    session = await stripe.checkout.sessions.create({
      customer_email: user.email!,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/planes?checkout=cancel`,
      metadata: { userId: user.id, plan: 'pro' },
    })
  }

  return NextResponse.json({ url: session.url })
}
