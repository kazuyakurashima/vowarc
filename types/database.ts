export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type PhaseType = 'day0' | 'trial' | 'paid' | 'completed' | 'terminated';
export type CheckinType = 'morning' | 'evening' | 'voice' | 'text';
export type CommitmentType = 'daily' | 'weekly' | 'milestone';
export type CommitmentStatus = 'pending' | 'completed' | 'failed';
export type MemoryType = 'short_term' | 'milestone';
export type SourceType = 'checkin' | 'evidence' | 'manual';
export type DeletionType = 'user' | 'admin' | 'expired';
export type DeletionRequestStatus = 'pending' | 'approved' | 'rejected';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          current_phase: PhaseType;
          trial_start_date: string | null;
          paid_start_date: string | null;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
          current_phase?: PhaseType;
          trial_start_date?: string | null;
          paid_start_date?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          current_phase?: PhaseType;
          trial_start_date?: string | null;
          paid_start_date?: string | null;
        };
      };
      vows: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          version: number;
          created_at: string;
          is_current: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          version: number;
          created_at?: string;
          is_current?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          version?: number;
          created_at?: string;
          is_current?: boolean;
        };
      };
      meaning_statements: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          version: number;
          created_at: string;
          is_current: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          version: number;
          created_at?: string;
          is_current?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          version?: number;
          created_at?: string;
          is_current?: boolean;
        };
      };
      checkins: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          type: CheckinType;
          content: string | null;
          transcript: string | null;
          audio_url: string | null;
          mood: number | null;
          if_then_triggered: boolean | null;
          mirror_feedback: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          type: CheckinType;
          content?: string | null;
          transcript?: string | null;
          audio_url?: string | null;
          mood?: number | null;
          if_then_triggered?: boolean | null;
          mirror_feedback?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          type?: CheckinType;
          content?: string | null;
          transcript?: string | null;
          audio_url?: string | null;
          mood?: number | null;
          if_then_triggered?: boolean | null;
          mirror_feedback?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      commitments: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          type: CommitmentType;
          status: CommitmentStatus;
          due_date: string;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          type: CommitmentType;
          status?: CommitmentStatus;
          due_date: string;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          type?: CommitmentType;
          status?: CommitmentStatus;
          due_date?: string;
          completed_at?: string | null;
          created_at?: string;
        };
      };
      onboarding_answers: {
        Row: {
          id: string;
          user_id: string;
          question_key: 'why' | 'pain' | 'ideal' | 'origin' | 'values' | 'strengths' | 'fear' | 'contribution';
          answer: string;
          input_type: 'text' | 'voice';
          audio_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question_key: 'why' | 'pain' | 'ideal' | 'origin' | 'values' | 'strengths' | 'fear' | 'contribution';
          answer: string;
          input_type?: 'text' | 'voice';
          audio_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          question_key?: 'why' | 'pain' | 'ideal' | 'origin' | 'values' | 'strengths' | 'fear' | 'contribution';
          answer?: string;
          input_type?: 'text' | 'voice';
          audio_url?: string | null;
          created_at?: string;
        };
      };
      user_intervention_settings: {
        Row: {
          id: string;
          user_id: string;
          intervene_areas: Json;
          no_touch_areas: Json;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          intervene_areas?: Json;
          no_touch_areas?: Json;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          intervene_areas?: Json;
          no_touch_areas?: Json;
          updated_at?: string;
          created_at?: string;
        };
      };
      memories: {
        Row: {
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
          tags: Json;
          confidence_score: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          memory_type: MemoryType;
          source_type: SourceType;
          source_id?: string | null;
          is_immutable?: boolean;
          immutable_at?: string | null;
          extracted_at?: string;
          expires_at?: string | null;
          tags?: Json;
          confidence_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          memory_type?: MemoryType;
          source_type?: SourceType;
          source_id?: string | null;
          is_immutable?: boolean;
          immutable_at?: string | null;
          extracted_at?: string;
          expires_at?: string | null;
          tags?: Json;
          confidence_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      memory_versions: {
        Row: {
          id: string;
          memory_id: string;
          content: string;
          version_number: number;
          changed_by: string;
          change_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          memory_id: string;
          content: string;
          version_number: number;
          changed_by: string;
          change_reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          memory_id?: string;
          content?: string;
          version_number?: number;
          changed_by?: string;
          change_reason?: string | null;
          created_at?: string;
        };
      };
      tombstones: {
        Row: {
          id: string;
          memory_id: string;
          user_id: string;
          content: string;
          deletion_type: DeletionType;
          deleted_at: string;
          deleted_by: string | null;
          deletion_reason: string | null;
        };
        Insert: {
          id?: string;
          memory_id: string;
          user_id: string;
          content: string;
          deletion_type: DeletionType;
          deleted_at?: string;
          deleted_by?: string | null;
          deletion_reason?: string | null;
        };
        Update: {
          id?: string;
          memory_id?: string;
          user_id?: string;
          content?: string;
          deletion_type?: DeletionType;
          deleted_at?: string;
          deleted_by?: string | null;
          deletion_reason?: string | null;
        };
      };
      deletion_requests: {
        Row: {
          id: string;
          memory_id: string;
          user_id: string;
          reason: string;
          status: DeletionRequestStatus;
          reviewed_by: string | null;
          reviewed_at: string | null;
          admin_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          memory_id: string;
          user_id: string;
          reason: string;
          status?: DeletionRequestStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          admin_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          memory_id?: string;
          user_id?: string;
          reason?: string;
          status?: DeletionRequestStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          admin_notes?: string | null;
          created_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          target_type: string;
          target_id: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          target_type: string;
          target_id: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          target_type?: string;
          target_id?: string;
          metadata?: Json;
          created_at?: string;
        };
      };
      evidences: {
        Row: {
          id: string;
          user_id: string;
          type: 'image' | 'url' | 'note';
          title: string;
          content: string | null;
          file_url: string | null;
          date: string;
          ai_highlight_score: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'image' | 'url' | 'note';
          title: string;
          content?: string | null;
          file_url?: string | null;
          date?: string;
          ai_highlight_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'image' | 'url' | 'note';
          title?: string;
          content?: string | null;
          file_url?: string | null;
          date?: string;
          ai_highlight_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
