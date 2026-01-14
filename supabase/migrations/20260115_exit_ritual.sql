-- VowArc Exit Ritual Schema
-- Ticket 012: Exit Ritual (Basic)
-- Idempotent: Safe to re-run on existing environments

-- ============================================
-- EXIT_RITUALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS exit_rituals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  trigger VARCHAR(50) NOT NULL CHECK (trigger IN ('day21_stop', 'cancellation')),
  day_count INTEGER NOT NULL,
  checkin_count INTEGER NOT NULL,
  evidence_count INTEGER NOT NULL,
  potential_statement TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exit_rituals_user ON exit_rituals(user_id);
CREATE INDEX IF NOT EXISTS idx_exit_rituals_trigger ON exit_rituals(trigger);

-- ============================================
-- ADD EXIT_RITUAL_ID TO EXIT_REVIEWS (idempotent)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exit_reviews' AND column_name = 'exit_ritual_id'
  ) THEN
    ALTER TABLE exit_reviews
    ADD COLUMN exit_ritual_id UUID REFERENCES exit_rituals(id);
  END IF;
END $$;

-- ============================================
-- ADD 'cancellation' TO EXIT_REVIEWS CHECK CONSTRAINT
-- ============================================
-- Drop existing constraint and recreate with new value
ALTER TABLE exit_reviews DROP CONSTRAINT IF EXISTS exit_reviews_exit_type_check;
ALTER TABLE exit_reviews
ADD CONSTRAINT exit_reviews_exit_type_check
CHECK (exit_type IN ('graduation', 'trial_stop', 'refund', 'cancellation'));

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE exit_rituals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (for idempotency)
DROP POLICY IF EXISTS "Users can view own exit_rituals" ON exit_rituals;
DROP POLICY IF EXISTS "Users can insert own exit_rituals" ON exit_rituals;
DROP POLICY IF EXISTS "Service role can manage exit_rituals" ON exit_rituals;

-- Users can view their own exit rituals
CREATE POLICY "Users can view own exit_rituals"
  ON exit_rituals FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own exit rituals
CREATE POLICY "Users can insert own exit_rituals"
  ON exit_rituals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can manage all exit rituals
CREATE POLICY "Service role can manage exit_rituals"
  ON exit_rituals FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- HELPER FUNCTION: Get Exit Ritual Summary
-- SECURITY: Validates that p_user_id matches auth.uid()
-- ============================================
CREATE OR REPLACE FUNCTION get_exit_ritual_summary(p_user_id UUID)
RETURNS TABLE (
  day_count INTEGER,
  checkin_count BIGINT,
  evidence_count BIGINT,
  meaning_statement TEXT,
  vow_content TEXT
) AS $$
BEGIN
  -- Security: Only allow users to query their own data
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: Cannot query other users data';
  END IF;

  RETURN QUERY
  SELECT
    -- Day count (from trial_start_date, fallback to created_at)
    COALESCE(
      EXTRACT(DAY FROM NOW() - COALESCE(u.trial_start_date, u.created_at))::INTEGER + 1,
      0
    ) AS day_count,
    -- Checkin count
    (SELECT COUNT(*) FROM checkins WHERE user_id = p_user_id) AS checkin_count,
    -- Evidence count (from evidences table)
    (SELECT COUNT(*) FROM evidences WHERE user_id = p_user_id) AS evidence_count,
    -- Meaning statement (is_current, not is_active)
    ms.content AS meaning_statement,
    -- Vow content (is_current, not is_active)
    v.content AS vow_content
  FROM users u
  LEFT JOIN meaning_statements ms ON ms.user_id = u.id AND ms.is_current = true
  LEFT JOIN vows v ON v.user_id = u.id AND v.is_current = true
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
