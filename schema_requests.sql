-- Create Requests Table if not exists
create table if not exists public.requests (
  id uuid default uuid_generate_v4() primary key,
  skill_id uuid references public.skills(id) not null,
  learner_id uuid references public.profiles(id) not null,
  provider_id uuid references public.profiles(id) not null,
  status text check (status in ('pending', 'accepted', 'declined', 'completed', 'cancelled')) default 'pending',
  scheduled_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Requests
alter table public.requests enable row level security;

create policy "Users can see their own requests (sent or received)"
  on requests for select
  using ( auth.uid() = learner_id or auth.uid() = provider_id );

create policy "Learners can insert requests"
  on requests for insert
  with check ( auth.uid() = learner_id );

create policy "Participants can update requests"
  on requests for update
  using ( auth.uid() = learner_id or auth.uid() = provider_id );
