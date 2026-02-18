-- Clear all demo data, histories, and reset user stats
-- This script gives the system a "Fresh Start".

-- 1. Truncate all content tables
TRUNCATE TABLE 
    notifications,
    messages,
    reviews,
    requests,
    group_sessions,
    user_achievements,
    certificates,
    comments,
    post_likes,
    posts,
    skills,
    saved_skills
    RESTART IDENTITY CASCADE;

-- 2. Reset Profile Stats and Info (Optional but requested for "New Start")
-- Resets credits to 5, clears bio and interests.
UPDATE profiles
SET 
    credits = 5,
    bio = NULL,
    interests = NULL,
    updated_at = NOW();

-- Note: We do NOT delete the profiles themselves to allow users to keep their login.
