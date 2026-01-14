-- VowArc Violation Protocol Schema
-- Ticket 016: Contract Violation Protocol (MVP)
-- Idempotent: Safe to re-run

-- ============================================
-- EXTEND USERS TABLE: Add 'paused' phase
-- ============================================
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_current_phase_check;
ALTER TABLE users ADD CONSTRAINT users_current_phase_check
  CHECK (current_phase IN ('day0', 'trial', 'paid', 'completed', 'terminated', 'paused'));

-- ============================================
-- VIOLATION_LOGS TABLE
-- Records all detected violations and their resolution
-- ============================================
CREATE TABLE IF NOT EXISTS violation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('commitment_miss', 'absence', 'false_report')),
  severity INTEGER DEFAULT 1 CHECK (severity IN (1, 2, 3)), -- 1=Warning, 2=Renegotiation, 3=Termination
  week_number INTEGER, -- YYYYWW format (e.g., 202603 = 2026 Week 3) for year boundary handling
  detected_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  resolution VARCHAR(50) CHECK (resolution IN ('warning_accepted', 'renegotiated', 'terminated', 'continued', 'dismissed')),
  user_response TEXT, -- User's explanation
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_violation_logs_user ON violation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_violation_logs_type ON violation_logs(type);
CREATE INDEX IF NOT EXISTS idx_violation_logs_severity ON violation_logs(severity);
CREATE INDEX IF NOT EXISTS idx_violation_logs_detected ON violation_logs(detected_at DESC);

-- ============================================
-- TERMINATION_RECORDS TABLE
-- Records termination offers and final choices
-- ============================================
CREATE TABLE IF NOT EXISTS termination_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  reason VARCHAR(100) NOT NULL,
  initiated_by VARCHAR(20) NOT NULL CHECK (initiated_by IN ('system', 'user', 'coach', 'manual')),
  final_choice VARCHAR(50) CHECK (final_choice IN ('pause', 'redesign', 'terminate', 'pending')),
  refund_amount INTEGER,
  evidence_summary JSONB, -- { checkin_days, if_then_triggers, key_insights }
  notification_method VARCHAR(50) CHECK (notification_method IN ('auto_ui', 'manual_email', 'dashboard')),
  notified_at TIMESTAMP,
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_termination_records_user ON termination_records(user_id);
CREATE INDEX IF NOT EXISTS idx_termination_records_choice ON termination_records(final_choice);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE violation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE termination_records ENABLE ROW LEVEL SECURITY;

-- Violation logs policies
DROP POLICY IF EXISTS "Users can view own violation_logs" ON violation_logs;
DROP POLICY IF EXISTS "Users can update own violation_logs" ON violation_logs;
DROP POLICY IF EXISTS "Service role can manage violation_logs" ON violation_logs;

CREATE POLICY "Users can view own violation_logs"
  ON violation_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own violation logs (for resolving warnings)
-- WITH CHECK prevents user_id modification
CREATE POLICY "Users can update own violation_logs"
  ON violation_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage violation_logs"
  ON violation_logs FOR ALL
  USING (auth.role() = 'service_role');

-- Termination records policies
DROP POLICY IF EXISTS "Users can view own termination_records" ON termination_records;
DROP POLICY IF EXISTS "Users can update own termination_records" ON termination_records;
DROP POLICY IF EXISTS "Service role can manage termination_records" ON termination_records;

CREATE POLICY "Users can view own termination_records"
  ON termination_records FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own termination records (for responding to offers)
-- WITH CHECK prevents user_id modification
CREATE POLICY "Users can update own termination_records"
  ON termination_records FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage termination_records"
  ON termination_records FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- HELPER FUNCTION: Calculate Previous Year-Week
-- Handles year boundary correctly (202601 - 1 = 202552)
-- NOTE: Must be defined before get_user_violation_status (dependency)
-- ============================================
CREATE OR REPLACE FUNCTION calculate_previous_year_week(p_year_week INTEGER, p_offset INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_year INTEGER;
  v_week INTEGER;
  v_result_year INTEGER;
  v_result_week INTEGER;
  v_weeks_in_prev_year INTEGER;
BEGIN
  v_year := p_year_week / 100;
  v_week := p_year_week % 100;

  v_result_week := v_week - p_offset;
  v_result_year := v_year;

  -- Handle year boundary
  WHILE v_result_week < 1 LOOP
    v_result_year := v_result_year - 1;
    -- Get weeks in previous year (52 or 53)
    v_weeks_in_prev_year := EXTRACT(WEEK FROM make_date(v_result_year, 12, 28))::INTEGER;
    v_result_week := v_result_week + v_weeks_in_prev_year;
  END LOOP;

  RETURN v_result_year * 100 + v_result_week;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- HELPER FUNCTION: Get User Violation Status
-- Returns current violation state for a user
-- Fixed: Year-week (YYYYWW) format for proper year boundary handling
-- Example: 202603 = 2026 Week 3, 202552 → 202601 correctly consecutive
-- ============================================
CREATE OR REPLACE FUNCTION get_user_violation_status(p_user_id UUID)
RETURNS TABLE (
  consecutive_violation_weeks INTEGER,
  latest_violation_type VARCHAR(50),
  latest_severity INTEGER,
  has_unresolved_warning BOOLEAN,
  has_unresolved_renegotiation BOOLEAN
) AS $$
DECLARE
  v_current_year_week INTEGER;
  v_consecutive INTEGER := 0;
  v_week_record RECORD;
  v_expected_year_week INTEGER;
BEGIN
  -- Security check
  IF p_user_id != auth.uid() AND auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Get current ISO year-week as YYYYWW format (e.g., 202603)
  v_current_year_week := (EXTRACT(ISOYEAR FROM CURRENT_DATE) * 100 + EXTRACT(WEEK FROM CURRENT_DATE))::INTEGER;

  -- Count consecutive weeks by iterating from current week backwards
  -- Uses detected_at to calculate year-week for each violation
  -- Only count countable violations (unresolved OR resolved but not dismissed/continued)
  FOR v_week_record IN
    SELECT DISTINCT
      (EXTRACT(ISOYEAR FROM detected_at) * 100 + EXTRACT(WEEK FROM detected_at))::INTEGER as year_week
    FROM violation_logs
    WHERE user_id = p_user_id
      AND (resolved_at IS NULL OR resolution NOT IN ('dismissed', 'continued'))
    ORDER BY year_week DESC
  LOOP
    -- Calculate expected year-week for consecutive check
    -- Need to handle year boundary: 202601 - 1 should be 202552 (or 202553)
    v_expected_year_week := calculate_previous_year_week(v_current_year_week, v_consecutive);

    IF v_week_record.year_week = v_expected_year_week THEN
      v_consecutive := v_consecutive + 1;
    ELSE
      -- Not consecutive, stop counting
      EXIT;
    END IF;
  END LOOP;

  RETURN QUERY
  WITH recent_violations AS (
    SELECT
      vl.type,
      vl.severity,
      vl.resolved_at
    FROM violation_logs vl
    WHERE vl.user_id = p_user_id
    ORDER BY vl.detected_at DESC
    LIMIT 1
  )
  SELECT
    v_consecutive as consecutive_violation_weeks,
    (SELECT rv.type FROM recent_violations rv) as latest_violation_type,
    (SELECT rv.severity FROM recent_violations rv) as latest_severity,
    EXISTS (
      SELECT 1 FROM violation_logs vl
      WHERE vl.user_id = p_user_id
        AND vl.severity = 1
        AND vl.resolved_at IS NULL
    ) as has_unresolved_warning,
    EXISTS (
      SELECT 1 FROM violation_logs vl
      WHERE vl.user_id = p_user_id
        AND vl.severity = 2
        AND vl.resolved_at IS NULL
    ) as has_unresolved_renegotiation;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Generate Evidence Summary
-- Creates summary for termination records
-- Fixed: Added auth.uid() security check
-- ============================================
CREATE OR REPLACE FUNCTION generate_evidence_summary(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_checkin_days INTEGER;
  v_if_then_triggers INTEGER;
  v_evidence_count INTEGER;
BEGIN
  -- Security check: Only allow users to query their own data or service role
  IF p_user_id != auth.uid() AND auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: Cannot query other users data';
  END IF;

  -- Count checkin days
  SELECT COUNT(DISTINCT date) INTO v_checkin_days
  FROM checkins
  WHERE user_id = p_user_id;

  -- Count if-then triggers
  SELECT COUNT(*) INTO v_if_then_triggers
  FROM checkins
  WHERE user_id = p_user_id AND if_then_triggered = true;

  -- Count evidences
  SELECT COUNT(*) INTO v_evidence_count
  FROM evidences
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'checkin_days', COALESCE(v_checkin_days, 0),
    'if_then_triggers', COALESCE(v_if_then_triggers, 0),
    'evidence_count', COALESCE(v_evidence_count, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
