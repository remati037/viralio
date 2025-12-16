-- Fix the handle_new_user function to include role and tier fields
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

