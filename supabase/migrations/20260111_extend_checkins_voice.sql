-- ============================================
-- Extend Checkins for Voice Support (Ticket 004)
-- ============================================

-- Add content column (unified field for transcript or text input)
-- This complements the existing 'transcript' column
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS content TEXT;

-- Add updated_at column for change tracking
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update type constraint to include 'text' option
-- Note: 'morning' and 'evening' are legacy values, keep for backward compatibility
ALTER TABLE checkins DROP CONSTRAINT IF EXISTS checkins_type_check;
ALTER TABLE checkins ADD CONSTRAINT checkins_type_check
  CHECK (type IN ('morning', 'evening', 'voice', 'text'));

-- ============================================
-- Trigger: Auto-update updated_at timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_checkins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_checkins_updated_at ON checkins;
CREATE TRIGGER trigger_checkins_updated_at
  BEFORE UPDATE ON checkins
  FOR EACH ROW
  EXECUTE FUNCTION update_checkins_updated_at();

-- ============================================
-- Comments
-- ============================================

COMMENT ON COLUMN checkins.content IS
  'Unified content field: user text input or transcribed audio. Complements transcript for backward compatibility.';

COMMENT ON COLUMN checkins.updated_at IS
  'Timestamp of last update, auto-maintained by trigger';
