import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/utils/auth'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

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

export async function GET(request: NextRequest) {
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

    const supabase = await createClient()

    // Get user's latest payment
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)

    if (paymentsError || !payments || payments.length === 0) {
      return NextResponse.json({
        isCancelled: false,
        hasActiveSubscription: false,
      })
    }

    const latestPayment = payments[0]
    const subscriptionId = (latestPayment as any).stripe_subscription_id

    if (!subscriptionId) {
      // No subscription ID, check if period is still active
      const isActive = latestPayment.subscription_period_end
        ? new Date(latestPayment.subscription_period_end) > new Date()
        : false

      return NextResponse.json({
        isCancelled: false,
        hasActiveSubscription: isActive,
      })
    }

    // Get subscription status from Stripe
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)

      return NextResponse.json({
        isCancelled: (subscription as any).cancel_at_period_end === true,
        hasActiveSubscription: (subscription as any).status === 'active' || (subscription as any).status === 'trialing',
        cancelAt: (subscription as any).cancel_at,
        currentPeriodEnd: (subscription as any).current_period_end,
        trialEnd: (subscription as any).trial_end,
        status: (subscription as any).status,
      })
    } catch (error: any) {
      // Subscription might not exist in Stripe anymore
      console.error('Error retrieving subscription:', error)
      return NextResponse.json({
        isCancelled: false,
        hasActiveSubscription: false,
        error: 'Subscription not found in Stripe',
      })
    }
  } catch (error: any) {
    console.error('Error getting subscription status:', error)
    return NextResponse.json(
      { error: 'Failed to get subscription status', details: error.message },
      { status: 500 }
    )
  }
}

