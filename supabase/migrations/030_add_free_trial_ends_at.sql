-- Admin-set free trial end date for users. When user goes through Stripe checkout,
-- this date is used as trial_end so they pay $0 until this date, then auto-charge.
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS free_trial_ends_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.free_trial_ends_at IS 'Admin-set trial end date. Used when creating Stripe checkout to set trial_end. User pays 0 until this date, then monthly charge.';
