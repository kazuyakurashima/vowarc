-- Add Mirror Feedback column to checkins (Ticket 003)
ALTER TABLE checkins ADD COLUMN mirror_feedback JSONB;

-- Mirror Feedback structure:
-- {
--   "observed_change": "変化の観察",
--   "hypothesis": "仮説",
--   "next_experiment": "次の実験",
--   "evidence_links": ["evidence_id_1", "evidence_id_2"]
-- }
