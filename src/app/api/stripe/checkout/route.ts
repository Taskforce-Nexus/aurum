import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { priceId, mode } = await req.json()

  const session = await stripe.checkout.sessions.create({
    customer_email: user.email!,
    mode: mode || 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/planes?checkout=cancel`,
    metadata: { userId: user.id, plan: mode === 'subscription' ? 'pro' : 'tokens' },
  })

  return NextResponse.json({ url: session.url })
}
