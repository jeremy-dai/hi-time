-- Row Level Security (RLS) Setup for Hi-Time Tracker
-- This file sets up database security policies to ensure users can only access their own data

-- Enable RLS on the weeks table
ALTER TABLE weeks ENABLE ROW LEVEL SECURITY;

-- Enable RLS on the user_settings table
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policy for weeks table
-- Users can only access weeks where user_id matches their authenticated user ID
CREATE POLICY "Users can only access their own weeks"
ON weeks
FOR ALL
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Policy for user_settings table
-- Users can only access settings where user_id matches their authenticated user ID
CREATE POLICY "Users can only access their own settings"
ON user_settings
FOR ALL
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Note: auth.uid() is a Supabase function that extracts the user ID
-- from the JWT token in the Authorization header.
-- It returns NULL if no valid token is present, which means unauthenticated
-- users cannot access any rows.
