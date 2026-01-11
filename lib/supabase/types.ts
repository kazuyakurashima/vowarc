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

export interface MirrorFeedback {
  observed_change: string;
  hypothesis: string;
  next_experiment: string;
  evidence_links: string[]; // Evidence IDs
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
  mirror_feedback: MirrorFeedback | null; // AI-generated Mirror Feedback (ticket 003)
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

// Memory System Types (Ticket 006)

export type MemoryType = 'short_term' | 'milestone';
export type SourceType = 'checkin' | 'evidence' | 'manual';
export type DeletionType = 'user' | 'admin' | 'expired';
export type DeletionRequestStatus = 'pending' | 'approved' | 'rejected';

export interface Memory {
  id: string;
  user_id: string;
  content: string;
  memory_type: MemoryType;
  source_type: SourceType;
  source_id: string | null;
  is_immutable: boolean;
  immutable_at: string | null;
  extracted_at: string;
  expires_at: string | null;
  tags: string[];
  confidence_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface MemoryVersion {
  id: string;
  memory_id: string;
  content: string;
  version_number: number;
  changed_by: string;
  change_reason: string | null;
  created_at: string;
}

export interface Tombstone {
  id: string;
  memory_id: string;
  user_id: string;
  content: string;
  deletion_type: DeletionType;
  deleted_at: string;
  deleted_by: string | null;
  deletion_reason: string | null;
}

export interface DeletionRequest {
  id: string;
  memory_id: string;
  user_id: string;
  reason: string;
  status: DeletionRequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, any>;
  created_at: string;
}
