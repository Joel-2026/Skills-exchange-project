-- 1. Alter profiles table to add verification columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_video_url text;

-- 2. Create storage bucket for verifications if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('verifications', 'verifications', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage policies for the 'verifications' bucket
-- Allow authenticated users to insert videos
CREATE POLICY "Users can upload their own verification videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'verifications' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow anyone to view verification videos
CREATE POLICY "Anyone can view verification videos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'verifications');

-- 4. OPTIONAL BUT RECOMMENDED: Automatically verify existing users who have already completed onboarding
UPDATE public.profiles SET is_verified = true WHERE onboarding_completed = true;
