-- Create a new public bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

-- Policy: Anyone can view avatars
create policy "Public Access Avatars"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Policy: Authenticated users can upload avatars
create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

-- Policy: Users can update their own avatars
create policy "Users can update own avatars"
  on storage.objects for update
  using ( bucket_id = 'avatars' and auth.uid() = owner );

-- Policy: Users can delete their own avatars
create policy "Users can delete own avatars"
  on storage.objects for delete
  using ( bucket_id = 'avatars' and auth.uid() = owner );
