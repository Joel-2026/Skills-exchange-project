-- Create referrals table
create table public.referrals (
  id uuid default gen_random_uuid() primary key,
  referrer_id uuid references public.profiles(id) not null,
  referee_id uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(referee_id) -- One referral per new user
);

-- Enable RLS
alter table public.referrals enable row level security;
create policy "Users can view their own referrals." on public.referrals for select using (auth.uid() = referrer_id);

-- Update handle_new_user function to process referrals
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  referrer_id_val uuid;
begin
  -- Check if referral code (user ID) exists in metadata
  if new.raw_user_meta_data->>'referral_code' is not null then
    begin
        referrer_id_val := (new.raw_user_meta_data->>'referral_code')::uuid;
        
        -- Verify referrer exists
        if exists (select 1 from public.profiles where id = referrer_id_val) then
            -- Insert referral record
            insert into public.referrals (referrer_id, referee_id)
            values (referrer_id_val, new.id);
            
            -- Award 3 credits to referrer
            update public.profiles
            set credits = credits + 3
            where id = referrer_id_val;
            
            -- Optional: Award credits to new user too? (Currently sticking to default 3)
        end if;
    exception when others then
        -- Ignore invalid UUIDs or errors to prevent blocking signup
        null;
    end;
  end if;

  -- Create Main Profile
  insert into public.profiles (id, full_name, avatar_url, credits)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 3);
  
  return new;
end;
$$;
