-- Add proficiency column with check constraint
alter table public.skills
add column if not exists proficiency text check (proficiency in ('Beginner', 'Intermediate', 'Advanced'));
