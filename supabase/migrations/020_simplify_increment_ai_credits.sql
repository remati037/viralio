-- Simplified and more reliable version of increment_ai_credits
-- Uses a single atomic UPDATE that increments directly in the database
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

  -- Ensure the record exists (create if it doesn't)
  INSERT INTO ai_credits (user_id, credits_used, month, year, reset_at)
  VALUES (p_user_id, 0, current_month, current_year, next_month_date)
  ON CONFLICT (user_id, month, year) DO NOTHING;

  -- Single atomic UPDATE that:
  -- 1. Resets credits if month changed
  -- 2. Increments credits_used directly in the database (no race conditions)
  -- 3. Only updates if we won't exceed the limit
  UPDATE ai_credits
  SET 
    credits_used = CASE 
      -- If month changed, reset to p_credits (start fresh)
      WHEN EXTRACT(MONTH FROM reset_at) != current_month OR
           EXTRACT(YEAR FROM reset_at) != current_year
      THEN p_credits
      -- Otherwise, increment atomically using database value
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
    -- Only update if we have enough credits (check in WHERE clause)
    AND (
      -- Allow if month changed (resetting)
      EXTRACT(MONTH FROM reset_at) != current_month OR
      EXTRACT(YEAR FROM reset_at) != current_year OR
      -- Or if we have enough credits
      (credits_used + p_credits <= max_credits)
    )
  RETURNING * INTO credit_record;

  -- If UPDATE didn't affect any rows, user exceeded limit
  IF NOT FOUND THEN
    -- Get current state to return accurate error
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
      -- Shouldn't happen, but handle gracefully
      RETURN json_build_object(
        'success', false,
        'error', 'Credit record not found',
        'credits_used', 0,
        'credits_remaining', 0,
        'max_credits', max_credits
      );
    END IF;
  END IF;

  -- Success - calculate remaining
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

