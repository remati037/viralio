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

    // Get user profile to check tier and unlimited free subscription
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier, has_unlimited_free, role')
      .eq('id', user.id)
      .single()

    // Check if user is admin or has unlimited free subscription
    if (profile?.role === 'admin' || profile?.has_unlimited_free === true) {
      return NextResponse.json({
        isCancelled: false,
        hasActiveSubscription: true,
        isUnlimitedFree: profile?.has_unlimited_free === true,
        isAdmin: profile?.role === 'admin',
      })
    }

    // Get user's latest payment
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)

    let subscriptionId: string | null = null
    let latestPayment = null

    if (payments && payments.length > 0) {
      latestPayment = payments[0]
      subscriptionId = (latestPayment as any).stripe_subscription_id
    }

    // If no subscription ID but user has 'pro' tier, they might be in trial
    // Try to find subscription by searching Stripe
    if (!subscriptionId && profile?.tier === 'pro' && user.email) {
      try {
        const customers = await stripe.customers.list({
          email: user.email,
          limit: 1,
        })

        if (customers.data.length > 0) {
          const subscriptions = await stripe.subscriptions.list({
            customer: customers.data[0].id,
            status: 'all',
            limit: 10,
          })

          const activeSubscription = subscriptions.data.find(
            (sub) => sub.status === 'active' || sub.status === 'trialing'
          )

          if (activeSubscription) {
            subscriptionId = activeSubscription.id
          }
        }
      } catch (error) {
        console.error('Error searching for subscription:', error)
      }
    }

    if (!subscriptionId) {
      // No subscription ID found, check if period is still active from payment record
      if (latestPayment?.subscription_period_end) {
        const isActive = new Date(latestPayment.subscription_period_end) > new Date()
        return NextResponse.json({
          isCancelled: false,
          hasActiveSubscription: isActive,
        })
      }

      // If user has pro tier but no subscription found, they might have lost access
      // or subscription was deleted
      return NextResponse.json({
        isCancelled: false,
        hasActiveSubscription: false,
      })
    }

    // Get subscription status from Stripe
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const sub = subscription as any

      const isTrialing = sub.status === 'trialing'
      const trialEnd = sub.trial_end
      const currentPeriodEnd = sub.current_period_end
      const now = Math.floor(Date.now() / 1000)
      const isCancelled = sub.cancel_at_period_end === true

      // Determine if trial is active
      const isTrialActive = isTrialing || (trialEnd && trialEnd > now)

      // If cancelled and in trial, the end date should be trial end, not current period end
      let effectiveEndDate = currentPeriodEnd
      if (isCancelled && isTrialActive && trialEnd) {
        effectiveEndDate = trialEnd
      }

      return NextResponse.json({
        isCancelled: isCancelled,
        hasActiveSubscription: sub.status === 'active' || sub.status === 'trialing',
        cancelAt: sub.cancel_at,
        currentPeriodEnd: effectiveEndDate, // Return effective end date (trial end if cancelled in trial)
        trialEnd: trialEnd,
        status: sub.status,
        isTrialing: isTrialActive,
        trialDaysRemaining: isTrialActive && trialEnd ? Math.ceil((trialEnd - now) / (24 * 60 * 60)) : null,
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

