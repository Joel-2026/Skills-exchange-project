-- Allow anyone to view requests for group sessions (to see filled slots/participants)
create policy "Anyone can view requests for group sessions"
  on public.requests for select
  using ( group_session_id is not null );
