-- Allow Providers to delete requests associated with their skills/profile
create policy "Providers can delete requests"
  on public.requests for delete
  using ( auth.uid() = provider_id );

-- Allow Providers to delete their own group sessions
create policy "Providers can delete their group sessions"
  on public.group_sessions for delete
  using ( auth.uid() = provider_id );
