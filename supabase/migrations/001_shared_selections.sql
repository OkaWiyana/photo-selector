-- ==========================================================
-- Migration 001: Shared Live Photo Selections
-- Replaces single JSONB blob approach with individual rows
-- per selected photo for Realtime sync + race-condition safety.
-- ==========================================================

-- 1. Create shared_selections table
CREATE TABLE IF NOT EXISTS shared_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id TEXT NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  photo_id TEXT NOT NULL,
  photo_name TEXT NOT NULL,
  selected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: one photo can only be selected once per gallery
CREATE UNIQUE INDEX IF NOT EXISTS uq_shared_selections_gallery_photo
  ON shared_selections (gallery_id, photo_id);

-- Index for fast lookups by gallery
CREATE INDEX IF NOT EXISTS idx_shared_selections_gallery_id
  ON shared_selections (gallery_id);

-- 2. Enable Row Level Security
ALTER TABLE shared_selections ENABLE ROW LEVEL SECURITY;

-- RLS: Allow public read access scoped to valid galleries
CREATE POLICY "shared_selections_select"
  ON shared_selections FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM galleries WHERE galleries.id = shared_selections.gallery_id)
  );

-- RLS: Allow public insert only for valid galleries (actual limit enforced by function)
CREATE POLICY "shared_selections_insert"
  ON shared_selections FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM galleries WHERE galleries.id = shared_selections.gallery_id)
  );

-- RLS: Allow public delete only for valid galleries
CREATE POLICY "shared_selections_delete"
  ON shared_selections FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM galleries WHERE galleries.id = shared_selections.gallery_id)
  );

-- 3. Server-side function to atomically toggle a photo selection
-- Returns JSON with { action: 'selected' | 'deselected' | 'limit_reached', count: number }
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
  -- Get the max_selections for this gallery (also validates gallery exists)
  SELECT max_selections INTO v_max
    FROM galleries
    WHERE id = p_gallery_id;

  IF v_max IS NULL THEN
    RAISE EXCEPTION 'Gallery not found: %', p_gallery_id;
  END IF;

  -- Check if photo is already selected
  SELECT id INTO v_existing
    FROM shared_selections
    WHERE gallery_id = p_gallery_id AND photo_id = p_photo_id
    FOR UPDATE;  -- Lock the row to prevent concurrent modification

  IF v_existing IS NOT NULL THEN
    -- Deselect: remove the row
    DELETE FROM shared_selections WHERE id = v_existing;
    
    SELECT COUNT(*) INTO v_current
      FROM shared_selections
      WHERE gallery_id = p_gallery_id;

    v_result := jsonb_build_object(
      'action', 'deselected',
      'count', v_current,
      'max', v_max,
      'photo_id', p_photo_id
    );
  ELSE
    -- Lock the gallery row to serialize concurrent selections
    PERFORM 1 FROM galleries WHERE id = p_gallery_id FOR UPDATE;

    -- Count current selections
    SELECT COUNT(*) INTO v_current
      FROM shared_selections
      WHERE gallery_id = p_gallery_id;

    IF v_current >= v_max THEN
      v_result := jsonb_build_object(
        'action', 'limit_reached',
        'count', v_current,
        'max', v_max,
        'photo_id', p_photo_id
      );
    ELSE
      -- Select: insert new row
      INSERT INTO shared_selections (gallery_id, photo_id, photo_name)
        VALUES (p_gallery_id, p_photo_id, p_photo_name);

      v_result := jsonb_build_object(
        'action', 'selected',
        'count', v_current + 1,
        'max', v_max,
        'photo_id', p_photo_id
      );
    END IF;
  END IF;

  RETURN v_result;
END;
$$;

-- 4. Enable Realtime for shared_selections table
-- This must also be done in Supabase Dashboard:
--   Database > Replication > Enable for shared_selections table
ALTER PUBLICATION supabase_realtime ADD TABLE shared_selections;
