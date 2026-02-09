-- Allow learners to delete their own requests (to leave a session)
create policy "Learners can delete their own requests"
  on public.requests for delete
  using ( auth.uid() = learner_id );
