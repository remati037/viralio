import { getUser } from '@/lib/utils/auth'
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
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tier } = await request.json()

    // Only Pro plan is available (users subscribe to Pro tier)
    if (!tier || tier !== 'pro') {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    // Get Pro price ID from environment variables
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
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          userId: user.id,
          tier: tier,
        },
      },
      customer_email: user.email || undefined,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        tier: tier,
      },
      success_url: `${request.nextUrl.origin}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/?canceled=true`,
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

