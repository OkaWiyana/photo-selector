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
  client_whatsapp_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration for existing galleries table:
-- ALTER TABLE galleries ADD COLUMN IF NOT EXISTS client_whatsapp_number TEXT;

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

-- ==========================================================
-- Table: shared_selections (Shared Live Photo Selection)
-- Individual rows per selected photo for Realtime sync.
-- ==========================================================

CREATE TABLE IF NOT EXISTS shared_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id TEXT NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  photo_id TEXT NOT NULL,
  photo_name TEXT NOT NULL,
  selected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_shared_selections_gallery_photo
  ON shared_selections (gallery_id, photo_id);

CREATE INDEX IF NOT EXISTS idx_shared_selections_gallery_id
  ON shared_selections (gallery_id);

ALTER TABLE shared_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shared_selections_select"
  ON shared_selections FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM galleries WHERE galleries.id = shared_selections.gallery_id)
  );

CREATE POLICY "shared_selections_insert"
  ON shared_selections FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM galleries WHERE galleries.id = shared_selections.gallery_id)
  );

CREATE POLICY "shared_selections_delete"
  ON shared_selections FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM galleries WHERE galleries.id = shared_selections.gallery_id)
  );

-- Atomic toggle function with race-condition-safe limit enforcement
CREATE OR REPLACE FUNCTION toggle_photo_selection(
  p_gallery_id TEXT,
  p_photo_id TEXT,
  p_photo_name TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max INTEGER;
  v_current INTEGER;
  v_existing UUID;
  v_result JSONB;
BEGIN
  SELECT max_selections INTO v_max
    FROM galleries WHERE id = p_gallery_id;

  IF v_max IS NULL THEN
    RAISE EXCEPTION 'Gallery not found: %', p_gallery_id;
  END IF;

  SELECT id INTO v_existing
    FROM shared_selections
    WHERE gallery_id = p_gallery_id AND photo_id = p_photo_id
    FOR UPDATE;

  IF v_existing IS NOT NULL THEN
    DELETE FROM shared_selections WHERE id = v_existing;
    SELECT COUNT(*) INTO v_current
      FROM shared_selections WHERE gallery_id = p_gallery_id;
    v_result := jsonb_build_object(
      'action', 'deselected', 'count', v_current,
      'max', v_max, 'photo_id', p_photo_id);
  ELSE
    PERFORM 1 FROM galleries WHERE id = p_gallery_id FOR UPDATE;
    SELECT COUNT(*) INTO v_current
      FROM shared_selections WHERE gallery_id = p_gallery_id;
    IF v_current >= v_max THEN
      v_result := jsonb_build_object(
        'action', 'limit_reached', 'count', v_current,
        'max', v_max, 'photo_id', p_photo_id);
    ELSE
      INSERT INTO shared_selections (gallery_id, photo_id, photo_name)
        VALUES (p_gallery_id, p_photo_id, p_photo_name);
      v_result := jsonb_build_object(
        'action', 'selected', 'count', v_current + 1,
        'max', v_max, 'photo_id', p_photo_id);
    END IF;
  END IF;

  RETURN v_result;
END;
$$;

ALTER PUBLICATION supabase_realtime ADD TABLE shared_selections;
