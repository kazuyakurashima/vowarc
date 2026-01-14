-- VowArc Payment System Schema
-- Based on Ticket 008 specification
-- Non-Renewing Subscription model for 9-week coaching package

-- ============================================
-- PURCHASES TABLE
-- ============================================
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,

  -- RevenueCat identifiers
  revenuecat_app_user_id VARCHAR(255) NOT NULL,
  revenuecat_transaction_id VARCHAR(255) UNIQUE,

  -- Product info
  product_id VARCHAR(100) NOT NULL, -- 'vowark_coaching_9weeks'
  store VARCHAR(20) NOT NULL CHECK (store IN ('app_store', 'play_store')),

  -- Status
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'expired', 'refunded')) DEFAULT 'active',

  -- Pricing
  price_paid INTEGER NOT NULL, -- 19800 (JPY)
  currency VARCHAR(3) DEFAULT 'JPY',

  -- Dates
  purchased_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL, -- purchased_at + 63 days
  refunded_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for purchases
CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_purchases_status ON purchases(status);
CREATE INDEX idx_purchases_expires ON purchases(expires_at)
  WHERE status = 'active';
CREATE INDEX idx_purchases_revenuecat_user ON purchases(revenuecat_app_user_id);

-- View for active purchases
CREATE VIEW active_purchases AS
SELECT * FROM purchases
WHERE status = 'active' AND expires_at > NOW();

-- ============================================
-- WEBHOOK_EVENTS TABLE (Idempotency Management)
-- ============================================
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id VARCHAR(255) NOT NULL,        -- RevenueCat event ID
  event_type VARCHAR(100) NOT NULL,      -- 'INITIAL_PURCHASE', 'REFUND', etc.
  transaction_id VARCHAR(255),           -- Related transaction_id
  status VARCHAR(20) NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  error_message TEXT,                    -- Error message on failure
  processed_at TIMESTAMP,                -- Processing completion time (NULL = not completed)
  started_at TIMESTAMP DEFAULT NOW(),    -- Processing start time (for timeout detection)
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(event_id, event_type)  -- Prevent duplicate event types
);

-- Indexes for webhook_events
CREATE INDEX idx_webhook_events_lookup ON webhook_events(event_id, event_type);
CREATE INDEX idx_webhook_events_failed ON webhook_events(status) WHERE status = 'failed';
CREATE INDEX idx_webhook_events_stale ON webhook_events(status, started_at)
  WHERE status = 'processing';  -- For stale processing detection

-- ============================================
-- EXIT_REVIEWS TABLE
-- ============================================
CREATE TABLE exit_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  purchase_id UUID REFERENCES purchases(id),  -- Related purchase (if any)
  exit_type VARCHAR(50) NOT NULL CHECK (exit_type IN ('graduation', 'trial_stop', 'refund')),
  reason_category VARCHAR(100),
  free_text TEXT,
  expected_vs_reality TEXT,
  missing_support TEXT,
  learnings TEXT,                             -- Learnings (for Exit Ritual)
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_exit_reviews_user ON exit_reviews(user_id);
CREATE INDEX idx_exit_reviews_type ON exit_reviews(exit_type);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on tables
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE exit_reviews ENABLE ROW LEVEL SECURITY;

-- PURCHASES RLS Policies
-- Users can only view their own purchases
CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert/update purchases (via webhook)
CREATE POLICY "Service role can manage purchases"
  ON purchases FOR ALL
  USING (auth.role() = 'service_role');

-- WEBHOOK_EVENTS RLS Policies
-- Only service role can access webhook_events
CREATE POLICY "Service role can manage webhook_events"
  ON webhook_events FOR ALL
  USING (auth.role() = 'service_role');

-- EXIT_REVIEWS RLS Policies
-- Users can view and insert their own exit reviews
CREATE POLICY "Users can view own exit_reviews"
  ON exit_reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exit_reviews"
  ON exit_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can manage all exit_reviews
CREATE POLICY "Service role can manage exit_reviews"
  ON exit_reviews FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- UPDATE USERS TABLE FOR PURCHASE TRACKING
-- ============================================

-- Add purchase-related columns to users table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'purchase_expires_at'
  ) THEN
    ALTER TABLE users ADD COLUMN purchase_expires_at TIMESTAMP;
  END IF;
END $$;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if user has active purchase
CREATE OR REPLACE FUNCTION has_active_purchase(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM purchases
    WHERE user_id = p_user_id
      AND status = 'active'
      AND expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's current purchase
CREATE OR REPLACE FUNCTION get_current_purchase(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  product_id VARCHAR(100),
  status VARCHAR(50),
  purchased_at TIMESTAMP,
  expires_at TIMESTAMP,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.product_id,
    p.status,
    p.purchased_at,
    p.expires_at,
    GREATEST(0, EXTRACT(DAY FROM (p.expires_at - NOW()))::INTEGER) as days_remaining
  FROM purchases p
  WHERE p.user_id = p_user_id
    AND p.status = 'active'
  ORDER BY p.purchased_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update expired purchases (called by cron)
CREATE OR REPLACE FUNCTION update_expired_purchases()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  WITH expired AS (
    UPDATE purchases
    SET status = 'expired',
        updated_at = NOW()
    WHERE status = 'active'
      AND expires_at <= NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO updated_count FROM expired;

  -- Also update user phases for expired purchases
  UPDATE users u
  SET current_phase = 'completed',
      purchase_expires_at = NULL
  FROM purchases p
  WHERE p.user_id = u.id
    AND p.status = 'expired'
    AND u.current_phase = 'paid';

  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for purchases table
CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
