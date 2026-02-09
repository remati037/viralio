# Payment Flow (Client Overview) & Stripe Setup

## Part 1: Payment Process – For Client Presentation

### User types

- **Admin user**  
  - Full access without payment.  
  - Can manage users: add other admins, grant or revoke “free unlimited” for classic users.  
  - Not shown the payment modal; not charged by Stripe.

- **Classic user**  
  - Must either have an active paid subscription (7-day free trial, then €19/month) or be granted “free unlimited” by an admin.  
  - If they have neither, they see the payment modal and cannot use the app until they subscribe or are granted unlimited.

---

### Classic user: normal subscription (7-day trial, then €19/month)

1. **First time (register or invited with “trial”)**  
   - User logs in.  
   - They see the **payment modal**: “7-day free trial, then €19/month until cancelled.”  
   - They click the button and are sent to **Stripe Checkout** to enter card details.  
   - **€0 is charged for the first 7 days** (trial).  
   - After 7 days, Stripe **automatically charges €19** for the first month, then every month until the user cancels.

2. **If they already have a card on file**  
   - They keep access as long as the subscription is active (trial or paid).  
   - No need to enter card again unless they cancel and resubscribe later, or admin revokes “free unlimited” and they had no paid subscription.

---

### Admin grants “free unlimited” to a classic user

- Admin sets the user to **free unlimited** (e.g. in user management).  
- **Stripe subscription is cancelled** for that user so they are **no longer charged**.  
- The user keeps full access without paying.  
- If they **never entered a card** (e.g. were given unlimited before subscribing), they still get access and do not need to enter a card.

---

### Admin revokes “free unlimited”

- Admin turns off “free unlimited” for that user.  
- From that moment, the user needs an **active paid subscription** to use the app.  
- When the admin granted “free unlimited”, the app **cancelled** that user’s Stripe subscription, so after revoke they have **no** active Stripe subscription.  
- So they **must** subscribe again (payment modal → Stripe Checkout, 7-day trial then €19/month) to keep access.  
- **If they don’t have a card on file** (e.g. they only ever had “free unlimited”):  
  - They see the **payment modal** again.  
  - They click to pay and are sent to **Stripe Checkout** to enter card details (7-day trial, then €19/month).  
  - Until they complete checkout, they cannot use the app.

---

### Summary table

| Scenario | What happens |
|---------|------------------|
| Admin user | No payment modal, no Stripe charges. |
| Classic user, no subscription, no “unlimited” | Sees payment modal → must complete Stripe Checkout (7-day trial, then €19/month). |
| Classic user with active Stripe subscription | Full access; charged €19/month after trial. |
| Admin grants “free unlimited” | User keeps access; Stripe subscription cancelled, no more charges. |
| Admin revokes “free unlimited” | User must have paid subscription: if no card on file, sees modal and must complete Stripe Checkout. |

---

## Part 2: Step-by-Step Stripe Setup

### 1. Stripe account and mode

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/).  
2. For development: turn **Test mode** ON (top right).  
3. For production: use **Live mode** and live keys.

---

### 2. Create product and price (€19/month)

1. In Stripe: **Products** → **Add product**.  
2. **Product name**: e.g. `Viralio Pro`.  
3. **Description**: e.g. `Monthly subscription – full access`.  
4. Under **Pricing**:  
   - **Pricing model**: Standard pricing.  
   - **Price**: `19.00`.  
   - **Currency**: `EUR` (or your chosen currency).  
   - **Billing period**: **Monthly** (recurring).  
5. Save the product.  
6. Open the product and copy the **Price ID** (starts with `price_`).  
   - You will use this in the app as the subscription price; the **7-day trial** is set in the app when creating the Checkout Session, not in the Stripe product.

---

### 3. API keys

1. **Developers** → **API keys**.  
2. **Test mode**: copy **Secret key** (`sk_test_...`) and **Publishable key** (`pk_test_...`).  
3. **Live mode** (for production): copy the **Secret** and **Publishable** keys.

---

### 4. Environment variables

In your app (e.g. `.env.local`), set:

```env
# Stripe keys (use test keys for development)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Price ID from step 2 (€19/month)
STRIPE_PRO_PRICE_ID=price_...
# Or keep existing name:
STRIPE_STARTER_PRICE_ID=price_...

# Webhook signing secret (step 5)
STRIPE_WEBHOOK_SECRET=whsec_...
```

The app uses `STRIPE_PRO_PRICE_ID` or, if not set, `STRIPE_STARTER_PRICE_ID`. The **7-day trial** is applied in code when creating the Checkout Session; the Stripe price is only the recurring €19/month.

---

### 5. Webhook endpoint

1. **Developers** → **Webhooks** → **Add endpoint**.  
2. **Endpoint URL**:  
   - Production: `https://yourdomain.com/api/stripe/webhook`  
   - Local: use Stripe CLI (see below).  
3. **Events to send**:  
   - `checkout.session.completed`  
   - `customer.subscription.updated`  
   - `customer.subscription.deleted`  
   - `invoice.payment_succeeded`  
4. After creating the endpoint, open it and reveal the **Signing secret** (`whsec_...`).  
5. Put that value in `STRIPE_WEBHOOK_SECRET` in your env.

**Local development (Stripe CLI):**

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Use the printed `whsec_...` as `STRIPE_WEBHOOK_SECRET` in `.env.local`.

---

### 6. Test cards (test mode only)

- **Success**: `4242 4242 4242 4242`  
- **Decline**: `4000 0000 0000 0002`  
- Use any future expiry, any CVC, any postal code.

---

### 7. Production checklist

- [ ] Create **live** product/price (€19/month) in Live mode.  
- [ ] Use **live** Secret and Publishable keys in production env.  
- [ ] Add production webhook URL in Stripe (Live mode).  
- [ ] Set production `STRIPE_WEBHOOK_SECRET` from that endpoint.  
- [ ] Set `STRIPE_PRO_PRICE_ID` (or `STRIPE_STARTER_PRICE_ID`) to the **live** price ID.

---

## Part 3: How the app uses this

- **Admins**: Bypass subscription check; no modal, no Stripe.  
- **Classic users**:  
  - Subscription status is checked (DB + Stripe).  
  - If no active subscription and no “free unlimited”, the payment modal is shown.  
  - “Subscribe” creates a Stripe Checkout Session with **7-day trial** and the **€19/month** price from env.  
  - Webhooks update the database and profile (tier, payment records).  
- **Admin grants “free unlimited”**: App cancels the user’s Stripe subscription so they are not charged.  
- **Admin revokes “free unlimited”**: User must have an active subscription; if not, they see the modal and must complete Stripe Checkout (trial + €19/month) to continue.

---

## Where to see subscriptions in the database

Subscription state is stored in **two** places:

### 1. `profiles` table

- **`tier`**: `'free'` | `'pro'` | `'admin'`  
  - `free` = must subscribe (sees payment modal).  
  - `pro` = has or had Pro access (Stripe trial/paid or admin-granted).  
  - `admin` = admin user (no payment required).
- **`has_unlimited_free`**: `true` if an admin granted “free unlimited” (no Stripe charges).  
- **`role`**: `'user'` | `'admin'` (used for access control).

In Supabase: **Table Editor → `profiles`**. Filter or sort by `tier` / `has_unlimited_free` to see who has access.

### 2. `payments` table

- **`user_id`**: Links to the user (and `profiles.id`).  
- **`stripe_subscription_id`**: Stripe subscription ID (e.g. `sub_xxx`). Present when the user went through Stripe Checkout (trial or paid).  
- **`subscription_period_start`** / **`subscription_period_end`**: Billing period.  
- **`status`**: e.g. `'completed'`.  
- **`tier_at_payment`**: Tier at time of payment (`'pro'` for the paid plan).  
- **`amount`**, **`currency`**: Payment amount (0 for trial record).

In Supabase: **Table Editor → `payments`**. One row per billing period (plus one for trial when they start the 7-day trial). Use **`payments.stripe_subscription_id`** to see who has an active Stripe subscription.

**Quick checks**

- User sees payment modal → `profiles.tier = 'free'` and no active Stripe subscription (no recent/valid row in `payments` with that `user_id` and `stripe_subscription_id`, or Stripe reports subscription inactive).  
- User has “free unlimited” → `profiles.has_unlimited_free = true`.  
- User is on paid/trial → `profiles.tier = 'pro'` and at least one `payments` row for that `user_id` with `stripe_subscription_id` set (and subscription still active in Stripe if you need to double-check).
