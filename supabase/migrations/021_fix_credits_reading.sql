-- Fix: Ensure we always read the current credits_used value before incrementing
-- This version explicitly reads the current state first, then updates
CREATE OR REPLACE FUNCTION increment_ai_credits(p_user_id UUID, p_credits INTEGER DEFAULT 1)
RETURNS JSON AS $$
DECLARE
  credit_record ai_credits;
  current_month INTEGER;
  current_year INTEGER;
  credits_remaining INTEGER;
  max_credits INTEGER := 500;
  next_month_date TIMESTAMP WITH TIME ZONE;
  current_credits_used INTEGER;
BEGIN
  current_month := EXTRACT(MONTH FROM NOW())::INTEGER;
  current_year := EXTRACT(YEAR FROM NOW())::INTEGER;
  next_month_date := DATE_TRUNC('month', NOW()) + INTERVAL '1 month';

  -- Ensure the record exists (create if it doesn't)
  INSERT INTO ai_credits (user_id, credits_used, month, year, reset_at)
  VALUES (p_user_id, 0, current_month, current_year, next_month_date)
  ON CONFLICT (user_id, month, year) DO NOTHING;

  -- CRITICAL: Read the CURRENT value from database with row lock (prevents race conditions)
  -- FOR UPDATE locks the row so other transactions wait
  SELECT * INTO credit_record
  FROM ai_credits
  WHERE user_id = p_user_id
    AND month = current_month
    AND year = current_year
  FOR UPDATE;

  -- If somehow record doesn't exist (shouldn't happen), create it
  IF NOT FOUND THEN
    INSERT INTO ai_credits (user_id, credits_used, month, year, reset_at)
    VALUES (p_user_id, 0, current_month, current_year, next_month_date)
    RETURNING * INTO credit_record;
  END IF;

  -- Check if month changed - if so, reset credits
  IF EXTRACT(MONTH FROM credit_record.reset_at) != current_month OR
     EXTRACT(YEAR FROM credit_record.reset_at) != current_year THEN
    credit_record.credits_used := 0;
    credit_record.reset_at := next_month_date;
  END IF;

  -- Get the current credits_used value
  current_credits_used := credit_record.credits_used;

  -- Check if we would exceed the limit
  IF current_credits_used + p_credits > max_credits THEN
    credits_remaining := max_credits - current_credits_used;
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient credits',
      'credits_used', current_credits_used,
      'credits_remaining', GREATEST(0, credits_remaining),
      'max_credits', max_credits,
      'reset_at', credit_record.reset_at
    );
  END IF;

  -- Calculate new value
  current_credits_used := current_credits_used + p_credits;

  -- Update with the new value (using the ID to ensure we update the right record)
  UPDATE ai_credits
  SET credits_used = current_credits_used,
      reset_at = credit_record.reset_at
  WHERE id = credit_record.id
  RETURNING * INTO credit_record;

  -- Calculate remaining
  credits_remaining := max_credits - credit_record.credits_used;

  RETURN json_build_object(
    'success', true,
    'credits_used', credit_record.credits_used,
    'credits_remaining', credits_remaining,
    'max_credits', max_credits,
    'reset_at', credit_record.reset_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

