# Manual Fix for Skill Deletion (Updated)

You encountered an error because **Certificates** were also linked to your skills, preventing deletion.

Please run this **updated** script to fix all links (Requests, Sessions, and Certificates).

## Steps

1.  **Log in to Supabase**: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2.  **Select Project**: Open your project.
3.  **Go to SQL Editor**: Click the SQL icon in the sidebar.
4.  **New Query**: Create a new query.
5.  **Paste & Run**:

```sql
-- Fix Cascading Deletes & Permissions (V2 - Includes Certificates)

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
```

6.  **Refresh App**: Reload your application and try deleting the skill again. It should work now.
