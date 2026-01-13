import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { buildApiUrl } from '@/lib/api-config';
import { SmallWinsMetrics, Tier, TIER_CONFIG } from '@/lib/metrics/small-wins';

export interface SmallWinsSummary {
  metrics: SmallWinsMetrics;
  tier: Tier;
  tierLabel: string;
  tierMessage: string;
  averageRate: number;
}

export function useSmallWins() {
  const [summary, setSummary] = useState<SmallWinsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get JWT token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(buildApiUrl('/api/small-wins/summary'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch metrics');
      }

      const data = await response.json();

      setSummary({
        metrics: {
          checkinRate: data.metrics.checkin_rate,
          checkinCount: data.metrics.checkin_count,
          checkinTotal: data.metrics.checkin_total,
          checkinStreak: data.metrics.checkin_streak,
          ifThenCount: data.metrics.if_then_count,
          ifThenRate: data.metrics.if_then_rate,
          evidenceCount: data.metrics.evidence_count,
          evidenceRate: data.metrics.evidence_rate,
          evidenceExpected: data.metrics.evidence_expected,
          commitmentCompleted: data.metrics.commitment_completed,
          commitmentTotal: data.metrics.commitment_total,
          commitmentRate: data.metrics.commitment_rate,
        },
        tier: data.tier,
        tierLabel: data.tier_label,
        tierMessage: data.tier_message,
        averageRate: data.average_rate,
      });
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary,
    tierConfig: TIER_CONFIG,
  };
}

/**
 * Format percentage for display
 */
export function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

/**
 * Format fraction for display (e.g., "5/7")
 */
export function formatFraction(numerator: number, denominator: number): string {
  return `${numerator}/${denominator}`;
}
