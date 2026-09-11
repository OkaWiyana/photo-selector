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
-- Gallery records are created server-side or via public form.

-- ==========================================================
-- Table: gallery_selections (Client Selection Persistence)
-- ==========================================================

CREATE TABLE IF NOT EXISTS gallery_selections (
  id TEXT PRIMARY KEY,
  gallery_id TEXT NOT NULL,
  selected_filenames JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE gallery_selections ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to gallery_selections"
  ON gallery_selections FOR SELECT
  USING (true);

-- Allow public insert and update access for client proofing submissions
CREATE POLICY "Allow public insert access to gallery_selections"
  ON gallery_selections FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to gallery_selections"
  ON gallery_selections FOR UPDATE
  USING (true);
