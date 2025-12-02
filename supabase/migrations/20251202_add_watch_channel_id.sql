-- Add watch_channel_id column to calendars table for webhook tracking
ALTER TABLE public.calendars
ADD COLUMN IF NOT EXISTS watch_channel_id text;

-- Create index for faster lookups by channel ID
CREATE INDEX IF NOT EXISTS idx_calendars_watch_channel_id
ON public.calendars(watch_channel_id);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'calendars'
AND column_name = 'watch_channel_id';
