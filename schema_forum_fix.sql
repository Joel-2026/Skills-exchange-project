-- Ensure RLS is enabled
alter table public.posts enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Users can create posts." on public.posts;
drop policy if exists "Users can create posts" on public.posts;
drop policy if exists "Public posts are viewable by everyone." on public.posts;

-- Re-create policies
create policy "Public posts are viewable by everyone." 
on public.posts for select 
using (true);

create policy "Users can create posts" 
on public.posts for insert 
with check (auth.uid() = user_id);

create policy "Users can update own posts" 
on public.posts for update 
using (auth.uid() = user_id);

create policy "Users can delete own posts" 
on public.posts for delete 
using (auth.uid() = user_id);

-- Explicitly grant permissions to authenticated users (Critical step)
grant select, insert, update, delete on public.posts to authenticated;
grant select on public.posts to anon;
