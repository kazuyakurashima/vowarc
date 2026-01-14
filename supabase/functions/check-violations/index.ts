// VowArc Violation Detection
// Cron job to detect contract violations (commitment miss, absence, false report)
// Ticket 016: Contract Violation Protocol (MVP)
//
// Violation Types:
// - absence: 3+ consecutive days without checkin (auto-detected)
// - commitment_miss: <50% weekly commitment completion rate (auto-detected)
// - false_report: Inconsistency between reports and evidence (FUTURE: requires AI analysis)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ViolationResult {
  user_id: string;
  type: 'commitment_miss' | 'absence' | 'false_report';
  severity: number;
  week_number: number; // YYYYWW format (e.g., 202603 = 2026 Week 3)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create admin client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    const currentYearWeek = getYearWeek(now);

    // Get all active users (trial or paid phase)
    const { data: activeUsers, error: usersError } = await supabase
      .from('users')
      .select('id, current_phase, trial_start_date')
      .in('current_phase', ['trial', 'paid']);

    if (usersError) {
      throw usersError;
    }

    const violations: ViolationResult[] = [];
    const adminAlerts: string[] = [];

    for (const user of activeUsers || []) {
      // Check for absence (3+ days without checkin)
      const absenceViolation = await detectAbsence(supabase, user.id);
      if (absenceViolation) {
        violations.push({
          user_id: user.id,
          type: 'absence',
          severity: 1,
          week_number: currentYearWeek,
        });
      }

      // Check for commitment miss (weekly)
      const commitmentViolation = await detectCommitmentMiss(supabase, user.id);
      if (commitmentViolation) {
        violations.push({
          user_id: user.id,
          type: 'commitment_miss',
          severity: 1,
          week_number: currentYearWeek,
        });
      }

      // TODO: false_report detection (FUTURE FEATURE)
      // This requires AI analysis to detect inconsistencies between:
      // - User's checkin reports vs actual evidence uploaded
      // - Commitment completion claims vs evidence timestamps
      // - Patterns suggesting inaccurate self-reporting
      // For MVP, false_report violations are created manually by admin/coach

      // Get consecutive violation weeks (existing violations)
      const existingConsecutiveWeeks = await getConsecutiveViolationWeeks(supabase, user.id);

      // Calculate effective consecutive weeks INCLUDING current week's new violation
      const hasNewViolationThisWeek = violations.some(vl => vl.user_id === user.id);
      const effectiveConsecutiveWeeks = hasNewViolationThisWeek
        ? existingConsecutiveWeeks + 1  // Add current week
        : existingConsecutiveWeeks;

      // Update severity based on consecutive weeks
      for (const v of violations.filter(vl => vl.user_id === user.id)) {
        if (effectiveConsecutiveWeeks >= 2) {
          v.severity = 2; // Renegotiation
        }
        if (effectiveConsecutiveWeeks >= 3) {
          v.severity = 3; // Termination eligible
          adminAlerts.push(user.id);
        }
      }
    }

    // Insert new violations
    if (violations.length > 0) {
      // Check for existing violations this week to avoid duplicates
      for (const violation of violations) {
        const { data: existing } = await supabase
          .from('violation_logs')
          .select('id')
          .eq('user_id', violation.user_id)
          .eq('type', violation.type)
          .eq('week_number', violation.week_number)
          .single();

        if (!existing) {
          await supabase.from('violation_logs').insert({
            user_id: violation.user_id,
            type: violation.type,
            severity: violation.severity,
            week_number: violation.week_number,
          });
        }
      }
    }

    // Create termination records for 3-week violations
    for (const userId of adminAlerts) {
      const { data: existingRecord } = await supabase
        .from('termination_records')
        .select('id')
        .eq('user_id', userId)
        .eq('final_choice', 'pending')
        .single();

      if (!existingRecord) {
        // Generate evidence summary
        const { data: summary } = await supabase
          .rpc('generate_evidence_summary', { p_user_id: userId });

        await supabase.from('termination_records').insert({
          user_id: userId,
          reason: '3週連続違反',
          initiated_by: 'system',
          final_choice: 'pending',
          evidence_summary: summary,
          notification_method: 'dashboard',
        });

        console.log(`[ADMIN ALERT] User ${userId} has 3 consecutive violation weeks`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        violations_detected: violations.length,
        admin_alerts: adminAlerts.length,
        timestamp: now.toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Violation check error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Detect absence: No checkin for 3+ consecutive days
async function detectAbsence(supabase: any, userId: string): Promise<boolean> {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const { count } = await supabase
    .from('checkins')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('date', threeDaysAgo.toISOString().split('T')[0]);

  return (count || 0) === 0;
}

// Detect commitment miss: Less than 50% completion this week
async function detectCommitmentMiss(supabase: any, userId: string): Promise<boolean> {
  const weekStart = getWeekStart(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const { data: commitments } = await supabase
    .from('commitments')
    .select('id, status')
    .eq('user_id', userId)
    .gte('due_date', weekStart.toISOString().split('T')[0])
    .lt('due_date', weekEnd.toISOString().split('T')[0]);

  if (!commitments || commitments.length === 0) {
    return false; // No commitments = no violation
  }

  const completed = commitments.filter((c: any) => c.status === 'completed').length;
  const completionRate = completed / commitments.length;

  return completionRate < 0.5;
}

// Get consecutive violation weeks for a user
// Counts weeks with unresolved violations OR resolved violations (except dismissed/continued)
// This matches the SQL function get_user_violation_status logic
// Uses YYYYWW format for proper year boundary handling
async function getConsecutiveViolationWeeks(supabase: any, userId: string): Promise<number> {
  // Get all violations with detected_at for year-week calculation
  const { data: violations } = await supabase
    .from('violation_logs')
    .select('detected_at, resolved_at, resolution')
    .eq('user_id', userId)
    .order('detected_at', { ascending: false });

  if (!violations || violations.length === 0) {
    return 0;
  }

  // Filter: unresolved OR resolved with resolution NOT IN ('dismissed', 'continued')
  // This matches SQL: resolved_at IS NULL OR resolution NOT IN ('dismissed', 'continued')
  const countableViolations = violations.filter((v: any) =>
    v.resolved_at === null ||
    (v.resolution !== null && !['dismissed', 'continued'].includes(v.resolution))
  );

  if (countableViolations.length === 0) {
    return 0;
  }

  // Calculate year-week (YYYYWW) for each violation from detected_at
  const yearWeekSet = new Set(
    countableViolations.map((v: any) => getYearWeek(new Date(v.detected_at)))
  );

  // Count consecutive weeks from current week backwards
  const currentYearWeek = getYearWeek(new Date());
  let consecutive = 0;

  // Check up to 10 weeks back (handles year boundary correctly)
  for (let offset = 0; offset < 10; offset++) {
    const expectedYearWeek = calculatePreviousYearWeek(currentYearWeek, offset);
    if (yearWeekSet.has(expectedYearWeek)) {
      consecutive++;
    } else {
      break;
    }
  }

  return consecutive;
}

// Get ISO week number (1-53)
function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Get ISO year (handles year boundary correctly for ISO weeks)
function getISOYear(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  return d.getUTCFullYear();
}

// Get year-week as YYYYWW format (e.g., 202603 = 2026 Week 3)
// This handles year boundaries correctly
function getYearWeek(date: Date): number {
  return getISOYear(date) * 100 + getISOWeekNumber(date);
}

// Get weeks in a given year (52 or 53)
function getWeeksInYear(year: number): number {
  // Dec 28 is always in the last ISO week of the year
  const dec28 = new Date(Date.UTC(year, 11, 28));
  return getISOWeekNumber(dec28);
}

// Calculate previous year-week with proper year boundary handling
// e.g., calculatePreviousYearWeek(202601, 1) = 202552
function calculatePreviousYearWeek(yearWeek: number, offset: number): number {
  let year = Math.floor(yearWeek / 100);
  let week = yearWeek % 100;

  week = week - offset;

  while (week < 1) {
    year = year - 1;
    week = week + getWeeksInYear(year);
  }

  return year * 100 + week;
}

// Get start of current week (Monday)
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
