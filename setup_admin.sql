-- Add the necessary columns for the admin verification logic
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'unsubmitted';

-- Migrate existing verified users to the new approved status
UPDATE public.profiles 
SET verification_status = 'approved' 
WHERE is_verified = true;

-- Ensure unverified users have the proper status
UPDATE public.profiles 
SET verification_status = 'unsubmitted' 
WHERE is_verified = false;
