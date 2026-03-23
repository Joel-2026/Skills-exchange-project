-- Safely add the email column if it doesn't already exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Automatically fetch all existing users' emails from the secure auth.users table 
-- and copy them into the public profiles table so the Admin Dashboard can see them
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;
