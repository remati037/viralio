-- Function to check if a user exists by email
-- This function uses SECURITY DEFINER to access auth.users table
CREATE OR REPLACE FUNCTION public.check_user_exists_by_email(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE email = user_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
