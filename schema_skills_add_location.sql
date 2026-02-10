-- Add location column to skills table for offline meetups
ALTER TABLE skills 
ADD COLUMN location TEXT;

-- Optional: Add a comment
COMMENT ON COLUMN skills.location IS 'Physical meeting location for offline skills';
