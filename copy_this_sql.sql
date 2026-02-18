-- COPY THE CONTENTS OF THIS FILE BELOW
-- 1. Drop old constraints
ALTER TABLE public.requests
DROP CONSTRAINT IF EXISTS requests_skill_id_fkey;

ALTER TABLE public.group_sessions
DROP CONSTRAINT IF EXISTS group_sessions_skill_id_fkey;

ALTER TABLE public.certificates
DROP CONSTRAINT IF EXISTS certificates_skill_id_fkey;

-- 2. Add Cascade Constraints
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

-- 3. Ensure Delete Permission Exists
DROP POLICY IF EXISTS "Users can delete their own skills" ON public.skills;
CREATE POLICY "Users can delete their own skills"
ON public.skills FOR DELETE
USING ( auth.uid() = provider_id );
