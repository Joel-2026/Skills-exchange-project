-- Create posts table
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  title text not null,
  body text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create comments table
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.posts enable row level security;
alter table public.comments enable row level security;

-- Policies for posts
create policy "Public posts are viewable by everyone." on public.posts for select using (true);
create policy "Users can create posts." on public.posts for insert with check (auth.uid() = user_id);

-- Policies for comments
create policy "Public comments are viewable by everyone." on public.comments for select using (true);
create policy "Users can create comments." on public.comments for insert with check (auth.uid() = user_id);
