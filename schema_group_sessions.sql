-- Create group_sessions table
create table public.group_sessions (
  id uuid default gen_random_uuid() primary key,
  skill_id uuid references public.skills(id) not null,
  provider_id uuid references public.profiles(id) not null,
  scheduled_at timestamp with time zone,
  status text check (status in ('scheduled', 'in_progress', 'completed', 'cancelled')) default 'scheduled',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add group_session_id to requests table
alter table public.requests 
add column group_session_id uuid references public.group_sessions(id) on delete set null;

-- Enable RLS
alter table public.group_sessions enable row level security;

-- Policies for group_sessions
-- Allow all authenticated users to view scheduled group sessions (for browsing/joining)
create policy "Anyone can view scheduled group sessions"
  on group_sessions for select
  using (status = 'scheduled' or auth.uid() = provider_id or exists (
    select 1 from requests 
    where requests.group_session_id = group_sessions.id 
    and requests.learner_id = auth.uid()
  ));

create policy "Providers can create group sessions"
  on group_sessions for insert
  with check (auth.uid() = provider_id);

create policy "Providers can update their group sessions"
  on group_sessions for update
  using (auth.uid() = provider_id);
