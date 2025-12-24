import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export interface SubscriptionStatus {
  hasActiveSubscription: boolean
  subscriptionEndDate: string | null
  tier: 'free' | 'pro' | 'admin' | null
  isAdmin: boolean
}

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

/**
 * Check if user has an active subscription
 * A subscription is considered active if:
 * - User is an admin (admins always have access)
 * - OR there's a payment record with status 'completed' AND subscription_period_end is in the future
 * - OR there's an active Stripe subscription (including trials)
 */
export async function checkSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const supabase = await createClient()

  // First, check if user is admin - admins always have access
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, tier, has_unlimited_free')
    .eq('id', userId)
    .single()

  if (!profileError && profile?.role === 'admin') {
    return {
      hasActiveSubscription: true,
      subscriptionEndDate: null,
      tier: null,
      isAdmin: true,
    }
  }

  // Check if user has unlimited free subscription (granted by admin)
  // If has_unlimited_free is true, user should have full access regardless of tier
  if (!profileError && profile?.has_unlimited_free === true) {
    return {
      hasActiveSubscription: true,
      subscriptionEndDate: null, // Unlimited, no end date
      tier: profile?.tier || 'pro', // Use their tier, default to pro
      isAdmin: false,
    }
  }

  // Check for active Stripe subscription (including trials)
  // First, try to find subscription ID from payment records
  const { data: payments } = await supabase
    .from('payments')
    .select('stripe_subscription_id')
    .eq('user_id', userId)
    .not('stripe_subscription_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)

  let subscriptionId: string | null = null
  if (payments && payments.length > 0) {
    subscriptionId = (payments[0] as any).stripe_subscription_id
  }

  // If user has 'pro' tier but no payment record, they might be in trial
  // In this case, we'll allow access since the webhook sets tier to 'pro' when trial starts
  // This is a fallback for trial users who don't have a payment record yet
  if (!subscriptionId && profile?.tier === 'pro') {
    // User has pro tier but no payment record - likely in trial
    // Allow access and return a reasonable end date (we'll get actual date from Stripe if possible)
    // For now, return true to allow access - the subscription-status API will provide accurate dates
    return {
      hasActiveSubscription: true,
      subscriptionEndDate: null, // Will be determined by subscription-status API
      tier: 'pro',
      isAdmin: false,
    }
  }

  // If we have a subscription ID, check Stripe directly
  if (subscriptionId && stripe) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const sub = subscription as any
      const status = sub.status
      const isActive = status === 'active' || status === 'trialing'

      if (isActive) {
        // Determine end date - use trial_end if in trial, otherwise current_period_end
        const trialEnd = sub.trial_end
        const currentPeriodEnd = sub.current_period_end
        const now = Math.floor(Date.now() / 1000)

        let endDate: Date | null = null
        if (trialEnd && trialEnd > now) {
          // In trial, use trial end date
          endDate = new Date(trialEnd * 1000)
        } else if (currentPeriodEnd) {
          // Not in trial, use current period end
          endDate = new Date(currentPeriodEnd * 1000)
        }

        return {
          hasActiveSubscription: true,
          subscriptionEndDate: endDate ? endDate.toISOString() : null,
          tier: profile?.tier || 'pro',
          isAdmin: false,
        }
      }
    } catch (error) {
      // Subscription might not exist in Stripe, continue to check payment records
      console.error('Error retrieving subscription from Stripe:', error)
    }
  }

  // Fallback: Check payment records
  const { data: paymentRecords, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)

  if (error || !paymentRecords || paymentRecords.length === 0) {
    return {
      hasActiveSubscription: false,
      subscriptionEndDate: null,
      tier: null,
      isAdmin: false,
    }
  }

  const latestPayment = paymentRecords[0]

  // Check if subscription is still active (end date is in the future)
  if (latestPayment.subscription_period_end) {
    const endDate = new Date(latestPayment.subscription_period_end)
    const now = new Date()

    if (endDate > now) {
      return {
        hasActiveSubscription: true,
        subscriptionEndDate: latestPayment.subscription_period_end,
        tier: latestPayment.tier_at_payment,
        isAdmin: false,
      }
    }
  }

  return {
    hasActiveSubscription: false,
    subscriptionEndDate: latestPayment.subscription_period_end,
    tier: latestPayment.tier_at_payment,
    isAdmin: false,
  }
}

