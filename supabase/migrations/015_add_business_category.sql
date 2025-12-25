-- Add business_category field to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS business_category TEXT;

-- Add index for business_category for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_business_category ON profiles(business_category);

