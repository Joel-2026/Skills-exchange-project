-- Add interests column to profiles
alter table public.profiles
add column if not exists interests text[];
