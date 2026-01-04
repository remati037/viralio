-- Fix increment_ai_credits to be atomic and always read latest value
-- This version uses a single atomic UPDATE with INSERT ... ON CONFLICT
CREATE OR REPLACE FUNCTION increment_ai_credits(p_user_id UUID, p_credits INTEGER DEFAULT 1)
RETURNS JSON AS $$
DECLARE
  credit_record ai_credits;
  current_month INTEGER;
  current_year INTEGER;
  credits_remaining INTEGER;
  max_credits INTEGER := 500;
  next_month_date TIMESTAMP WITH TIME ZONE;
BEGIN
  current_month := EXTRACT(MONTH FROM NOW())::INTEGER;
  current_year := EXTRACT(YEAR FROM NOW())::INTEGER;
  next_month_date := DATE_TRUNC('month', NOW()) + INTERVAL '1 month';

  -- First, ensure the record exists (create if it doesn't)
  INSERT INTO ai_credits (user_id, credits_used, month, year, reset_at)
  VALUES (p_user_id, 0, current_month, current_year, next_month_date)
  ON CONFLICT (user_id, month, year) DO NOTHING;

  -- Now do an atomic UPDATE that:
  -- 1. Resets credits if month changed
  -- 2. Increments credits atomically
  -- 3. Checks the limit in the WHERE clause
  UPDATE ai_credits
  SET 
    credits_used = CASE 
      -- Reset if month changed
      WHEN EXTRACT(MONTH FROM reset_at) != current_month OR
           EXTRACT(YEAR FROM reset_at) != current_year
      THEN p_credits  -- Start fresh with the new credits
      -- Otherwise increment
      ELSE credits_used + p_credits
    END,
    reset_at = CASE
      WHEN EXTRACT(MONTH FROM reset_at) != current_month OR
           EXTRACT(YEAR FROM reset_at) != current_year
      THEN next_month_date
      ELSE reset_at
    END
  WHERE user_id = p_user_id
    AND month = current_month
    AND year = current_year
    -- Only update if we won't exceed the limit
    AND (
      -- Case 1: Month changed, so we're resetting (always allow)
      EXTRACT(MONTH FROM reset_at) != current_month OR
      EXTRACT(YEAR FROM reset_at) != current_year OR
      -- Case 2: Same month, check if we have enough credits
      (credits_used + p_credits <= max_credits)
    )
  RETURNING * INTO credit_record;

  -- If no row was updated, it means we exceeded the limit
  IF NOT FOUND THEN
    -- Get current record to return accurate values
    SELECT * INTO credit_record
    FROM ai_credits
    WHERE user_id = p_user_id
      AND month = current_month
      AND year = current_year;
    
    IF FOUND THEN
      credits_remaining := max_credits - credit_record.credits_used;
      RETURN json_build_object(
        'success', false,
        'error', 'Insufficient credits',
        'credits_used', credit_record.credits_used,
        'credits_remaining', GREATEST(0, credits_remaining),
        'max_credits', max_credits,
        'reset_at', credit_record.reset_at
      );
    ELSE
      -- This shouldn't happen, but handle it
      RETURN json_build_object(
        'success', false,
        'error', 'Credit record not found',
        'credits_used', 0,
        'credits_remaining', 0,
        'max_credits', max_credits
      );
    END IF;
  END IF;

  -- Success - calculate remaining credits
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

