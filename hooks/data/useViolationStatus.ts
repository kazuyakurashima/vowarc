/**
 * Violation Status Hook (Ticket 016)
 * Fetches user's violation status for contract violation protocol
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface ViolationStatus {
  consecutiveViolationWeeks: number;
  latestViolationType: 'commitment_miss' | 'absence' | 'false_report' | null;
  latestSeverity: 1 | 2 | 3 | null;
  hasUnresolvedWarning: boolean;
  hasUnresolvedRenegotiation: boolean;
}

interface UnresolvedViolation {
  id: string;
  type: 'commitment_miss' | 'absence' | 'false_report';
  severity: number;
  weekNumber: number;
  detectedAt: string;
}

interface UseViolationStatusResult {
  status: ViolationStatus | null;
  unresolvedViolations: UnresolvedViolation[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  resolveViolation: (
    violationId: string,
    resolution: 'warning_accepted' | 'renegotiated' | 'continued' | 'dismissed',
    userResponse?: string
  ) => Promise<void>;
}

export function useViolationStatus(userId: string | undefined): UseViolationStatusResult {
  const [status, setStatus] = useState<ViolationStatus | null>(null);
  const [unresolvedViolations, setUnresolvedViolations] = useState<UnresolvedViolation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchViolationStatus = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch violation status using the database function
      const { data: statusData, error: statusError } = await supabase
        .rpc('get_user_violation_status', { p_user_id: userId })
        .single<{
          consecutive_violation_weeks: number;
          latest_violation_type: string | null;
          latest_severity: number | null;
          has_unresolved_warning: boolean;
          has_unresolved_renegotiation: boolean;
        }>();

      if (statusError) {
        throw statusError;
      }

      // Fetch unresolved violations
      const { data: violationsData, error: violationsError } = await supabase
        .from('violation_logs')
        .select('id, type, severity, week_number, detected_at')
        .eq('user_id', userId)
        .is('resolved_at', null)
        .order('detected_at', { ascending: false });

      if (violationsError) {
        throw violationsError;
      }

      setStatus({
        consecutiveViolationWeeks: statusData?.consecutive_violation_weeks || 0,
        latestViolationType: (statusData?.latest_violation_type as 'commitment_miss' | 'absence' | 'false_report' | null) || null,
        latestSeverity: (statusData?.latest_severity as 1 | 2 | 3 | null) || null,
        hasUnresolvedWarning: statusData?.has_unresolved_warning || false,
        hasUnresolvedRenegotiation: statusData?.has_unresolved_renegotiation || false,
      });

      setUnresolvedViolations(
        (violationsData || []).map((v: any) => ({
          id: v.id,
          type: v.type,
          severity: v.severity,
          weekNumber: v.week_number,
          detectedAt: v.detected_at,
        }))
      );
    } catch (err) {
      console.error('Error fetching violation status:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch violation status'));
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const resolveViolation = useCallback(
    async (
      violationId: string,
      resolution: 'warning_accepted' | 'renegotiated' | 'continued' | 'dismissed',
      userResponse?: string
    ) => {
      if (!userId) return;

      const { error: resolveError } = await supabase
        .from('violation_logs')
        .update({
          resolved_at: new Date().toISOString(),
          resolution,
          user_response: userResponse,
        })
        .eq('id', violationId)
        .eq('user_id', userId);

      if (resolveError) {
        throw resolveError;
      }

      // Refetch status after resolving
      await fetchViolationStatus();
    },
    [userId, fetchViolationStatus]
  );

  useEffect(() => {
    fetchViolationStatus();
  }, [fetchViolationStatus]);

  return {
    status,
    unresolvedViolations,
    isLoading,
    error,
    refetch: fetchViolationStatus,
    resolveViolation,
  };
}
