export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type PhaseType = 'day0' | 'trial' | 'paid' | 'completed' | 'terminated';
export type CheckinType = 'morning' | 'evening' | 'voice';
export type CommitmentType = 'daily' | 'weekly' | 'milestone';
export type CommitmentStatus = 'pending' | 'completed' | 'failed';

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
          transcript: string | null;
          audio_url: string | null;
          mood: number | null;
          if_then_triggered: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          type: CheckinType;
          transcript?: string | null;
          audio_url?: string | null;
          mood?: number | null;
          if_then_triggered?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          type?: CheckinType;
          transcript?: string | null;
          audio_url?: string | null;
          mood?: number | null;
          if_then_triggered?: boolean | null;
          created_at?: string;
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
