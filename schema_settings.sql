-- Add settings columns to profiles table
alter table public.profiles 
add column if not exists email_notifications boolean default true,
add column if not exists profile_visibility text default 'public' check (profile_visibility in ('public', 'private'));
