-- Debug query to check current credits state
-- Run this in Supabase SQL Editor to see what's in the database
SELECT 
  user_id,
  credits_used,
  month,
  year,
  reset_at,
  created_at,
  updated_at
FROM ai_credits
ORDER BY updated_at DESC
LIMIT 10;


