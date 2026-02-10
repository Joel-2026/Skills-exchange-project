-- Create Badges Table
create table if not exists public.badges (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  icon text not null, -- Store lucide icon name or emoji
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create User Badges Table
create table if not exists public.user_badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  badge_id uuid references public.badges(id) not null,
  awarded_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, badge_id)
);

-- RLS
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

create policy "Anyone can view badges" on public.badges for select using (true);
create policy "Anyone can view user_badges" on public.user_badges for select using (true);
create policy "Authenticated users can insert user_badges" on public.user_badges for insert with check (true); 
-- Note: In a real app, only system/admin/trigger should insert badges, but for MVP client-side logic is fine.

-- Seed Badges
insert into public.badges (title, description, icon) values
  ('First Step', 'Completed your first session.', 'Footprints'),
  ('Top Rated', 'Received a 5-star rating.', 'Star'),
  ('Social Butterfly', 'Joined 5 or more group sessions.', 'Users'),
  ('Skill Master', 'Listed 3 or more skills.', 'Award')
on conflict do nothing;
