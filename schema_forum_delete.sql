-- Ensure RLS is enabled
alter table public.posts enable row level security;

-- Create policy if it doesn't exist (using do block or just drop/create)
drop policy if exists "Users can delete own posts" on public.posts;
create policy "Users can delete own posts" 
  on public.posts for delete 
  using (auth.uid() = user_id);

-- Explicitly grant delete permission
grant delete on public.posts to authenticated;
