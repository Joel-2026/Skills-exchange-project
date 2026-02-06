-- Add onboarding_completed column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;

-- Update existing users to have it FALSE (or TRUE if you want to skip for them, but safer FALSE)
-- Actually, let's assume FALSE for now.
