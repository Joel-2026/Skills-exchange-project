-- Create a highly secure function for Admins to update verification status
-- Using SECURITY DEFINER allows it to bypass Row Level Security 
-- but only after it successfully checks that the caller is an admin!

CREATE OR REPLACE FUNCTION admin_update_verification(
    target_user_id UUID, 
    new_status TEXT, 
    new_is_verified BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Double check that the person calling this function is actually an admin
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
    
    -- Perform the update securely!
    UPDATE public.profiles
    SET 
        verification_status = new_status, 
        is_verified = new_is_verified
    WHERE id = target_user_id;

    -- Automatically wipe the video URL if rejected
    IF new_status = 'rejected' THEN
      UPDATE public.profiles 
      SET verification_video_url = NULL 
      WHERE id = target_user_id;
    END IF;

  ELSE
    RAISE EXCEPTION 'Not authorized: Only admins can perform this action';
  END IF;
END;
$$;
