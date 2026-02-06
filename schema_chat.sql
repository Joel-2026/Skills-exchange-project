-- Create Messages Table
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  request_id uuid not null references public.requests(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  content text,
  media_url text
);

-- Enable Realtime
alter publication supabase_realtime add table public.messages;

-- RLS Policies for Messages
alter table public.messages enable row level security;

create policy "Users can view messages for their requests"
on public.messages for select
using (
  exists (
    select 1 from public.requests r
    left join public.skills s on r.skill_id = s.id
    where r.id = messages.request_id
    and (r.learner_id = auth.uid() or s.provider_id = auth.uid())
  )
);

create policy "Users can insert messages for their requests"
on public.messages for insert
with check (
  exists (
    select 1 from public.requests r
    left join public.skills s on r.skill_id = s.id
    where r.id = messages.request_id
    and (r.learner_id = auth.uid() or s.provider_id = auth.uid())
  )
);

-- STORAGE (Attempt to create bucket via SQL) --
insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', true)
on conflict (id) do nothing;

create policy "Anything goes for chat attachments (MVP)"
on storage.objects for all
using ( bucket_id = 'chat-attachments' )
with check ( bucket_id = 'chat-attachments' );
