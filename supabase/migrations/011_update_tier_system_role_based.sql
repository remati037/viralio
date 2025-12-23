-- Update tier system: Remove 'starter', keep 'pro' and 'admin'
-- Update role system: Auto-set role based on tier (admin tier = admin role, else user role)

-- STEP 1: Update existing data FIRST (before changing constraints)
-- Update existing profiles: if tier is 'starter', change to 'pro'
UPDATE profiles 
SET tier = 'pro' 
WHERE tier = 'starter';

-- Update existing payments: if tier_at_payment is 'starter', change to 'pro'
UPDATE payments 
SET tier_at_payment = 'pro' 
WHERE tier_at_payment = 'starter';

-- Update existing template_visibility: if tier is 'starter', change to 'pro'
UPDATE template_visibility 
SET tier = 'pro' 
WHERE tier = 'starter';

-- STEP 2: Now update constraints (after data is updated)
-- Update tier constraint to remove 'starter' and add 'admin'
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_tier_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_tier_check CHECK (tier IN ('free', 'pro', 'admin'));

-- Update payments tier constraint
ALTER TABLE payments
DROP CONSTRAINT IF EXISTS payments_tier_at_payment_check;

ALTER TABLE payments
ADD CONSTRAINT payments_tier_at_payment_check CHECK (tier_at_payment IN ('free', 'pro', 'admin'));

-- Update template_visibility tier constraint
ALTER TABLE template_visibility
DROP CONSTRAINT IF EXISTS template_visibility_tier_check;

ALTER TABLE template_visibility
ADD CONSTRAINT template_visibility_tier_check CHECK (tier IN ('free', 'pro', 'admin'));

-- Create function to auto-update role based on tier
CREATE OR REPLACE FUNCTION update_role_from_tier()
RETURNS TRIGGER AS $$
BEGIN
  -- If tier is 'admin', set role to 'admin'
  -- Otherwise, set role to 'user'
  IF NEW.tier = 'admin' THEN
    NEW.role = 'admin';
  ELSE
    NEW.role = 'user';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update role when tier changes
DROP TRIGGER IF EXISTS update_role_on_tier_change ON profiles;
CREATE TRIGGER update_role_on_tier_change
  BEFORE INSERT OR UPDATE OF tier ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_role_from_tier();

-- Ensure all profiles have correct role based on tier
UPDATE profiles 
SET role = CASE 
  WHEN tier = 'admin' THEN 'admin'
  ELSE 'user'
END;

-- Add stripe_subscription_id to payments table for cancellation support
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_stripe_subscription_id ON payments(stripe_subscription_id);

