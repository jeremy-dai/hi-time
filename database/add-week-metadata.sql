-- Migration: Add starting_hour and theme columns to weeks table
-- Date: 2025-12-25
-- Description: Add metadata fields to weeks table to support custom starting hours and week themes

-- Add starting_hour column (default 8 for 8am)
ALTER TABLE weeks
ADD COLUMN IF NOT EXISTS starting_hour integer DEFAULT 8;

-- Add theme/slogan column
ALTER TABLE weeks
ADD COLUMN IF NOT EXISTS theme text;

-- Add comment for documentation
COMMENT ON COLUMN weeks.starting_hour IS 'Starting hour of the day for time tracking (e.g., 7, 8, 9). Default is 8 for 8am.';
COMMENT ON COLUMN weeks.theme IS 'Theme or title for this week (optional)';
