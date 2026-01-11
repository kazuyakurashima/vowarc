-- ============================================
-- Evidence Journal System (Ticket 009)
-- ============================================

-- Create evidences table
CREATE TABLE IF NOT EXISTS evidences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('image', 'url', 'note')),
  title VARCHAR(200) NOT NULL,
  content TEXT, -- URL or note content
  file_url VARCHAR(500), -- for image (Supabase Storage URL)
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  ai_highlight_score DECIMAL(3, 2), -- For Day21 AI scoring (0.00-1.00)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_evidences_user_id ON evidences(user_id);
CREATE INDEX idx_evidences_date ON evidences(date DESC);
CREATE INDEX idx_evidences_type ON evidences(type);
CREATE INDEX idx_evidences_ai_score ON evidences(ai_highlight_score DESC NULLS LAST);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_evidences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_evidences_updated_at
  BEFORE UPDATE ON evidences
  FOR EACH ROW
  EXECUTE FUNCTION update_evidences_updated_at();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE evidences ENABLE ROW LEVEL SECURITY;

-- Users can view their own evidences
CREATE POLICY "Users can view own evidences" ON evidences
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own evidences
CREATE POLICY "Users can insert own evidences" ON evidences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own evidences
CREATE POLICY "Users can update own evidences" ON evidences
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own evidences
CREATE POLICY "Users can delete own evidences" ON evidences
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE evidences IS 'Evidence journal entries (images, URLs, notes) for user progress tracking';
COMMENT ON COLUMN evidences.type IS 'Evidence type: image (photo/screenshot), url (external link), note (text memo)';
COMMENT ON COLUMN evidences.content IS 'URL string for url type, text content for note type, null for image type';
COMMENT ON COLUMN evidences.file_url IS 'Supabase Storage public URL for image type, null for other types';
COMMENT ON COLUMN evidences.ai_highlight_score IS 'AI-generated score (0.00-1.00) for Day21 highlight selection, null until scored';
