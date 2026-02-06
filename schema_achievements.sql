-- Create Achievements Table
create table if not exists public.achievements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  title text not null,
  description text,
  image_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Achievements
alter table public.achievements enable row level security;

create policy "Achievements are viewable by everyone"
  on achievements for select
  using ( true );

create policy "Users can insert their own achievements"
  on achievements for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete their own achievements"
  on achievements for delete
  using ( auth.uid() = user_id );
