-- Fix missing INSERT policy for profiles that was dropped in migration 005
-- This is needed for the signup trigger to work

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;

-- Create policy for users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create policy to allow system/triggers to insert profiles
-- This is needed because the handle_new_user() trigger runs with SECURITY DEFINER
-- but RLS still applies, so we need a policy that allows the trigger to insert
CREATE POLICY "System can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true); -- Allow trigger to insert profiles

