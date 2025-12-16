-- Complete fix for user signup issues
-- This migration fixes all trigger functions and RLS policies

-- ============================================
-- 1. Fix handle_new_user function (profile creation)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, business_name, target_audience, persona, monthly_goal_short, monthly_goal_long, role, tier)
  VALUES (
    NEW.id,
    '',
    '',
    '',
    0,
    0,
    'user',
    'free'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. Fix create_user_statistics function
-- ============================================
CREATE OR REPLACE FUNCTION create_user_statistics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_statistics (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. Fix initialize_mock_payment function
-- ============================================
CREATE OR REPLACE FUNCTION initialize_mock_payment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO payments (
    user_id,
    amount,
    currency,
    status,
    payment_method,
    subscription_period_start,
    subscription_period_end,
    next_payment_date,
    tier_at_payment
  )
  VALUES (
    NEW.id,
    0.00,
    'USD',
    'completed',
    'free_tier',
    TIMEZONE('utc', NOW()),
    TIMEZONE('utc', NOW() + INTERVAL '1 month'),
    TIMEZONE('utc', NOW() + INTERVAL '1 month'),
    'free'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. Ensure RLS policies allow system inserts
-- ============================================

-- Profiles INSERT policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "System can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true); -- Allow trigger to insert profiles

-- User statistics INSERT policy (should already exist, but ensure it does)
DROP POLICY IF EXISTS "System can insert statistics" ON user_statistics;
CREATE POLICY "System can insert statistics"
  ON user_statistics FOR INSERT
  WITH CHECK (true); -- Handled by trigger

-- Payments INSERT policy (should already exist, but ensure it does)
DROP POLICY IF EXISTS "System can insert payments" ON payments;
CREATE POLICY "System can insert payments"
  ON payments FOR INSERT
  WITH CHECK (true); -- Handled by trigger

-- ============================================
-- 5. Grant necessary permissions to functions
-- ============================================
-- Functions with SECURITY DEFINER run with the privileges of the function owner
-- Make sure the postgres role (or service_role) owns these functions
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
ALTER FUNCTION create_user_statistics() OWNER TO postgres;
ALTER FUNCTION initialize_mock_payment() OWNER TO postgres;

