-- Memory System Schema (Ticket 006)
-- Two-layer architecture: Short-term (7-day) + Milestones (Immutable)

-- 1. Memories Table (両方のレイヤーを格納)
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Memory content
  content TEXT NOT NULL,
  memory_type TEXT CHECK (memory_type IN ('short_term', 'milestone')) NOT NULL,

  -- Source tracking
  source_type TEXT CHECK (source_type IN ('checkin', 'evidence', 'manual')) NOT NULL,
  source_id UUID, -- Reference to checkin or evidence

  -- Mutability control
  is_immutable BOOLEAN DEFAULT FALSE, -- TRUE for milestones after 24h (on UPDATE)
  immutable_at TIMESTAMP, -- When became immutable

  -- Lifecycle
  extracted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- For short-term (7 days), NULL for milestones

  -- Metadata
  tags JSONB DEFAULT '[]', -- AI-extracted tags
  confidence_score NUMERIC(3,2), -- AI confidence (0.00-1.00)

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Memory Versions (変更履歴)
CREATE TABLE memory_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  memory_id UUID REFERENCES memories(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  changed_by UUID REFERENCES users(id) NOT NULL,
  change_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Tombstones (削除記録)
CREATE TABLE tombstones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  memory_id UUID NOT NULL, -- Original memory ID (before deletion)
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL, -- Snapshot of deleted content
  deletion_type TEXT CHECK (deletion_type IN ('user', 'admin', 'expired')) NOT NULL,
  deleted_at TIMESTAMP DEFAULT NOW(),
  deleted_by UUID REFERENCES users(id), -- Admin who deleted (if admin deletion)
  deletion_reason TEXT -- Required for admin deletions
);

-- 4. Deletion Requests (ユーザー削除申請)
CREATE TABLE deletion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  memory_id UUID REFERENCES memories(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id), -- Admin who reviewed
  reviewed_at TIMESTAMP,
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Audit Logs (監査ログ)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  action TEXT CHECK (action IN (
    'memory_created', 'memory_updated', 'memory_deleted',
    'deletion_requested', 'deletion_approved', 'deletion_rejected'
  )) NOT NULL,
  target_type TEXT NOT NULL, -- 'memory', 'deletion_request'
  target_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}', -- Additional context
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_memories_user_type ON memories(user_id, memory_type);
CREATE INDEX idx_memories_expires ON memories(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_memories_source ON memories(source_type, source_id);
CREATE INDEX idx_memory_versions_memory ON memory_versions(memory_id, version_number);
CREATE INDEX idx_tombstones_user ON tombstones(user_id, deleted_at);
CREATE INDEX idx_deletion_requests_status ON deletion_requests(status, created_at);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at);

-- RLS Policies
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tombstones ENABLE ROW LEVEL SECURITY;
ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Memories policies
CREATE POLICY "Users can view own memories" ON memories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memories" ON memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update mutable memories" ON memories
  FOR UPDATE USING (auth.uid() = user_id AND is_immutable = FALSE);

-- Memory Versions policies
CREATE POLICY "Users can view own memory versions" ON memory_versions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM memories WHERE id = memory_versions.memory_id AND user_id = auth.uid())
  );

-- Allow trigger-based inserts (SECURITY DEFINER function ensures proper authorization)
CREATE POLICY "System can insert memory versions" ON memory_versions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM memories WHERE id = memory_versions.memory_id)
  );

-- Tombstones policies (read-only for users)
CREATE POLICY "Users can view own tombstones" ON tombstones
  FOR SELECT USING (auth.uid() = user_id);

-- Deletion Requests policies
CREATE POLICY "Users can view own deletion requests" ON deletion_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create deletion requests" ON deletion_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Audit Logs policies (read-only)
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Triggers

-- Auto-version on update
CREATE OR REPLACE FUNCTION create_memory_version()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO memory_versions (memory_id, content, version_number, changed_by)
  VALUES (
    NEW.id,
    OLD.content,
    (SELECT COALESCE(MAX(version_number), 0) + 1 FROM memory_versions WHERE memory_id = NEW.id),
    COALESCE(auth.uid(), NEW.user_id)
  );

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER memory_version_trigger
  BEFORE UPDATE ON memories
  FOR EACH ROW
  WHEN (OLD.content IS DISTINCT FROM NEW.content)
  EXECUTE FUNCTION create_memory_version();

-- Auto-immutable milestones after 24h
-- NOTE: This trigger only fires on UPDATE. For automatic immutability without updates,
-- implement a background job (Supabase Edge Function with pg_cron) to periodically
-- UPDATE is_immutable for milestones older than 24h.
CREATE OR REPLACE FUNCTION make_milestone_immutable()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.memory_type = 'milestone' AND
     NEW.created_at < NOW() - INTERVAL '24 hours' AND
     NEW.is_immutable = FALSE THEN
    NEW.is_immutable = TRUE;
    NEW.immutable_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER milestone_immutable_trigger
  BEFORE UPDATE ON memories
  FOR EACH ROW
  EXECUTE FUNCTION make_milestone_immutable();

-- Auto-audit logging
CREATE OR REPLACE FUNCTION log_memory_action()
RETURNS TRIGGER AS $$
DECLARE
  action_type TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_type := 'memory_created';
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'memory_updated';
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'memory_deleted';
  END IF;

  INSERT INTO audit_logs (user_id, action, target_type, target_id, metadata)
  VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    action_type,
    'memory',
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object('op', TG_OP)
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER memory_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON memories
  FOR EACH ROW
  EXECUTE FUNCTION log_memory_action();
