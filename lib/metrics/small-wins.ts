/**
 * Small Wins Metrics Calculation (Ticket 010)
 * Calculates process metrics for behavior tracking dashboard
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// Types
// ============================================

export interface SmallWinsMetrics {
  // Checkin metrics
  checkinRate: number;
  checkinCount: number;
  checkinTotal: number;
  checkinStreak: number;

  // If-Then metrics
  ifThenCount: number;
  ifThenRate: number;

  // Evidence metrics
  evidenceCount: number;
  evidenceRate: number;
  evidenceExpected: number;

  // Commitment metrics
  commitmentCompleted: number;
  commitmentTotal: number;
  commitmentRate: number;
}

export type Tier = 'on_track' | 'at_risk' | 'needs_reset';

export interface SmallWinsSummary {
  metrics: SmallWinsMetrics;
  tier: Tier;
  tierMessage: string;
  averageRate: number;
}

// ============================================
// Tier Configuration
// ============================================

export const TIER_CONFIG = {
  on_track: {
    threshold: 0.7,
    message: '今のペースを維持できています',
    label: 'On Track',
  },
  at_risk: {
    threshold: 0.4,
    message: '一部の行動に注意が必要です',
    label: 'At Risk',
  },
  needs_reset: {
    threshold: 0,
    message: '一度立ち止まって再設計しましょう',
    label: 'Needs Reset',
  },
} as const;

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate days since a given date
 */
function getDaysSince(startDate: string | Date): number {
  const start = new Date(startDate);
  const now = new Date();
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1); // Include today, minimum 1
}

/**
 * Check if two dates are the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Get date string for a given date (YYYY-MM-DD)
 */
function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ============================================
// Metric Calculations
// ============================================

/**
 * Calculate checkin metrics
 */
export async function calculateCheckinMetrics(
  supabase: SupabaseClient,
  userId: string,
  trialStartDate: string
): Promise<{
  rate: number;
  count: number;
  total: number;
  streak: number;
}> {
  const daysSinceStart = getDaysSince(trialStartDate);

  // Get all checkins (unique dates)
  const { data: checkins, error } = await supabase
    .from('checkins')
    .select('date')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching checkins:', error);
    return { rate: 0, count: 0, total: daysSinceStart, streak: 0 };
  }

  // Count unique checkin dates
  const uniqueDates = new Set((checkins || []).map(c => c.date));
  const checkinCount = uniqueDates.size;

  // Calculate streak
  let streak = 0;
  const today = new Date();
  let expectedDate = new Date(today);

  // Sort dates descending
  const sortedDates = Array.from(uniqueDates).sort().reverse();

  for (const dateStr of sortedDates) {
    const checkinDate = new Date(dateStr);
    const expectedDateStr = getDateString(expectedDate);

    if (dateStr === expectedDateStr) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else if (streak === 0 && dateStr === getDateString(new Date(today.getTime() - 86400000))) {
      // Allow starting from yesterday if no checkin today yet
      streak = 1;
      expectedDate = new Date(checkinDate);
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    rate: checkinCount / daysSinceStart,
    count: checkinCount,
    total: daysSinceStart,
    streak,
  };
}

/**
 * Calculate If-Then trigger metrics
 *
 * Current MVP implementation:
 * - Rate = (if_then_triggered count) / (total checkins)
 * - This measures "how often if-then was executed" as a percentage of all checkins
 *
 * Phase B improvement:
 * - Track "obstacle_encountered" separately from "if_then_triggered"
 * - Rate = (if_then_triggered count) / (obstacle_encountered count)
 * - This would measure "when obstacles occurred, how often was if-then executed successfully"
 */
export async function calculateIfThenMetrics(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  count: number;
  rate: number;
  totalCheckins: number;
}> {
  // Get checkins with if_then_triggered
  const { data: allCheckins, error: allError } = await supabase
    .from('checkins')
    .select('id')
    .eq('user_id', userId);

  const { data: triggeredCheckins, error: triggeredError } = await supabase
    .from('checkins')
    .select('id')
    .eq('user_id', userId)
    .eq('if_then_triggered', true);

  if (allError || triggeredError) {
    console.error('Error fetching if-then metrics:', allError || triggeredError);
    return { count: 0, rate: 0, totalCheckins: 0 };
  }

  const totalCheckins = allCheckins?.length || 0;
  const ifThenCount = triggeredCheckins?.length || 0;

  return {
    count: ifThenCount,
    rate: totalCheckins > 0 ? ifThenCount / totalCheckins : 0,
    totalCheckins,
  };
}

/**
 * Calculate Evidence submission metrics
 */
export async function calculateEvidenceMetrics(
  supabase: SupabaseClient,
  userId: string,
  trialStartDate: string
): Promise<{
  count: number;
  rate: number;
  expected: number;
}> {
  const daysSinceStart = getDaysSince(trialStartDate);
  const weeksSinceStart = Math.max(1, Math.ceil(daysSinceStart / 7));

  // Expected: 1 evidence per week
  const expectedEvidences = weeksSinceStart;

  const { count, error } = await supabase
    .from('evidences')
    .select('id', { count: 'exact' })
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching evidences:', error);
    return { count: 0, rate: 0, expected: expectedEvidences };
  }

  const evidenceCount = count || 0;

  return {
    count: evidenceCount,
    rate: Math.min(1, evidenceCount / expectedEvidences), // Cap at 100%
    expected: expectedEvidences,
  };
}

/**
 * Calculate Commitment completion metrics
 */
export async function calculateCommitmentMetrics(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  completed: number;
  total: number;
  rate: number;
}> {
  const { data: commitments, error } = await supabase
    .from('commitments')
    .select('id, status')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching commitments:', error);
    return { completed: 0, total: 0, rate: 0 };
  }

  const total = commitments?.length || 0;
  const completed = commitments?.filter(c => c.status === 'completed').length || 0;

  return {
    completed,
    total,
    rate: total > 0 ? completed / total : 0,
  };
}

/**
 * Calculate tier based on average of 4 metrics
 *
 * Included in average:
 * 1. checkinRate - チェックイン継続率
 * 2. ifThenRate - If-Then発動率
 * 3. evidenceRate - Evidence提出率
 * 4. commitmentRate - コミット履行率
 *
 * NOT included (display only):
 * - checkinStreak - 連続日数は表示のみ、平均計算には含まない
 */
export function calculateTier(metrics: {
  checkinRate: number;
  ifThenRate: number;
  evidenceRate: number;
  commitmentRate: number;
}): { tier: Tier; averageRate: number } {
  const averageRate = (
    metrics.checkinRate +
    metrics.ifThenRate +
    metrics.evidenceRate +
    metrics.commitmentRate
  ) / 4;

  let tier: Tier;
  if (averageRate >= TIER_CONFIG.on_track.threshold) {
    tier = 'on_track';
  } else if (averageRate >= TIER_CONFIG.at_risk.threshold) {
    tier = 'at_risk';
  } else {
    tier = 'needs_reset';
  }

  return { tier, averageRate };
}

// ============================================
// Main Calculation Function
// ============================================

/**
 * Calculate all Small Wins metrics for a user
 */
export async function calculateSmallWinsSummary(
  supabase: SupabaseClient,
  userId: string,
  trialStartDate: string
): Promise<SmallWinsSummary> {
  // Calculate all metrics in parallel
  const [checkinMetrics, ifThenMetrics, evidenceMetrics, commitmentMetrics] = await Promise.all([
    calculateCheckinMetrics(supabase, userId, trialStartDate),
    calculateIfThenMetrics(supabase, userId),
    calculateEvidenceMetrics(supabase, userId, trialStartDate),
    calculateCommitmentMetrics(supabase, userId),
  ]);

  // Build metrics object
  const metrics: SmallWinsMetrics = {
    checkinRate: checkinMetrics.rate,
    checkinCount: checkinMetrics.count,
    checkinTotal: checkinMetrics.total,
    checkinStreak: checkinMetrics.streak,
    ifThenCount: ifThenMetrics.count,
    ifThenRate: ifThenMetrics.rate,
    evidenceCount: evidenceMetrics.count,
    evidenceRate: evidenceMetrics.rate,
    evidenceExpected: evidenceMetrics.expected,
    commitmentCompleted: commitmentMetrics.completed,
    commitmentTotal: commitmentMetrics.total,
    commitmentRate: commitmentMetrics.rate,
  };

  // Calculate tier
  const { tier, averageRate } = calculateTier({
    checkinRate: metrics.checkinRate,
    ifThenRate: metrics.ifThenRate,
    evidenceRate: metrics.evidenceRate,
    commitmentRate: metrics.commitmentRate,
  });

  return {
    metrics,
    tier,
    tierMessage: TIER_CONFIG[tier].message,
    averageRate,
  };
}
