-- Learning Documents Migration
-- Stores markdown learning documents with tagging and organization

-- Create learning_documents table
CREATE TABLE IF NOT EXISTS learning_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  description text,
  tags text[] DEFAULT '{}',
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_learning_documents_user_id ON learning_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_documents_user_position ON learning_documents(user_id, position);
CREATE INDEX IF NOT EXISTS idx_learning_documents_tags ON learning_documents USING GIN(tags);

-- Add comments for documentation
COMMENT ON TABLE learning_documents IS 'Stores markdown learning documents with tagging and organization';
COMMENT ON COLUMN learning_documents.title IS 'Document title (required)';
COMMENT ON COLUMN learning_documents.content IS 'Markdown content of the document';
COMMENT ON COLUMN learning_documents.description IS 'Optional short description/summary';
COMMENT ON COLUMN learning_documents.tags IS 'Array of tags for categorization and filtering';
COMMENT ON COLUMN learning_documents.position IS 'Sort order position (lower = earlier)';

-- Enable Row Level Security
ALTER TABLE learning_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own learning documents
CREATE POLICY "Users can only access their own learning documents"
ON learning_documents
FOR ALL
USING ((select auth.uid())::text = user_id)
WITH CHECK ((select auth.uid())::text = user_id);
