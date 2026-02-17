-- Add ON DELETE CASCADE to foreign keys linking to skills table
-- This ensures that when a skill is deleted, all associated data is automatically removed.

-- 1. Requests Table
alter table public.requests
drop constraint if exists requests_skill_id_fkey;

alter table public.requests
add constraint requests_skill_id_fkey
foreign key (skill_id)
references public.skills(id)
on delete cascade;

-- 2. Group Sessions Table
alter table public.group_sessions
drop constraint if exists group_sessions_skill_id_fkey;

alter table public.group_sessions
add constraint group_sessions_skill_id_fkey
foreign key (skill_id)
references public.skills(id)
on delete cascade;

-- 3. Saved Skills Table (Reinforcing)
alter table public.saved_skills
drop constraint if exists saved_skills_skill_id_fkey;

alter table public.saved_skills
add constraint saved_skills_skill_id_fkey
foreign key (skill_id)
references public.skills(id)
on delete cascade;
