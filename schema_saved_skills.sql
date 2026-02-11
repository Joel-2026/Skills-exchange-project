-- Create saved_skills table
create table public.saved_skills (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  skill_id uuid references public.skills(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, skill_id)
);

-- Enable RLS
alter table public.saved_skills enable row level security;

-- Policies
create policy "Users can view their own saved skills." 
  on public.saved_skills for select 
  using (auth.uid() = user_id);

create policy "Users can add saved skills." 
  on public.saved_skills for insert 
  with check (auth.uid() = user_id);

create policy "Users can remove their own saved skills." 
  on public.saved_skills for delete 
  using (auth.uid() = user_id);
