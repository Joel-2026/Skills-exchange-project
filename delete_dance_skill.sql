-- 1. Get the ID of the skill to delete
-- We'll use a temporary table or CTE to hold the ID to avoid repeating the lookup
do $$
declare
  target_skill_id uuid;
begin
  select id into target_skill_id 
  from public.skills 
  where title ilike 'dance' 
  and provider_id in (select id from public.profiles where full_name ilike '%akshay%')
  limit 1;

  if target_skill_id is not null then
    -- 2. Delete dependencies first
    
    -- Delete requests
    delete from public.requests where skill_id = target_skill_id;
    
    -- Delete saved_skills
    delete from public.saved_skills where skill_id = target_skill_id;

    -- Delete reviews (if any)
    delete from public.reviews where skill_id = target_skill_id;
    
    -- Delete group_sessions (if any)
    delete from public.group_sessions where skill_id = target_skill_id;

    -- 3. Delete the skill itself
    delete from public.skills where id = target_skill_id;
    
    raise notice 'Deleted skill % and its dependencies.', target_skill_id;
  else
    raise notice 'Skill not found.';
  end if;
end $$;
