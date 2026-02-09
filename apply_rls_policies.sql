-- Allow learners to delete their own requests (to leave a session)
create policy "Learners can delete their own requests"
  on public.requests for delete
  using ( auth.uid() = learner_id );

-- Allow providers to delete their own group sessions
create policy "Providers can delete their group sessions"
  on public.group_sessions for delete
  using ( auth.uid() = provider_id );
