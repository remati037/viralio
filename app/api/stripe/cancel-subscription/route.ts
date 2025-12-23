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

    const supabase = await createClient()

    // Get user's active subscription from payments table
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)

    if (paymentsError || !payments || payments.length === 0) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    const latestPayment = payments[0]

    // Check if subscription is still active
    if (latestPayment.subscription_period_end) {
      const endDate = new Date(latestPayment.subscription_period_end)
      const now = new Date()

      if (endDate <= now) {
        return NextResponse.json(
          { error: 'Subscription has already expired' },
          { status: 400 }
        )
      }
    }

    // Get subscription ID from payment record
    const subscriptionId = (latestPayment as any).stripe_subscription_id
    
    if (!subscriptionId) {
      // Try to find subscription by searching Stripe (fallback)
      // Search by customer email
      const customerEmail = user.email
      if (customerEmail) {
        const customers = await stripe.customers.list({
          email: customerEmail,
          limit: 1,
        })
        
        if (customers.data.length > 0) {
          const subscriptions = await stripe.subscriptions.list({
            customer: customers.data[0].id,
            status: 'active',
            limit: 1,
          })
          
          if (subscriptions.data.length > 0) {
            const subscription = await stripe.subscriptions.update(subscriptions.data[0].id, {
              cancel_at_period_end: true,
            })
            
            // Update payment record with subscription ID for future reference
            await supabase
              .from('payments')
              .update({ stripe_subscription_id: subscriptions.data[0].id })
              .eq('id', latestPayment.id)
            
            return NextResponse.json({ 
              success: true,
              message: 'Subscription will be cancelled at the end of the current period',
              cancelAt: subscription.cancel_at,
              currentPeriodEnd: subscription.current_period_end,
            })
          }
        }
      }
      
      return NextResponse.json(
        { error: 'Subscription ID not found. Please contact support.' },
        { status: 404 }
      )
    }

    // Cancel the subscription at period end
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })

    return NextResponse.json({ 
      success: true,
      message: 'Subscription will be cancelled at the end of the current period',
      cancelAt: subscription.cancel_at,
      currentPeriodEnd: subscription.current_period_end,
    })
  } catch (error: any) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription', details: error.message },
      { status: 500 }
    )
  }
}

