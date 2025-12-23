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
        const priceId = subscription.items.data[0]?.price.id
        const tier = session.metadata?.tier || 'pro'

        // Calculate subscription period
        // Type assertion needed because Stripe types may not include all properties
        const sub = subscription as any

        // Validate and convert timestamps
        const currentPeriodStart = sub.current_period_start
        const currentPeriodEnd = sub.current_period_end

        if (!currentPeriodStart || !currentPeriodEnd) {
          console.error('Subscription period dates are missing', {
            currentPeriodStart,
            currentPeriodEnd,
            subscriptionId,
          })
          return NextResponse.json(
            { error: 'Subscription period dates are missing' },
            { status: 500 }
          )
        }

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

        // Convert Unix timestamps to ISO strings
        const periodStartTimestamp = typeof currentPeriodStart === 'number'
          ? currentPeriodStart * 1000
          : parseInt(String(currentPeriodStart)) * 1000
        const periodEndTimestamp = typeof periodEndToUse === 'number'
          ? periodEndToUse * 1000
          : parseInt(String(periodEndToUse)) * 1000

        const periodStartDate = new Date(periodStartTimestamp)
        const periodEndDate = new Date(periodEndTimestamp)

        // Validate dates
        if (isNaN(periodStartDate.getTime()) || isNaN(periodEndDate.getTime())) {
          console.error('Invalid subscription period dates', {
            currentPeriodStart,
            currentPeriodEnd,
            trialEnd,
            periodStartTimestamp,
            periodEndTimestamp,
          })
          return NextResponse.json(
            { error: 'Invalid subscription period dates' },
            { status: 500 }
          )
        }

        const periodStart = periodStartDate.toISOString()
        const periodEnd = periodEndDate.toISOString()
        // next_payment_date should be when they'll actually be charged (after trial if trial exists)
        const nextPaymentDate = periodEndDate.toISOString()

        // Create payment record
        const { error: paymentError } = await supabase.from('payments').insert({
          user_id: userId,
          amount: (subscription.items.data[0]?.price.unit_amount || 0) / 100, // Convert from cents
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
          // Return error so Stripe knows the webhook failed
          return NextResponse.json(
            { error: 'Failed to create payment record', details: paymentError },
            { status: 500 }
          )
        }

        console.log(`✅ Payment record created for user ${userId}, tier: ${tier}`)

        // Update user tier in profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ tier: tier })
          .eq('id', userId)

        if (profileError) {
          console.error('Error updating profile tier:', profileError)
          // Don't fail webhook if profile update fails, payment is already recorded
        } else {
          console.log(`✅ Profile tier updated for user ${userId} to ${tier}`)
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
      // Type assertion needed because Stripe types may not include all properties
      const inv = invoice as any
      const subscriptionId = typeof inv.subscription === 'string'
        ? inv.subscription
        : (inv.subscription as Stripe.Subscription | null)?.id || null

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const customerId = subscription.customer as string

        // Get user by customer ID or subscription metadata
        // For now, we'll need to store Stripe customer ID in the database
        // This is a simplified version - you may need to adjust based on your setup

        // Update payment record for renewal
        const sub = subscription as any
        const periodStart = new Date(sub.current_period_start * 1000).toISOString()
        const periodEnd = new Date(sub.current_period_end * 1000).toISOString()

        // You'll need to find the user by customer ID or another method
        // This is a placeholder - adjust based on your needs
      }
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

