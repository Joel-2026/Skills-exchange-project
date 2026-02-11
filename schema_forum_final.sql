
-- 1. POSTS TABLE FIX
alter table public.posts enable row level security;
drop policy if exists "Users can create posts" on public.posts;
create policy "Users can create posts" on public.posts for insert with check (auth.uid() = user_id);

drop policy if exists "Public posts are viewable by everyone." on public.posts;
create policy "Public posts are viewable by everyone." on public.posts for select using (true);

grant select, insert, update, delete on public.posts to authenticated;
grant select on public.posts to anon;

-- 2. COMMENTS TABLE FIX
alter table public.comments enable row level security;
drop policy if exists "Users can create comments." on public.comments;
create policy "Users can create comments." on public.comments for insert with check (auth.uid() = user_id);

drop policy if exists "Public comments are viewable by everyone." on public.comments;
create policy "Public comments are viewable by everyone." on public.comments for select using (true);

grant select, insert, update, delete on public.comments to authenticated;
grant select on public.comments to anon;

-- 3. LIKES TABLE FIX
alter table public.post_likes enable row level security;
drop policy if exists "Users can toggle their own like." on public.post_likes;
create policy "Users can toggle their own like." on public.post_likes for insert with check (auth.uid() = user_id);

drop policy if exists "Users can remove their own like." on public.post_likes;
create policy "Users can remove their own like." on public.post_likes for delete using (auth.uid() = user_id);

drop policy if exists "Public post_likes are viewable by everyone." on public.post_likes;
create policy "Public post_likes are viewable by everyone." on public.post_likes for select using (true);

grant select, insert, update, delete on public.post_likes to authenticated;
grant select on public.post_likes to anon;
