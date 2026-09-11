-- ==========================================================
-- Photo Selector: Supabase Database Schema
-- Table: galleries
-- ==========================================================

-- Create galleries table for persistent proofing configuration
CREATE TABLE IF NOT EXISTS galleries (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  drive_folder_id TEXT NOT NULL,
  max_selections INTEGER NOT NULL DEFAULT 10,
  whatsapp_number TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;

-- Allow public read access to galleries by public ID
CREATE POLICY "Allow public read access to galleries"
  ON galleries FOR SELECT
  USING (true);

-- Note on Security Architecture:
-- No public INSERT policy is created.
-- Gallery records are created strictly server-side using the SUPABASE_SERVICE_ROLE_KEY
-- which bypasses RLS safely on the server.

-- ==========================================================
-- Table: gallery_selections (Client Selection Persistence)
-- ==========================================================

CREATE TABLE IF NOT EXISTS gallery_selections (
  id TEXT PRIMARY KEY,
  gallery_id TEXT NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  selected_filenames JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE gallery_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to gallery_selections"
  ON gallery_selections FOR SELECT
  USING (true);

