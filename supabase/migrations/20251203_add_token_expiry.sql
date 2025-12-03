-- Add token_expiry column to track when access tokens expire
-- This enables automatic token refresh before expiration

ALTER TABLE public.calendars
ADD COLUMN IF NOT EXISTS token_expiry timestamp with time zone;

-- Add comment for documentation
COMMENT ON COLUMN public.calendars.token_expiry IS 'Timestamp when the Google OAuth access token expires';
