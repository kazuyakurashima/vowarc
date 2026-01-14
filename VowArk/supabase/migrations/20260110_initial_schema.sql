-- VowArc Initial Database Schema
-- Based on Ticket 001 specification

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  current_phase TEXT CHECK (current_phase IN ('day0', 'trial', 'paid', 'completed', 'terminated')) DEFAULT 'day0',
  trial_start_date TIMESTAMP,
  paid_start_date TIMESTAMP
);

-- Vows table (誓い)
CREATE TABLE vows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  is_current BOOLEAN DEFAULT TRUE
);

-- Meaning Statements table
CREATE TABLE meaning_statements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  is_current BOOLEAN DEFAULT TRUE
);

-- Checkins table
CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  type TEXT CHECK (type IN ('morning', 'evening', 'voice')) NOT NULL,
  transcript TEXT,
  audio_url TEXT,
  mood INTEGER CHECK (mood >= 1 AND mood <= 5),
  if_then_triggered BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Commitments table
CREATE TABLE commitments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  type TEXT CHECK (type IN ('daily', 'weekly', 'milestone')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  due_date DATE NOT NULL,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Onboarding Answers table (Ticket 002)
CREATE TABLE onboarding_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  question_key TEXT CHECK (question_key IN ('why', 'pain', 'ideal', 'origin', 'values', 'strengths', 'fear', 'contribution')) NOT NULL,
  answer TEXT NOT NULL,
  input_type TEXT CHECK (input_type IN ('text', 'voice')) DEFAULT 'text',
  audio_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Intervention Settings table (Ticket 005)
CREATE TABLE user_intervention_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  intervene_areas JSONB DEFAULT '["anti_pattern", "time_excuse"]',
  no_touch_areas JSONB DEFAULT '[]',
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_vows_user_current ON vows(user_id, is_current);
CREATE INDEX idx_meaning_statements_user_current ON meaning_statements(user_id, is_current);
CREATE INDEX idx_checkins_user_date ON checkins(user_id, date);
CREATE INDEX idx_commitments_user_due ON commitments(user_id, due_date);
CREATE INDEX idx_onboarding_answers_user ON onboarding_answers(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vows ENABLE ROW LEVEL SECURITY;
ALTER TABLE meaning_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_intervention_settings ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Vows policies
CREATE POLICY "Users can view own vows" ON vows
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vows" ON vows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vows" ON vows
  FOR UPDATE USING (auth.uid() = user_id);

-- Meaning Statements policies
CREATE POLICY "Users can view own meaning statements" ON meaning_statements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meaning statements" ON meaning_statements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meaning statements" ON meaning_statements
  FOR UPDATE USING (auth.uid() = user_id);

-- Checkins policies
CREATE POLICY "Users can view own checkins" ON checkins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins" ON checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins" ON checkins
  FOR UPDATE USING (auth.uid() = user_id);

-- Commitments policies
CREATE POLICY "Users can view own commitments" ON commitments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own commitments" ON commitments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own commitments" ON commitments
  FOR UPDATE USING (auth.uid() = user_id);

-- Onboarding Answers policies
CREATE POLICY "Users can view own onboarding answers" ON onboarding_answers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding answers" ON onboarding_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Intervention Settings policies
CREATE POLICY "Users can view own intervention settings" ON user_intervention_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own intervention settings" ON user_intervention_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own intervention settings" ON user_intervention_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (NEW.id, NEW.email, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user record on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
