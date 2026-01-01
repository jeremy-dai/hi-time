-- Migration: Add year_memories table for daily memories
-- Date: 2025-12-28
-- Description: Create table to store user's daily memories with mood and tags

-- Create year_memories table
CREATE TABLE IF NOT EXISTS year_memories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  year integer NOT NULL,
  memories jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Ensure one record per user per year
  UNIQUE (user_id, year)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_year_memories_user_id ON year_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_year_memories_user_year ON year_memories(user_id, year);

-- Add comments for documentation
COMMENT ON TABLE year_memories IS 'Stores daily memories for each user by year';
COMMENT ON COLUMN year_memories.user_id IS 'Supabase auth user ID (auth.uid())';
COMMENT ON COLUMN year_memories.year IS 'Year for these memories (e.g., 2024, 2025)';
COMMENT ON COLUMN year_memories.memories IS 'JSON object mapping dates (YYYY-MM-DD) to memory objects with fields: memory, tags, mood, createdAt, updatedAt';

-- Enable RLS
ALTER TABLE year_memories ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own memories
CREATE POLICY "Users can only access their own memories"
ON year_memories
FOR ALL
USING ((select auth.uid())::text = user_id)
WITH CHECK ((select auth.uid())::text = user_id);
