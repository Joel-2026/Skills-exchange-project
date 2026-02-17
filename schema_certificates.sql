-- Create certificates table
create table public.certificates (
  id uuid default gen_random_uuid() primary key,
  learner_id uuid references public.profiles(id) not null,
  provider_id uuid references public.profiles(id) not null,
  skill_id uuid references public.skills(id) not null,
  learner_name text not null, -- Stores the custom name at time of issue
  issued_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.certificates enable row level security;

-- Everyone can view certificates (public verification)
create policy "Certificates are viewable by everyone"
  on public.certificates for select
  using (true);

-- Only providers can insert certificates (via application logic usually, but good to have)
create policy "Providers can insert certificates"
  on public.certificates for insert
  with check (auth.uid() = provider_id);
