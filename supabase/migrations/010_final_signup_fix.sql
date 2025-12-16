-- FINAL FIX: Complete signup fix with all necessary changes
-- Run this migration to fix user signup completely

-- Step 1: Drop and recreate handle_new_user with proper fields
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    business_name, 
    target_audience, 
    persona, 
    monthly_goal_short, 
    monthly_goal_long, 
    role, 
    tier
  )
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
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Error creating profile: %', SQLERRM;
END;
$$;

-- Step 2: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Fix statistics function
DROP FUNCTION IF EXISTS create_user_statistics() CASCADE;
CREATE OR REPLACE FUNCTION create_user_statistics()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_statistics (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the profile creation
    RAISE WARNING 'Error creating statistics: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Step 4: Fix payment function
DROP FUNCTION IF EXISTS initialize_mock_payment() CASCADE;
CREATE OR REPLACE FUNCTION initialize_mock_payment()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
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
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the profile creation
    RAISE WARNING 'Error creating payment: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Step 5: Ensure all RLS policies exist and allow system inserts
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Critical: Allow system/triggers to insert profiles
CREATE POLICY "System can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Ensure statistics policy exists
DROP POLICY IF EXISTS "System can insert statistics" ON user_statistics;
CREATE POLICY "System can insert statistics"
  ON user_statistics FOR INSERT
  WITH CHECK (true);

-- Ensure payments policy exists
DROP POLICY IF EXISTS "System can insert payments" ON payments;
CREATE POLICY "System can insert payments"
  ON payments FOR INSERT
  WITH CHECK (true);

-- Step 6: Grant execute permissions (if needed)
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION create_user_statistics() TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION initialize_mock_payment() TO postgres, anon, authenticated, service_role;

