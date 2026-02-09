-- New signups get tier 'free' so they see the payment modal and must subscribe (7-day trial, then paid).
-- Re-add 'free' to tier constraint and set handle_new_user() to insert tier = 'free'.

-- Step 1: Re-allow 'free' in profiles tier constraint
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_tier_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_tier_check
CHECK (tier IN ('free', 'pro', 'admin'));

-- Step 2: New users get tier 'free' and has_unlimited_free false (must complete Stripe checkout for access)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_business_name TEXT;
BEGIN
  user_business_name := COALESCE(
    NEW.raw_user_meta_data->>'business_name',
    'User ' || SUBSTRING(NEW.id::text, 1, 8)
  );
  IF LENGTH(TRIM(user_business_name)) = 0 THEN
    user_business_name := 'User ' || SUBSTRING(NEW.id::text, 1, 8);
  END IF;

  INSERT INTO public.profiles (
    id,
    business_name,
    target_audience,
    persona,
    monthly_goal_short,
    monthly_goal_long,
    role,
    tier,
    has_unlimited_free
  )
  VALUES (
    NEW.id,
    user_business_name,
    '',
    '',
    0,
    0,
    'user',
    'free',
    false
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Error creating profile: %', SQLERRM;
END;
$$;
