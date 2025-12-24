-- Add has_unlimited_free field to profiles table
-- This field indicates if user has unlimited free PRO tier subscription (granted by admin)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS has_unlimited_free BOOLEAN DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_has_unlimited_free ON profiles(has_unlimited_free);

-- Add RLS policy to allow admins to update has_unlimited_free
-- (Already covered by existing "Admins can update any profile" policy)

