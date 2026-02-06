-- Create a new public bucket for achievement images
insert into storage.buckets (id, name, public)
values ('achievements', 'achievements', true);

-- Policy: Anyone can view images
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'achievements' );

-- Policy: Users can upload their own images
create policy "Authenticated users can upload"
  on storage.objects for insert
  with check ( bucket_id = 'achievements' and auth.role() = 'authenticated' );

-- Policy: Users can update their own images
create policy "Users can update own images"
  on storage.objects for update
  using ( bucket_id = 'achievements' and auth.uid() = owner );

-- Policy: Users can delete their own images
create policy "Users can delete own images"
  on storage.objects for delete
  using ( bucket_id = 'achievements' and auth.uid() = owner );
