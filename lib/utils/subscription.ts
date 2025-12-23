import { createClient } from '@/lib/supabase/server'

export interface SubscriptionStatus {
  hasActiveSubscription: boolean
  subscriptionEndDate: string | null
  tier: 'free' | 'pro' | 'admin' | null
  isAdmin: boolean
}

/**
 * Check if user has an active subscription
 * A subscription is considered active if:
 * - User is an admin (admins always have access)
 * - OR there's a payment record with status 'completed'
 * - AND subscription_period_end is in the future
 */
export async function checkSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const supabase = await createClient()

  // First, check if user is admin - admins always have access
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
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

  // Get the most recent completed payment
  const { data: payments, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)

  if (error || !payments || payments.length === 0) {
    return {
      hasActiveSubscription: false,
      subscriptionEndDate: null,
      tier: null,
      isAdmin: false,
    }
  }

  const latestPayment = payments[0]

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

