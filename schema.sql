-- Create Profiles Table
create table public.profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  credits int default 3,
  
  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Create Skills Table
create table public.skills (
  id uuid default uuid_generate_v4() primary key,
  provider_id uuid references public.profiles(id) not null,
  title text not null,
  description text,
  category text,
  mode text check (mode in ('online', 'offline', 'any')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Skills
alter table public.skills enable row level security;

create policy "Skills are viewable by everyone"
  on skills for select
  using ( true );

create policy "Users can insert their own skills"
  on skills for insert
  with check ( auth.uid() = provider_id );

-- Auto-create profile on signup (Trigger)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, credits)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 3);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
