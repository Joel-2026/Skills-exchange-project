-- Create post_likes table for upvotes
create table public.post_likes (
  user_id uuid references public.profiles(id) not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, post_id)
);

-- Enable RLS
alter table public.post_likes enable row level security;

-- Policies
create policy "Public post_likes are viewable by everyone." 
  on public.post_likes for select using (true);

create policy "Users can toggle their own like." 
  on public.post_likes for insert 
  with check (auth.uid() = user_id);

create policy "Users can remove their own like." 
  on public.post_likes for delete 
  using (auth.uid() = user_id);
