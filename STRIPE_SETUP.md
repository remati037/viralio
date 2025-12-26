# Stripe Payment Integration Setup

This document explains how to set up Stripe payments for the Viralio app.

## Overview

The app now includes full Stripe payment integration with the following features:
- ✅ Subscription status checking on login and page load
- ✅ Automatic subscription modal for users without active subscriptions
- ✅ Stripe Checkout integration for payment processing
- ✅ Webhook handling for subscription events
- ✅ Database integration for subscription tracking
- ✅ User tier management based on subscription

## ⚠️ IMPORTANT: Test Mode

**By default, the app uses Stripe TEST MODE** - no real money will be charged. Test mode keys start with `sk_test_` and `pk_test_`.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Stripe Test Mode Keys (NO REAL MONEY)
# Get these from: https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Price ID (from your Stripe Dashboard)
# Create a product in TEST MODE and copy the Price ID
STRIPE_STARTER_PRICE_ID=price_...

# Stripe Webhook Secret (for local development, use Stripe CLI)
# For production, use webhook endpoint secret from Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Stripe Dashboard Setup

### 1. Enable Test Mode

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Make sure **TEST MODE** toggle is ON (top right of the dashboard)
3. You'll see "Test mode" indicator - this ensures no real money is charged

### 2. Create Product and Price

1. Navigate to **Products** → **Add Product**
2. Create **Starter Plan**:
   - Name: `Starter Plan`
   - Description: `Monthly subscription for Viralio`
   - Pricing: `$29.00 USD`
   - Billing period: `Monthly (recurring)`
3. Click **Save product**
4. Copy the **Price ID** (starts with `price_`) and add it to your `.env.local` as `STRIPE_STARTER_PRICE_ID`

### 2. Set Up Webhook Endpoint

1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Set the endpoint URL to: `https://yourdomain.com/api/stripe/webhook`
   - For local development, use [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward webhooks:
     ```bash
     stripe listen --forward-to localhost:3000/api/stripe/webhook
     ```
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
5. Copy the webhook signing secret and add it to your `.env.local` file

## How It Works

### Subscription Flow

1. **User Signs Up/Logs In**: User creates account or logs in
2. **Subscription Check**: System checks if user has active subscription
3. **No Subscription**: 
   - User sees "Subscribe to Use the App" message
   - Subscription modal appears automatically
   - User can select a plan and click "Subscribe with Stripe"
4. **Stripe Checkout**: User is redirected to Stripe Checkout page
5. **Payment Success**: 
   - Stripe webhook updates the database
   - User is redirected back to app
   - Subscription is now active

### Database Schema

The app uses the `payments` table to track subscriptions:
- `status`: 'completed' indicates active subscription
- `subscription_period_end`: Date when subscription expires
- `tier_at_payment`: The tier purchased ('starter')

### Subscription Status Check

A subscription is considered active if:
- There's a payment record with `status = 'completed'`
- `subscription_period_end` is in the future

## Testing with Test Cards

Since you're using **TEST MODE**, you can use Stripe's test card numbers. No real money will be charged!

### Test Card Numbers

Use these test cards from [Stripe Testing](https://stripe.com/docs/testing):

**Successful Payment:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

**Declined Payment (for testing errors):**
- Card: `4000 0000 0000 0002`

### Local Development Setup

1. **Install Stripe CLI** (for webhook forwarding):
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. **Login to Stripe CLI**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to your local server**:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   This will output a webhook secret (starts with `whsec_`) - add it to your `.env.local` as `STRIPE_WEBHOOK_SECRET`

4. **Start your Next.js app**:
   ```bash
   npm run dev
   ```

5. **Test the flow**:
   - Sign up/login to your app
   - You'll see the subscription modal
   - Click "Subscribe with Stripe"
   - Use test card `4242 4242 4242 4242` to complete payment
   - You should be redirected back and see the app!

## Production Deployment

1. Switch to live mode keys in Stripe Dashboard
2. Update environment variables with production keys
3. Set up webhook endpoint in Stripe Dashboard pointing to your production URL
4. Update webhook secret in your production environment variables

