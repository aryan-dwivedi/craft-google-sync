-- Add unique constraint to watch_channel_id for webhook lookups
-- This ensures each watch channel maps to exactly one calendar

ALTER TABLE public.calendars
ADD CONSTRAINT calendars_watch_channel_id_key UNIQUE (watch_channel_id);
