-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Calendars Table
create table public.calendars (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  google_calendar_id text not null,
  summary text, -- Calendar name
  is_enabled boolean default false,
  watch_channel_id text, -- The UUID channel ID sent to Google Calendar API
  watch_resource_id text,
  watch_expiration timestamp with time zone,
  access_token text,
  refresh_token text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, google_calendar_id)
);

-- Event Mappings Table
create table public.event_mappings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  google_calendar_id text, -- Which calendar this event belongs to
  google_event_id text not null,
  craft_block_id text, -- Can be null if we just track it but haven't synced yet, or if using Tasks API this might be the Task ID
  event_date text, -- Store as text to handle both date and dateTime
  last_synced_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  unique(user_id, google_event_id)
);

-- Sync Logs Table
create table public.sync_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  status text not null, -- 'success', 'error', 'partial'
  details jsonb,
  created_at timestamp with time zone default now()
);

-- User Settings Table
create table public.user_settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  craft_api_url text default 'https://connect.craft.do/links/91anr3mDrIB/api/v1',
  craft_api_token text,
  onboarding_completed boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- RLS Policies
alter table public.calendars enable row level security;
alter table public.event_mappings enable row level security;
alter table public.sync_logs enable row level security;
alter table public.user_settings enable row level security;

create policy "Users can view their own calendars"
  on public.calendars for select
  using (auth.uid() = user_id);

create policy "Users can insert their own calendars"
  on public.calendars for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own calendars"
  on public.calendars for update
  using (auth.uid() = user_id);

create policy "Users can delete their own calendars"
  on public.calendars for delete
  using (auth.uid() = user_id);

-- (Repeat similar policies for event_mappings and sync_logs)
create policy "Users can view their own mappings"
  on public.event_mappings for select
  using (auth.uid() = user_id);
  
create policy "Users can insert their own mappings"
  on public.event_mappings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own mappings"
  on public.event_mappings for update
  using (auth.uid() = user_id);

create policy "Users can delete their own mappings"
  on public.event_mappings for delete
  using (auth.uid() = user_id);

create policy "Users can view their own logs"
  on public.sync_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own logs"
  on public.sync_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own settings"
  on public.user_settings for update
  using (auth.uid() = user_id);
