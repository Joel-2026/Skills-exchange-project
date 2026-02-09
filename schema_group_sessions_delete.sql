-- Allow providers to delete their own group sessions
create policy "Providers can delete their group sessions"
  on public.group_sessions for delete
  using ( auth.uid() = provider_id );
