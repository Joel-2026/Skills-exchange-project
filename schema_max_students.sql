-- Add max_students column to skills table
alter table public.skills 
add column max_students int default 1 check (max_students >= 1 and max_students <= 10);

-- Update existing skills to have default value
update public.skills set max_students = 1 where max_students is null;
