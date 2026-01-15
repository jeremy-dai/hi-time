-- Hi-Time Database Schema
-- Complete database setup for the Hi-Time application
-- Run this file in your Supabase SQL Editor to create all tables and security policies

-- ============================================================================
-- TABLES
-- ============================================================================

-- Weeks Table
-- Stores weekly time tracking data with metadata
CREATE TABLE IF NOT EXISTS weeks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  year integer NOT NULL,
  week_number integer NOT NULL,
  week_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  starting_hour integer DEFAULT 8,
  theme text,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, year, week_number)
);

CREATE INDEX IF NOT EXISTS idx_weeks_user_year_week ON weeks(user_id, year, week_number);

COMMENT ON TABLE weeks IS 'Stores weekly time tracking data';
COMMENT ON COLUMN weeks.starting_hour IS 'Starting hour of the day for time tracking (e.g., 7, 8, 9). Default is 8 for 8am.';
COMMENT ON COLUMN weeks.theme IS 'Theme or title for this week (optional)';

-- User Settings Table
-- Stores user preferences including subcategories
CREATE TABLE IF NOT EXISTS user_settings (
  user_id text PRIMARY KEY,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE user_settings IS 'Stores user preferences and settings';

-- Year Memories Table
-- Stores daily memories with mood tracking and tags, organized by year
CREATE TABLE IF NOT EXISTS year_memories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  year integer NOT NULL,
  memories jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, year)
);

CREATE INDEX IF NOT EXISTS idx_year_memories_user_id ON year_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_year_memories_user_year ON year_memories(user_id, year);

COMMENT ON TABLE year_memories IS 'Stores daily memories for each user by year';
COMMENT ON COLUMN year_memories.user_id IS 'Supabase auth user ID (auth.uid())';
COMMENT ON COLUMN year_memories.year IS 'Year for these memories (e.g., 2024, 2025)';
COMMENT ON COLUMN year_memories.memories IS 'JSON object mapping dates (YYYY-MM-DD) to memory objects with fields: memory, tags, mood, createdAt, updatedAt';

-- Week Reviews Table
-- Stores weekly reflection entries organized by year and ISO week number
-- Convention: week_number = 0 represents the annual review for that year
CREATE TABLE IF NOT EXISTS week_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  year integer NOT NULL,
  week_number integer NOT NULL,
  review text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, year, week_number),
  CHECK (week_number >= 0 AND week_number <= 53),
  CHECK (year >= 2000 AND year <= 2100)
);

CREATE INDEX IF NOT EXISTS idx_week_reviews_user_id ON week_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_week_reviews_user_year ON week_reviews(user_id, year);
CREATE INDEX IF NOT EXISTS idx_week_reviews_user_year_week ON week_reviews(user_id, year, week_number);

COMMENT ON TABLE week_reviews IS 'Stores weekly review entries. week_number=0 is reserved for annual reviews';

-- Daily Shipping Table
-- Stores daily "what did you ship today" entries with completion tracking
CREATE TABLE IF NOT EXISTS daily_shipping (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  year integer NOT NULL,
  month integer NOT NULL,
  day integer NOT NULL,
  shipped text NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, year, month, day),
  CHECK (month >= 1 AND month <= 12),
  CHECK (day >= 1 AND day <= 31),
  CHECK (year >= 2000 AND year <= 2100)
);

CREATE INDEX IF NOT EXISTS idx_daily_shipping_user_id ON daily_shipping(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_shipping_user_year ON daily_shipping(user_id, year);
CREATE INDEX IF NOT EXISTS idx_daily_shipping_user_date ON daily_shipping(user_id, year, month, day);

COMMENT ON TABLE daily_shipping IS 'Stores daily shipping entries with completion tracking';

-- Quarterly Plans Table
-- Stores quarterly planning data
CREATE TABLE IF NOT EXISTS quarterly_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  plan_id text NOT NULL,
  plan_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, plan_id)
);

CREATE INDEX IF NOT EXISTS idx_quarterly_plans_user_id ON quarterly_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_quarterly_plans_user_plan ON quarterly_plans(user_id, plan_id);

COMMENT ON TABLE quarterly_plans IS 'Stores quarterly planning data (v2)';
COMMENT ON COLUMN quarterly_plans.plan_id IS 'User-facing identifier for the plan, allows multiple plans per user';
COMMENT ON COLUMN quarterly_plans.plan_data IS 'Complete plan JSON including: plan metadata, work_types[], templates{}, cycles[] with type-linked todos/deliverables';

-- Data Snapshots Table
-- Stores historical snapshots of data for version control and recovery
CREATE TABLE IF NOT EXISTS data_snapshots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  entity_type text NOT NULL, -- 'week', 'settings', etc.
  entity_key text NOT NULL, -- e.g., '2024-W01'
  snapshot_type text CHECK (snapshot_type IN ('manual', 'auto', 'restore')),
  description text,
  data jsonb NOT NULL,
  metadata jsonb
);

CREATE INDEX IF NOT EXISTS idx_data_snapshots_user_entity ON data_snapshots(user_id, entity_type, entity_key);
CREATE INDEX IF NOT EXISTS idx_data_snapshots_created_at ON data_snapshots(created_at);

COMMENT ON TABLE data_snapshots IS 'Stores historical snapshots of data for version control/restore';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE year_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE week_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_shipping ENABLE ROW LEVEL SECURITY;
ALTER TABLE quarterly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data

CREATE POLICY "Users can only access their own weeks"
ON weeks
FOR ALL
USING ((select auth.uid())::text = user_id)
WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can only access their own settings"
ON user_settings
FOR ALL
USING ((select auth.uid())::text = user_id)
WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can only access their own memories"
ON year_memories
FOR ALL
USING ((select auth.uid())::text = user_id)
WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can only access their own week reviews"
ON week_reviews
FOR ALL
USING ((select auth.uid())::text = user_id)
WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can only access their own daily shipping"
ON daily_shipping
FOR ALL
USING ((select auth.uid())::text = user_id)
WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can only access their own quarterly plans"
ON quarterly_plans
FOR ALL
USING ((select auth.uid())::text = user_id)
WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can only access their own snapshots"
ON data_snapshots
FOR ALL
USING ((select auth.uid())::text = user_id)
WITH CHECK ((select auth.uid())::text = user_id);

-- Note: auth.uid() is a Supabase function that extracts the user ID
-- from the JWT token in the Authorization header.
-- It returns NULL if no valid token is present, which means unauthenticated
-- users cannot access any rows.
