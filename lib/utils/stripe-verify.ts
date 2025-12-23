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

export async function verifyCheckoutSession(
  sessionId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!stripe) {
      return { success: false, error: 'Stripe is not configured' }
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      return {
        success: false,
        error: `Payment not completed. Status: ${session.payment_status}`,
      }
    }

    // Verify the session belongs to this user
    const sessionUserId = session.metadata?.userId || session.client_reference_id
    if (sessionUserId !== userId) {
      return {
        success: false,
        error: 'Session does not belong to this user',
      }
    }

    // Check if we already processed this session
    const supabase = await createClient()
    const { data: existingPayments } = await supabase
      .from('payments')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)

    // If payment already exists and subscription is still active, skip
    if (existingPayments && existingPayments.length > 0) {
      const { data: latestPayment } = await supabase
        .from('payments')
        .select('subscription_period_end')
        .eq('id', existingPayments[0].id)
        .single()

      if (latestPayment?.subscription_period_end) {
        const endDate = new Date(latestPayment.subscription_period_end)
        if (endDate > new Date()) {
          // Subscription is still active, no need to process again
          return { success: true }
        }
      }
    }

    // Get subscription details
    const subscriptionId = session.subscription as string
    if (!subscriptionId) {
      return { success: false, error: 'No subscription found in session' }
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const tier = session.metadata?.tier || 'pro'

    // Calculate subscription period
    // Try to get dates from subscription object
    const sub = subscription as any
    
    // Log subscription structure for debugging
    console.log('Subscription object keys:', Object.keys(sub))
    console.log('Subscription current_period_start:', sub.current_period_start)
    console.log('Subscription current_period_end:', sub.current_period_end)
    
    // Validate and convert timestamps
    // Check multiple possible property names
    const currentPeriodStart = sub.current_period_start ?? 
                               sub.currentPeriodStart ?? 
                               (subscription as Stripe.Subscription).current_period_start
    const currentPeriodEnd = sub.current_period_end ?? 
                             sub.currentPeriodEnd ?? 
                             (subscription as Stripe.Subscription).current_period_end
    
    // Handle trial period - if trial_end exists and is in the future, use it for period_end
    // Otherwise use current_period_end
    const trialEnd = sub.trial_end
    let periodEndToUse = currentPeriodEnd
    
    if (trialEnd) {
      // If trial_end is in the future, subscription period ends at trial end
      // After trial, period_end will be the billing period end
      const trialEndDate = new Date(trialEnd * 1000)
      const periodEndDate = new Date(currentPeriodEnd * 1000)
      
      // Use trial_end if it's later than current_period_end (trial is active)
      if (trialEndDate > periodEndDate) {
        periodEndToUse = trialEnd
      }
    }

    // If period dates are missing, try to calculate from session or use defaults
    let periodStartTimestamp: number
    let periodEndTimestamp: number

    if (!currentPeriodStart || !periodEndToUse) {
      console.warn('Subscription period dates missing, using fallback dates', {
        id: subscription.id,
        status: subscription.status,
        trialEnd: trialEnd,
      })
      
      // Fallback: Use current time as start, and add 1 month as end
      const now = Math.floor(Date.now() / 1000)
      const oneMonthFromNow = now + (30 * 24 * 60 * 60) // 30 days in seconds
      
      periodStartTimestamp = now * 1000
      periodEndTimestamp = oneMonthFromNow * 1000
    } else {
      // Convert Unix timestamps to milliseconds
      periodStartTimestamp = typeof currentPeriodStart === 'number' 
        ? currentPeriodStart * 1000 
        : parseInt(String(currentPeriodStart)) * 1000
      periodEndTimestamp = typeof periodEndToUse === 'number'
        ? periodEndToUse * 1000
        : parseInt(String(periodEndToUse)) * 1000
    }

    const periodStartDate = new Date(periodStartTimestamp)
    const periodEndDate = new Date(periodEndTimestamp)

    // Validate dates
    if (isNaN(periodStartDate.getTime()) || isNaN(periodEndDate.getTime())) {
      return {
        success: false,
        error: `Invalid subscription period dates. Start: ${currentPeriodStart}, End: ${currentPeriodEnd}`,
      }
    }

    const periodStart = periodStartDate.toISOString()
    const periodEnd = periodEndDate.toISOString()
    const nextPaymentDate = periodEndDate.toISOString()

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
      stripe_subscription_id: subscriptionId,
    })

    if (paymentError) {
      console.error('Error creating payment record:', paymentError)
      return {
        success: false,
        error: `Failed to create payment record: ${paymentError.message}`,
      }
    }

    // Update user tier in profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ tier: tier })
      .eq('id', userId)

    if (profileError) {
      console.error('Error updating profile tier:', profileError)
      // Don't fail if profile update fails, payment is already recorded
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error verifying checkout session:', error)
    return {
      success: false,
      error: error.message || 'Failed to verify session',
    }
  }
}

