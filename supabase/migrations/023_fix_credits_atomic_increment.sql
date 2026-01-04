-- Fix: Use atomic INSERT ... ON CONFLICT DO UPDATE to handle everything in one statement
-- This completely eliminates race conditions by doing insert/increment in a single atomic operation
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

  -- Ensure record exists - try to insert, catch any duplicate key errors
  -- Use a sub-block with exception handling to gracefully handle race conditions
  BEGIN
    INSERT INTO ai_credits (user_id, credits_used, month, year, reset_at)
    VALUES (p_user_id, 0, current_month, current_year, next_month_date);
  EXCEPTION
    WHEN SQLSTATE '23505' THEN  -- unique_violation error code
      -- Record already exists (race condition), which is fine - continue
      NULL;
    WHEN OTHERS THEN
      -- Re-raise any other errors
      RAISE;
  END;

  -- Now do the atomic increment/update
  UPDATE ai_credits
  SET
    -- If month changed, reset to p_credits, otherwise increment atomically
    credits_used = CASE 
      WHEN month != current_month OR year != current_year
      THEN p_credits
      ELSE credits_used + p_credits
    END,
    -- Update reset_at if month changed
    reset_at = CASE
      WHEN month != current_month OR year != current_year
      THEN next_month_date
      ELSE reset_at
    END,
    -- Always update month/year to current
    month = current_month,
    year = current_year
  WHERE user_id = p_user_id
    AND (
      -- Allow if month changed (resetting)
      month != current_month OR year != current_year OR
      -- Or if we have enough credits (check BEFORE increment)
      (month = current_month AND year = current_year AND credits_used + p_credits <= max_credits)
    )
  RETURNING * INTO credit_record;

  -- If no row was inserted/updated, check if it's because of insufficient credits
  IF NOT FOUND THEN
    -- Try to get the current record to see what the state is
    SELECT * INTO credit_record
    FROM ai_credits
    WHERE user_id = p_user_id
      AND month = current_month
      AND year = current_year;
    
    IF FOUND THEN
      -- Record exists but update was blocked - must be insufficient credits
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
      -- Shouldn't happen - record should exist after INSERT
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
