-- 1. Create the Reports table for flagged content
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reported_item_id UUID NOT NULL,
    reported_item_type TEXT NOT NULL, -- 'post', 'comment', 'user'
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'resolved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Turn on RLS for the reports table
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated user to insert a report
CREATE POLICY "Users can create reports" ON public.reports
FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

-- Allow only admins to manage the reports
CREATE POLICY "Admins can view and update reports" ON public.reports
FOR ALL
USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);


-- 2. Fast statistics aggregator for the Admin Dashboard
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_users INT;
    total_skills INT;
    total_posts INT;
    total_sessions INT;
BEGIN
    -- Verify admin status securely
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    -- Fast un-paginated counts
    SELECT COUNT(*) INTO total_users FROM public.profiles;
    SELECT COUNT(*) INTO total_skills FROM public.skills;
    SELECT COUNT(*) INTO total_posts FROM public.posts;
    SELECT COUNT(*) INTO total_sessions FROM public.group_sessions;

    RETURN json_build_object(
        'totalUsers', total_users,
        'totalSkills', total_skills,
        'totalPosts', total_posts,
        'totalSessions', total_sessions
    );
END;
$$;


-- 3. Securely bypass RLS to let admins execute global deletes on Forum Posts
CREATE OR REPLACE FUNCTION admin_delete_post(target_post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    -- Forced deletion of the post from the DB
    DELETE FROM public.posts WHERE id = target_post_id;
END;
$$;
