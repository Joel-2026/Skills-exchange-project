-- Create Reviews Table
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  reviewer_id uuid references public.profiles(id) not null,
  target_id uuid references public.profiles(id) not null,
  session_id uuid, -- Optional: link to a request_id or group_session_id
  rating integer check (rating >= 1 and rating <= 5) not null,
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.reviews enable row level security;

create policy "Anyone can view reviews"
  on public.reviews for select
  using ( true );

create policy "Authenticated users can insert reviews"
  on public.reviews for insert
  with check ( auth.uid() = reviewer_id );

-- Optional: Prevent users from reviewing themselves (basic check)
-- (This is better handled in app logic or trigger, but simple policy helps)
-- with check ( auth.uid() = reviewer_id AND auth.uid() != target_id );
