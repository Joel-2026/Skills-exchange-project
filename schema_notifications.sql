-- Create notifications table
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  type text not null, -- 'request_received', 'request_accepted', 'session_completed'
  message text not null,
  link text,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Policies
create policy "Users can view their own notifications." on public.notifications for select using (auth.uid() = user_id);
create policy "Users can insert notifications (for others)." on public.notifications for insert with check (true); -- Allow sending notifications to others
create policy "Users can update their own notifications." on public.notifications for update using (auth.uid() = user_id);
