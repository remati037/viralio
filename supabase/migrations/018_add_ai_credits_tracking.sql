-- Create AI credits tracking table
CREATE TABLE IF NOT EXISTS ai_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_used INTEGER NOT NULL DEFAULT 0,
  month INTEGER NOT NULL, -- 1-12
  year INTEGER NOT NULL,
  reset_at TIMESTAMP WITH TIME ZONE NOT NULL, -- When credits reset for next month
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id, month, year)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_credits_user_month_year ON ai_credits(user_id, year, month DESC);
CREATE INDEX IF NOT EXISTS idx_ai_credits_user_id ON ai_credits(user_id);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_ai_credits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_ai_credits_updated_at
  BEFORE UPDATE ON ai_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_credits_updated_at();

-- Function to get or create current month's credit record
CREATE OR REPLACE FUNCTION get_or_create_ai_credits(p_user_id UUID)
RETURNS ai_credits AS $$
DECLARE
  current_month INTEGER;
  current_year INTEGER;
  next_month_date TIMESTAMP WITH TIME ZONE;
  credit_record ai_credits;
BEGIN
  current_month := EXTRACT(MONTH FROM NOW())::INTEGER;
  current_year := EXTRACT(YEAR FROM NOW())::INTEGER;
  next_month_date := DATE_TRUNC('month', NOW()) + INTERVAL '1 month';

  -- Try to get existing record
  SELECT * INTO credit_record
  FROM ai_credits
  WHERE user_id = p_user_id
    AND month = current_month
    AND year = current_year;

  -- If not found, create new record
  IF NOT FOUND THEN
    INSERT INTO ai_credits (user_id, credits_used, month, year, reset_at)
    VALUES (p_user_id, 0, current_month, current_year, next_month_date)
    RETURNING * INTO credit_record;
  END IF;

  RETURN credit_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment credits (with limit check)
CREATE OR REPLACE FUNCTION increment_ai_credits(p_user_id UUID, p_credits INTEGER DEFAULT 1)
RETURNS JSON AS $$
DECLARE
  credit_record ai_credits;
  current_month INTEGER;
  current_year INTEGER;
  credits_remaining INTEGER;
  max_credits INTEGER := 500;
BEGIN
  current_month := EXTRACT(MONTH FROM NOW())::INTEGER;
  current_year := EXTRACT(YEAR FROM NOW())::INTEGER;

  -- Get or create credit record
  SELECT * INTO credit_record
  FROM get_or_create_ai_credits(p_user_id);

  -- Check if we've already reset (new month started)
  IF EXTRACT(MONTH FROM credit_record.reset_at) != current_month OR
     EXTRACT(YEAR FROM credit_record.reset_at) != current_year THEN
    -- Reset credits for new month
    UPDATE ai_credits
    SET credits_used = 0,
        month = current_month,
        year = current_year,
        reset_at = DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
    WHERE id = credit_record.id
    RETURNING * INTO credit_record;
  END IF;

  -- Check if user has enough credits
  IF credit_record.credits_used + p_credits > max_credits THEN
    credits_remaining := max_credits - credit_record.credits_used;
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient credits',
      'credits_used', credit_record.credits_used,
      'credits_remaining', GREATEST(0, credits_remaining),
      'max_credits', max_credits
    );
  END IF;

  -- Increment credits
  UPDATE ai_credits
  SET credits_used = credits_used + p_credits
  WHERE id = credit_record.id
  RETURNING * INTO credit_record;

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

-- RLS Policies
ALTER TABLE ai_credits ENABLE ROW LEVEL SECURITY;

-- Users can view their own credits
CREATE POLICY "Users can view their own AI credits"
  ON ai_credits
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert/update (for API routes)
CREATE POLICY "Service role can manage AI credits"
  ON ai_credits
  FOR ALL
  USING (true)
  WITH CHECK (true);

