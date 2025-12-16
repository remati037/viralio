-- Fix all trigger functions to use SECURITY DEFINER so they bypass RLS
-- This is critical for signup to work properly

-- Fix handle_new_user function
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

-- Fix create_user_statistics function
CREATE OR REPLACE FUNCTION create_user_statistics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_statistics (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix initialize_mock_payment function
CREATE OR REPLACE FUNCTION initialize_mock_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a mock "free tier" payment record
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

-- Ensure INSERT policies exist for profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "System can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true); -- Allow trigger to insert profiles

