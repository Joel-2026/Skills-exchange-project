-- Fix Cascading Deletes for Skills (V2)
-- This script updates foreign key constraints to automatically delete 
-- all related data (requests, sessions, certificates) when a skill is deleted.

-- 1. Drop existing constraints (names might vary, so we try to catch common ones)
ALTER TABLE public.requests
DROP CONSTRAINT IF EXISTS requests_skill_id_fkey;

ALTER TABLE public.group_sessions
DROP CONSTRAINT IF EXISTS group_sessions_skill_id_fkey;

ALTER TABLE public.certificates
DROP CONSTRAINT IF EXISTS certificates_skill_id_fkey;

-- 2. Add new constraints with ON DELETE CASCADE
ALTER TABLE public.requests
ADD CONSTRAINT requests_skill_id_fkey
FOREIGN KEY (skill_id)
REFERENCES public.skills(id)
ON DELETE CASCADE;

ALTER TABLE public.group_sessions
ADD CONSTRAINT group_sessions_skill_id_fkey
FOREIGN KEY (skill_id)
REFERENCES public.skills(id)
ON DELETE CASCADE;

ALTER TABLE public.certificates
ADD CONSTRAINT certificates_skill_id_fkey
FOREIGN KEY (skill_id)
REFERENCES public.skills(id)
ON DELETE CASCADE;

-- 3. Ensure Delete Permission Exists (RLS)
DROP POLICY IF EXISTS "Users can delete their own skills" ON public.skills;
CREATE POLICY "Users can delete their own skills"
ON public.skills FOR DELETE
USING ( auth.uid() = provider_id );
