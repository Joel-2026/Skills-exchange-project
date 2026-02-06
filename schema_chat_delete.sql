-- Add columns for deletion support
alter table public.messages 
add column if not exists is_deleted boolean default false,
add column if not exists deleted_by uuid[] default '{}';

-- Allow Users to UPDATE messages (for deletion)
create policy "Users can update their own messages or messages in their requests"
on public.messages for update
using (
  exists (
    select 1 from public.requests r
    left join public.skills s on r.skill_id = s.id
    where r.id = messages.request_id
    and (r.learner_id = auth.uid() or s.provider_id = auth.uid())
  )
);
