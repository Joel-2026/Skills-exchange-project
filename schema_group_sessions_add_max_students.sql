-- Add max_students column to group_sessions table
alter table public.group_sessions 
add column max_students int;
