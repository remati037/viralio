-- Migration to remove Free tier and convert all Free users to Pro

-- Step 1: Convert all Free tier users to Pro
UPDATE profiles 
SET tier = 'pro'
WHERE tier = 'free';

-- Step 2: Update tier constraint to remove 'free' option
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_tier_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_tier_check 
CHECK (tier IN ('pro', 'admin'));

-- Step 3: Update template_visibility to remove 'free' references
-- First, delete all free tier visibility entries
DELETE FROM template_visibility WHERE tier = 'free';

-- Update constraint
ALTER TABLE template_visibility 
DROP CONSTRAINT IF EXISTS template_visibility_tier_check;

ALTER TABLE template_visibility 
ADD CONSTRAINT template_visibility_tier_check 
CHECK (tier IN ('pro', 'admin'));

-- Step 4: Update default tier in trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_business_name TEXT;
BEGIN
  -- Try to get business_name from user metadata
  user_business_name := COALESCE(
    NEW.raw_user_meta_data->>'business_name',
    'User ' || SUBSTRING(NEW.id::text, 1, 8)
  );
  
  -- Ensure it's not empty
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
    tier
  )
  VALUES (
    NEW.id,
    user_business_name,
    '',
    '',
    0,
    0,
    'user',
    'pro'  -- Changed from 'free' to 'pro'
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Error creating profile: %', SQLERRM;
END;
$$;

