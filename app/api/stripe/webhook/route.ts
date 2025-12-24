import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

// Disable body parsing for webhook route
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createClient()

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId || session.client_reference_id

      if (!userId) {
        console.error('No userId in session metadata')
        break
      }

      // Get subscription details
      const subscriptionId = session.subscription as string

      if (!subscriptionId) {
        console.error('No subscription ID in checkout session')
        break
      }

      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const tier = session.metadata?.tier || 'pro'
        const sub = subscription as any

        // Check if this is a trial subscription (no payment yet)
        const isTrial = sub.status === 'trialing' || (sub.trial_end && sub.trial_end > Math.floor(Date.now() / 1000))

        if (isTrial) {
          // For trial subscriptions, only update the profile tier
          // Don't create a payment record until actual payment occurs
          console.log(`✅ Trial started for user ${userId}, tier: ${tier}`)

          // Update user tier in profile
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ tier: tier })
            .eq('id', userId)

          if (profileError) {
            console.error('Error updating profile tier:', profileError)
          } else {
            console.log(`✅ Profile tier updated for user ${userId} to ${tier} (trial)`)
          }
        } else {
          // If not a trial, payment was made immediately - create payment record
          // This handles cases where trial is disabled or already ended
          const currentPeriodStart = sub.current_period_start
          const currentPeriodEnd = sub.current_period_end

          if (!currentPeriodStart || !currentPeriodEnd) {
            console.error('Subscription period dates are missing', {
              currentPeriodStart,
              currentPeriodEnd,
              subscriptionId,
            })
            break
          }

          // Convert Unix timestamps to ISO strings
          const periodStartTimestamp = typeof currentPeriodStart === 'number'
            ? currentPeriodStart * 1000
            : parseInt(String(currentPeriodStart)) * 1000
          const periodEndTimestamp = typeof currentPeriodEnd === 'number'
            ? currentPeriodEnd * 1000
            : parseInt(String(currentPeriodEnd)) * 1000

          const periodStartDate = new Date(periodStartTimestamp)
          const periodEndDate = new Date(periodEndTimestamp)

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
          } else {
            console.log(`✅ Payment record created for user ${userId}, tier: ${tier}`)
          }

          // Update user tier in profile
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ tier: tier })
            .eq('id', userId)

          if (profileError) {
            console.error('Error updating profile tier:', profileError)
          } else {
            console.log(`✅ Profile tier updated for user ${userId} to ${tier}`)
          }
        }
      } catch (error) {
        console.error('Error processing checkout session:', error)
        return NextResponse.json(
          { error: 'Failed to process checkout session', details: error },
          { status: 500 }
        )
      }

      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      // Handle subscription updates (e.g., tier changes, renewals)
      // You can add logic here to update payment records
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      // Handle subscription cancellation
      // You might want to mark the payment as inactive or update user tier
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const inv = invoice as any
      const subscriptionId = typeof inv.subscription === 'string'
        ? inv.subscription
        : (inv.subscription as Stripe.Subscription | null)?.id || null

      if (!subscriptionId) {
        console.log('No subscription ID in invoice')
        break
      }

      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const sub = subscription as any

        // Find user by subscription ID in payments table
        const { data: existingPayment } = await supabase
          .from('payments')
          .select('user_id, tier_at_payment')
          .eq('stripe_subscription_id', subscriptionId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (!existingPayment) {
          // Try to get user from invoice customer metadata or customer email
          const customerId = typeof subscription.customer === 'string'
            ? subscription.customer
            : (subscription.customer as Stripe.Customer).id

          // If we can't find user, log and skip
          console.log('Could not find user for subscription:', subscriptionId)
          break
        }

        const userId = existingPayment.user_id
        const tier = existingPayment.tier_at_payment || 'pro'

        // Check if this is the first payment (trial just ended) or a renewal
        const currentPeriodStart = sub.current_period_start
        const currentPeriodEnd = sub.current_period_end
        const trialEnd = sub.trial_end

        // Convert Unix timestamps to ISO strings
        const periodStartTimestamp = typeof currentPeriodStart === 'number'
          ? currentPeriodStart * 1000
          : parseInt(String(currentPeriodStart)) * 1000
        const periodEndTimestamp = typeof currentPeriodEnd === 'number'
          ? currentPeriodEnd * 1000
          : parseInt(String(currentPeriodEnd)) * 1000

        const periodStartDate = new Date(periodStartTimestamp)
        const periodEndDate = new Date(periodEndTimestamp)

        const periodStart = periodStartDate.toISOString()
        const periodEnd = periodEndDate.toISOString()
        // next_payment_date is when the next charge will occur (after this period)
        const nextPaymentDate = periodEndDate.toISOString()

        // Get invoice amount (in cents, convert to dollars)
        const amount = (inv.amount_paid || inv.total || 0) / 100
        const currency = inv.currency || 'usd'

        // Create payment record for actual payment
        const { error: paymentError } = await supabase.from('payments').insert({
          user_id: userId,
          amount: amount,
          currency: currency,
          status: 'completed',
          payment_method: 'stripe',
          subscription_period_start: periodStart,
          subscription_period_end: periodEnd,
          next_payment_date: nextPaymentDate,
          tier_at_payment: tier,
          stripe_subscription_id: subscriptionId,
        })

        if (paymentError) {
          console.error('Error creating payment record from invoice:', paymentError)
        } else {
          console.log(`✅ Payment record created from invoice for user ${userId}, amount: ${amount} ${currency}`)
        }
      } catch (error) {
        console.error('Error processing invoice payment:', error)
      }

      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

