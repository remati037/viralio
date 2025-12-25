-- Make business_name required (NOT NULL constraint)
-- First, update any existing NULL or empty business_name values
UPDATE profiles 
SET business_name = 'User ' || SUBSTRING(id::text, 1, 8)
WHERE business_name IS NULL OR business_name = '';

-- Add NOT NULL constraint
ALTER TABLE profiles 
ALTER COLUMN business_name SET NOT NULL;

-- Add a check constraint to ensure business_name is not empty
ALTER TABLE profiles 
ADD CONSTRAINT business_name_not_empty 
CHECK (LENGTH(TRIM(business_name)) > 0);

-- Update the trigger function to use business_name from metadata if available
-- The function will use metadata, otherwise fallback to a generated name
-- The frontend will update it immediately after signup if not in metadata
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
    'free'
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Error creating profile: %', SQLERRM;
END;
$$;

