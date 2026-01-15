/**
 * Violation Checker Component (Ticket 016)
 * Checks for unresolved violations and displays appropriate modal/navigation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/auth';
import { useViolationStatus } from '@/hooks/data/useViolationStatus';
import WarningModal from './WarningModal';

interface ViolationCheckerProps {
  children: React.ReactNode;
}

export default function ViolationChecker({ children }: ViolationCheckerProps) {
  const { user } = useAuth();
  const { status, unresolvedViolations, isLoading, resolveViolation } =
    useViolationStatus(user?.id);

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [currentViolation, setCurrentViolation] = useState<{
    id: string;
    type: 'commitment_miss' | 'absence' | 'false_report';
    severity: number;
  } | null>(null);

  // Check for violations on mount and when status changes
  useEffect(() => {
    if (isLoading || !status) return;

    // Find highest severity unresolved violation
    const unresolvedSorted = [...unresolvedViolations].sort(
      (a, b) => b.severity - a.severity
    );

    if (unresolvedSorted.length === 0) {
      setShowWarningModal(false);
      setCurrentViolation(null);
      return;
    }

    const highestSeverity = unresolvedSorted[0];

    // Severity 3 → Termination screen
    if (highestSeverity.severity >= 3) {
      router.push({
        pathname: '/(violation)/termination',
        params: { violationId: highestSeverity.id },
      });
      return;
    }

    // Severity 2 → Renegotiation screen
    if (highestSeverity.severity === 2) {
      router.push({
        pathname: '/(violation)/renegotiation',
        params: { violationId: highestSeverity.id },
      });
      return;
    }

    // Severity 1 → Warning modal
    if (highestSeverity.severity === 1) {
      setCurrentViolation({
        id: highestSeverity.id,
        type: highestSeverity.type,
        severity: highestSeverity.severity,
      });
      setShowWarningModal(true);
    }
  }, [isLoading, status, unresolvedViolations]);

  const handleWarningDismiss = () => {
    // Don't allow dismissing without a response
  };

  const handleWarningResponse = useCallback(
    async (response: {
      action: 'share_reason' | 'reduce_commitment' | 'redesign_if_then' | 'continue';
      reason?: string;
    }) => {
      if (!currentViolation) return;

      try {
        // Map action to resolution
        let resolution: 'warning_accepted' | 'continued' = 'warning_accepted';
        if (response.action === 'continue') {
          resolution = 'continued';
        }

        await resolveViolation(
          currentViolation.id,
          resolution,
          response.reason || `Action: ${response.action}`
        );

        setShowWarningModal(false);
        setCurrentViolation(null);

        // Navigate based on action
        // TODO: Add commitment and if-then screens in future iterations
        // For now, stay on current screen after warning acknowledgment
      } catch (error) {
        console.error('Error handling warning response:', error);
      }
    },
    [currentViolation, resolveViolation]
  );

  return (
    <>
      {children}
      <WarningModal
        visible={showWarningModal}
        violationType={currentViolation?.type || 'commitment_miss'}
        onDismiss={handleWarningDismiss}
        onResponse={handleWarningResponse}
      />
    </>
  );
}
