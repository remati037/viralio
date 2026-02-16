import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/utils'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Initialize Stripe - will throw error if key is missing
let stripe: Stripe | null = null
try {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    console.error('STRIPE_SECRET_KEY is not set in environment variables')
  } else {
    stripe = new Stripe(secretKey)
  }
} catch (error) {
  console.error('Failed to initialize Stripe:', error)
}

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is initialized
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables.' },
        { status: 500 }
      )
    }

    // Verify user is authenticated
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tier } = await request.json()

    // Only Pro plan is available (users subscribe to Pro tier)
    if (!tier || tier !== 'pro') {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    // Pro plan: €19/month. Trial: admin-set free_trial_ends_at or default 7 days
    const priceId = process.env.STRIPE_PRO_PRICE_ID || process.env.STRIPE_STARTER_PRICE_ID

    if (!priceId) {
      return NextResponse.json(
        { error: 'STRIPE_STARTER_PRICE_ID is not configured. Please set it in environment variables.' },
        { status: 500 }
      )
    }

    // Validate price ID format
    if (!priceId.startsWith('price_')) {
      return NextResponse.json(
        {
          error: `Invalid Price ID format. Expected a Price ID (starts with "price_"), but got: ${priceId}. Please check your STRIPE_STARTER_PRICE_ID in environment variables.`
        },
        { status: 500 }
      )
    }

    // Check for admin-set free trial end date
    const supabase = await createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('free_trial_ends_at, has_unlimited_free')
      .eq('id', user.id)
      .single()

    const freeTrialEndsAt = profile?.free_trial_ends_at
    const now = Math.floor(Date.now() / 1000)
    const trialEndUnix =
      freeTrialEndsAt && !profile?.has_unlimited_free
        ? Math.floor(new Date(freeTrialEndsAt).getTime() / 1000)
        : null

    // Use admin-set trial_end if it's in the future (min 1 hour from now for Stripe)
    const subscriptionData: Stripe.Checkout.SessionCreateParams['subscription_data'] = {
      metadata: {
        userId: user.id,
        tier: tier,
      },
    }
    if (trialEndUnix && trialEndUnix > now + 3600) {
      subscriptionData.trial_end = trialEndUnix
    } else {
      subscriptionData.trial_period_days = 7
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: subscriptionData,
      customer_email: user.email || undefined,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        tier: tier,
      },
      success_url: `${request.nextUrl.origin}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/pocetna?canceled=true`,
    })

    // Return both session ID and URL for compatibility
    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    })
  } catch (error: any) {
    console.error('Error creating checkout session:', error)

    // Provide more specific error messages
    let errorMessage = 'Failed to create checkout session'
    if (error?.type === 'StripeInvalidRequestError') {
      errorMessage = `Stripe error: ${error.message || 'Invalid request. Please check your Price ID.'}`
    } else if (error?.message) {
      errorMessage = error.message
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

