-- Fix: Resolve "duplicate key value violates unique constraint ai_credits_user_id_month_year_key"
-- Use INSERT ... ON CONFLICT DO NOTHING exclusively - no fallback INSERTs that can race.
-- This handles concurrent requests that try to create the same month/year record.
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

  -- Ensure record exists - ON CONFLICT DO NOTHING handles duplicates (no exception, no race)
  INSERT INTO ai_credits (user_id, credits_used, month, year, reset_at)
  VALUES (p_user_id, 0, current_month, current_year, next_month_date)
  ON CONFLICT (user_id, month, year) DO NOTHING;

  -- Atomic UPDATE: reset if month changed, otherwise increment; enforce limit in WHERE
  UPDATE ai_credits
  SET
    credits_used = CASE
      WHEN EXTRACT(MONTH FROM reset_at) != current_month OR
           EXTRACT(YEAR FROM reset_at) != current_year
      THEN p_credits
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
    AND (
      EXTRACT(MONTH FROM reset_at) != current_month OR
      EXTRACT(YEAR FROM reset_at) != current_year OR
      (credits_used + p_credits <= max_credits)
    )
  RETURNING * INTO credit_record;

  IF NOT FOUND THEN
    -- Either no row (shouldn't happen after INSERT) or limit exceeded
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
      RETURN json_build_object(
        'success', false,
        'error', 'Credit record not found',
        'credits_used', 0,
        'credits_remaining', 0,
        'max_credits', max_credits
      );
    END IF;
  END IF;

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
