-- VowArc Exit Ritual Schema
-- Ticket 012: Exit Ritual (Basic)

-- ============================================
-- EXIT_RITUALS TABLE
-- ============================================
CREATE TABLE exit_rituals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  trigger VARCHAR(50) NOT NULL CHECK (trigger IN ('day21_stop', 'cancellation')),
  day_count INTEGER NOT NULL,
  checkin_count INTEGER NOT NULL,
  evidence_count INTEGER NOT NULL,
  potential_statement TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_exit_rituals_user ON exit_rituals(user_id);
CREATE INDEX idx_exit_rituals_trigger ON exit_rituals(trigger);

-- ============================================
-- ADD EXIT_RITUAL_ID TO EXIT_REVIEWS
-- ============================================
ALTER TABLE exit_reviews
ADD COLUMN exit_ritual_id UUID REFERENCES exit_rituals(id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE exit_rituals ENABLE ROW LEVEL SECURITY;

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
  RETURN QUERY
  SELECT
    -- Day count (from first checkin to now)
    COALESCE(
      EXTRACT(DAY FROM NOW() - MIN(c.created_at))::INTEGER + 1,
      0
    ) AS day_count,
    -- Checkin count
    COUNT(DISTINCT c.id) AS checkin_count,
    -- Evidence count (placeholder - will be updated when evidence table exists)
    0::BIGINT AS evidence_count,
    -- Meaning statement
    ms.content AS meaning_statement,
    -- Vow content
    v.content AS vow_content
  FROM users u
  LEFT JOIN checkins c ON c.user_id = u.id
  LEFT JOIN meaning_statements ms ON ms.user_id = u.id AND ms.is_active = true
  LEFT JOIN vows v ON v.user_id = u.id AND v.is_active = true
  WHERE u.id = p_user_id
  GROUP BY ms.content, v.content;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
