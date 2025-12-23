import { getUser } from '@/lib/utils/auth'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

// Initialize Stripe
let stripe: Stripe | null = null
try {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (secretKey) {
    stripe = new Stripe(secretKey)
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

    // Verify user is authenticated
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed', paymentStatus: session.payment_status },
        { status: 400 }
      )
    }

    // Verify the session belongs to this user
    const userId = session.metadata?.userId || session.client_reference_id
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Session does not belong to this user' }, { status: 403 })
    }

    // Check if we already processed this session
    const supabase = await createClient()
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // If payment already exists and is recent, skip
    if (existingPayment) {
      return NextResponse.json({ 
        success: true, 
        message: 'Payment already processed',
        alreadyProcessed: true 
      })
    }

    // Get subscription details
    const subscriptionId = session.subscription as string
    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'No subscription found in session' },
        { status: 400 }
      )
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const tier = session.metadata?.tier || 'pro'

    // Calculate subscription period
    const sub = subscription as any
    const periodStart = new Date(sub.current_period_start * 1000).toISOString()
    const periodEnd = new Date(sub.current_period_end * 1000).toISOString()
    const nextPaymentDate = new Date(sub.current_period_end * 1000).toISOString()

    // Create payment record
    const { error: paymentError } = await supabase.from('payments').insert({
      user_id: userId,
      amount: (subscription.items.data[0]?.price.unit_amount || 0) / 100,
      currency: subscription.currency || 'usd',
      status: 'completed',
      payment_method: 'stripe',
      subscription_period_start: periodStart,
      subscription_period_end: periodEnd,
      next_payment_date: nextPaymentDate,
      tier_at_payment: tier,
    })

    if (paymentError) {
      console.error('Error creating payment record:', paymentError)
      return NextResponse.json(
        { error: 'Failed to create payment record', details: paymentError.message },
        { status: 500 }
      )
    }

    // Update user tier in profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ tier: tier })
      .eq('id', userId)

    if (profileError) {
      console.error('Error updating profile tier:', profileError)
      // Don't fail the request if profile update fails, payment is already recorded
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription activated successfully',
      tier: tier 
    })
  } catch (error: any) {
    console.error('Error verifying session:', error)
    return NextResponse.json(
      { error: 'Failed to verify session', details: error.message },
      { status: 500 }
    )
  }
}

