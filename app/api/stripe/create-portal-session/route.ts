import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/utils'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

let stripe: Stripe | null = null
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
} catch (error) {
  console.error('Failed to initialize Stripe:', error)
}

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      )
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    const { data: payments } = await supabase
      .from('payments')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .not('stripe_subscription_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)

    let customerId: string | null = null

    const subscriptionId = (payments?.[0] as { stripe_subscription_id?: string } | undefined)?.stripe_subscription_id
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      customerId = typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer?.id ?? null
    }

    if (!customerId && user.email) {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      })
      customerId = customers.data[0]?.id ?? null
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found. Subscribe first to manage your subscription.' },
        { status: 404 }
      )
    }

    const origin = request.nextUrl.origin
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/payments`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    console.error('Error creating portal session:', error)
    const message = error instanceof Error ? error.message : 'Failed to create portal session'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
