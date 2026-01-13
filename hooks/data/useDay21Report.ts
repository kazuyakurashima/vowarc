/**
 * Day 21 Report Hook (Ticket 007)
 * Fetches and manages Day 21 Commitment Report data
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { buildApiUrl } from '@/lib/api-config';

// ============================================
// Types
// ============================================

export interface Day21Metrics {
  checkinRate: number;
  checkinCount: number;
  checkinTotal: number;
  ifThenRate: number;
  ifThenCount: number;
  evidenceRate: number;
  evidenceCount: number;
  commitmentRate: number;
  commitmentCompleted: number;
  commitmentTotal: number;
}

export interface ResilienceBreakdown {
  ifThenExecutions: number;
  comebacks: number;
  persistenceInCheckins: number;
}

export interface EvidenceHighlight {
  id: string;
  title: string;
  date: string;
  type: string;
  score: number;
  reason: string;
}

export interface VowEvolution {
  v1: { content: string; createdAt: string } | null;
  v2: { content: string; createdAt: string } | null;
  hasEvolved: boolean;
}

export interface Day21Report {
  currentDay: number;
  metrics: Day21Metrics;
  tier: 'on_track' | 'at_risk' | 'needs_reset';
  tierLabel: string;
  tierMessage: string;
  averageRate: number;
  resilienceCount: number;
  resilienceBreakdown: ResilienceBreakdown;
  evidenceHighlights: EvidenceHighlight[];
  vowEvolution: VowEvolution;
  potentialStatement: string;
  toughLovePreview: string;
}

// ============================================
// Hook
// ============================================

export function useDay21Report() {
  const [report, setReport] = useState<Day21Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get JWT token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(buildApiUrl('/api/day21/report'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch Day 21 report');
      }

      const data = await response.json();

      setReport({
        currentDay: data.current_day,
        metrics: {
          checkinRate: data.metrics.checkin_rate,
          checkinCount: data.metrics.checkin_count,
          checkinTotal: data.metrics.checkin_total,
          ifThenRate: data.metrics.if_then_rate,
          ifThenCount: data.metrics.if_then_count,
          evidenceRate: data.metrics.evidence_rate,
          evidenceCount: data.metrics.evidence_count,
          commitmentRate: data.metrics.commitment_rate,
          commitmentCompleted: data.metrics.commitment_completed,
          commitmentTotal: data.metrics.commitment_total,
        },
        tier: data.tier,
        tierLabel: data.tier_label,
        tierMessage: data.tier_message,
        averageRate: data.average_rate,
        resilienceCount: data.resilience_count,
        resilienceBreakdown: {
          ifThenExecutions: data.resilience_breakdown.if_then_executions,
          comebacks: data.resilience_breakdown.comebacks,
          persistenceInCheckins: data.resilience_breakdown.persistence_in_checkins,
        },
        evidenceHighlights: data.evidence_highlights,
        vowEvolution: {
          v1: data.vow_evolution.v1 ? {
            content: data.vow_evolution.v1.content,
            createdAt: data.vow_evolution.v1.created_at,
          } : null,
          v2: data.vow_evolution.v2 ? {
            content: data.vow_evolution.v2.content,
            createdAt: data.vow_evolution.v2.created_at,
          } : null,
          hasEvolved: data.vow_evolution.has_evolved,
        },
        potentialStatement: data.potential_statement,
        toughLovePreview: data.tough_love_preview,
      });
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return {
    report,
    loading,
    error,
    refetch: fetchReport,
  };
}

// ============================================
// Complete Day 21 API Call
// ============================================

export type Day21Choice = 'continue' | 'stop';
export type ToughLoveIntensity = 'gentle' | 'standard' | 'strong';

export interface Day21CompleteParams {
  choice: Day21Choice;
  updatedVow?: string;
  toughLoveSettings?: {
    areas: string[];
    intensity: ToughLoveIntensity;
  };
}

export async function completeDay21(params: Day21CompleteParams): Promise<{
  success: boolean;
  nextStep: 'payment' | 'exit_ritual';
}> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) {
    throw new Error('No authentication token');
  }

  const response = await fetch(buildApiUrl('/api/day21/complete'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      choice: params.choice,
      updated_vow: params.updatedVow,
      tough_love_settings: params.toughLoveSettings ? {
        areas: params.toughLoveSettings.areas,
        intensity: params.toughLoveSettings.intensity,
      } : undefined,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to complete Day 21');
  }

  const data = await response.json();
  return {
    success: data.success,
    nextStep: data.next_step,
  };
}
