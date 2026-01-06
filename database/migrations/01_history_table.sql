
-- Create data_snapshots table for version history
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

ALTER TABLE data_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own snapshots"
ON data_snapshots
FOR ALL
USING ((select auth.uid())::text = user_id)
WITH CHECK ((select auth.uid())::text = user_id);

COMMENT ON TABLE data_snapshots IS 'Stores historical snapshots of data for version control/restore';
