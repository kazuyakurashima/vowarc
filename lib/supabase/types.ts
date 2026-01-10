/**
 * Database Types
 * Based on ticket 001 schema definition
 */

export type UserPhase = 'day0' | 'trial' | 'paid' | 'completed' | 'terminated';

export type CheckinType = 'morning' | 'evening' | 'voice';

export type CommitmentType = 'daily' | 'weekly' | 'milestone';

export type CommitmentStatus = 'pending' | 'completed' | 'failed';

export interface User {
  id: string;
  email: string;
  created_at: string;
  current_phase: UserPhase;
  trial_start_date: string | null;
  paid_start_date: string | null;
}

export interface Vow {
  id: string;
  user_id: string;
  content: string;
  version: number;
  created_at: string;
  is_current: boolean;
}

export interface MeaningStatement {
  id: string;
  user_id: string;
  content: string;
  version: number;
  created_at: string;
  is_current: boolean;
}

export interface Checkin {
  id: string;
  user_id: string;
  date: string;
  type: CheckinType;
  transcript: string | null;
  audio_url: string | null;
  mood: number | null; // Nullable: 1-5 scale
  if_then_triggered: boolean | null; // If-Then execution tracking (ticket 004)
  created_at: string;
}

export interface Commitment {
  id: string;
  user_id: string;
  content: string;
  type: CommitmentType;
  status: CommitmentStatus;
  due_date: string;
  completed_at: string | null;
  created_at: string;
}

export interface OnboardingAnswer {
  id: string;
  user_id: string;
  question_key: 'why' | 'pain' | 'ideal' | 'origin' | 'values' | 'strengths' | 'fear' | 'contribution';
  answer: string;
  input_type: 'text' | 'voice';
  audio_url: string | null;
  created_at: string;
}

export interface UserInterventionSettings {
  id: string;
  user_id: string;
  intervene_areas: string[];
  no_touch_areas: string[];
  updated_at: string;
  created_at: string;
}
