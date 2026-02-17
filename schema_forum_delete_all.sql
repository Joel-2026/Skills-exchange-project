-- Allow authenticated users to delete ANY post (Admin/Global Delete)

-- Ensure RLS is enabled
alter table public.posts enable row level security;

-- Drop the restrictive "own posts" policy if it conflicts or is redundant
drop policy if exists "Users can delete own posts" on public.posts;

-- Create/Replace with a permissive policy
drop policy if exists "Authenticated users can delete any post" on public.posts;
create policy "Authenticated users can delete any post" 
  on public.posts for delete 
  using (auth.role() = 'authenticated');

-- Explicitly grant delete permission
grant delete on public.posts to authenticated;
