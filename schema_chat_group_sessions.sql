-- Add group_session_id to messages table
alter table public.messages 
add column group_session_id uuid references public.group_sessions(id) on delete cascade;

-- Make request_id nullable (since group messages might not have a request_id, or we might use a dummy one, but better to be nullable)
alter table public.messages 
alter column request_id drop not null;

-- Update RLS policies for messages to include group sessions

-- Drop existing policies to recreate them with OR conditions
drop policy "Users can view messages for their requests" on public.messages;
drop policy "Users can insert messages for their requests" on public.messages;

create policy "Users can view messages for their requests or groups"
on public.messages for select
using (
  -- One-on-one (Request based)
  (request_id is not null and exists (
    select 1 from public.requests r
    left join public.skills s on r.skill_id = s.id
    where r.id = messages.request_id
    and (r.learner_id = auth.uid() or s.provider_id = auth.uid())
  ))
  OR
  -- Group Session based
  (group_session_id is not null and (
    -- User is the provider of the group session
    exists (
      select 1 from public.group_sessions gs
      where gs.id = messages.group_session_id
      and gs.provider_id = auth.uid()
    )
    OR
    -- User is a participant (accepted request)
    exists (
      select 1 from public.requests r
      where r.group_session_id = messages.group_session_id
      and r.learner_id = auth.uid()
      and r.status = 'accepted'
    )
  ))
);

create policy "Users can insert messages for their requests or groups"
on public.messages for insert
with check (
  -- One-on-one (Request based)
  (request_id is not null and exists (
    select 1 from public.requests r
    left join public.skills s on r.skill_id = s.id
    where r.id = messages.request_id
    and (r.learner_id = auth.uid() or s.provider_id = auth.uid())
  ))
  OR
  -- Group Session based
  (group_session_id is not null and (
    -- User is the provider of the group session
    exists (
      select 1 from public.group_sessions gs
      where gs.id = messages.group_session_id
      and gs.provider_id = auth.uid()
    )
    OR
    -- User is a participant (accepted request)
    exists (
      select 1 from public.requests r
      where r.group_session_id = messages.group_session_id
      and r.learner_id = auth.uid()
      and r.status = 'accepted'
    )
  ))
);
