-- VowArc Cognitive Map Schema
-- Ticket 011: Cognitive Map Basic (MVP - List Format)
-- Idempotent: Safe to re-run

-- ============================================
-- MAP_NODES TABLE
-- Stores cognitive map nodes (vow, meaning, values, strengths, anti_pattern, achievement)
-- ============================================
CREATE TABLE IF NOT EXISTS map_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('vow', 'meaning', 'value', 'strength', 'anti_pattern', 'achievement')),
  content TEXT NOT NULL,
  source_type VARCHAR(50) CHECK (source_type IN ('day0', 'meaning_forge', 'evidence', 'manual')),
  source_id UUID, -- Reference to original evidence, etc.
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_map_nodes_user ON map_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_map_nodes_type ON map_nodes(type);
CREATE INDEX IF NOT EXISTS idx_map_nodes_active ON map_nodes(is_active);

-- ============================================
-- MAP_NODE_VERSIONS TABLE
-- Stores edit history for map nodes
-- ============================================
CREATE TABLE IF NOT EXISTS map_node_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_id UUID REFERENCES map_nodes(id) ON DELETE CASCADE NOT NULL,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  edited_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_map_node_versions_node ON map_node_versions(node_id);

-- ============================================
-- TRIGGER: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_map_nodes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_map_nodes_updated_at ON map_nodes;
CREATE TRIGGER trigger_map_nodes_updated_at
  BEFORE UPDATE ON map_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_map_nodes_updated_at();

-- ============================================
-- TRIGGER: Auto-create version history on update
-- ============================================
CREATE OR REPLACE FUNCTION create_map_node_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if content changed
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    INSERT INTO map_node_versions (node_id, version, content)
    VALUES (OLD.id, OLD.version, OLD.content);

    NEW.version = OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_map_node_version ON map_nodes;
CREATE TRIGGER trigger_map_node_version
  BEFORE UPDATE ON map_nodes
  FOR EACH ROW
  EXECUTE FUNCTION create_map_node_version();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE map_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_node_versions ENABLE ROW LEVEL SECURITY;

-- Map nodes policies
DROP POLICY IF EXISTS "Users can view own map_nodes" ON map_nodes;
DROP POLICY IF EXISTS "Users can insert own map_nodes" ON map_nodes;
DROP POLICY IF EXISTS "Users can update own map_nodes" ON map_nodes;
DROP POLICY IF EXISTS "Users can delete own map_nodes" ON map_nodes;
DROP POLICY IF EXISTS "Service role can manage map_nodes" ON map_nodes;

CREATE POLICY "Users can view own map_nodes"
  ON map_nodes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own map_nodes"
  ON map_nodes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own map_nodes"
  ON map_nodes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own map_nodes"
  ON map_nodes FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage map_nodes"
  ON map_nodes FOR ALL
  USING (auth.role() = 'service_role');

-- Map node versions policies
DROP POLICY IF EXISTS "Users can view own map_node_versions" ON map_node_versions;
DROP POLICY IF EXISTS "Service role can manage map_node_versions" ON map_node_versions;

CREATE POLICY "Users can view own map_node_versions"
  ON map_node_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM map_nodes
      WHERE map_nodes.id = map_node_versions.node_id
        AND map_nodes.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage map_node_versions"
  ON map_node_versions FOR ALL
  USING (auth.role() = 'service_role');
