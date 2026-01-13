/**
 * Day 21 Report API (Ticket 007)
 * Returns the complete Day 21 Commitment Report
 */

import { getServerClient } from '@/lib/supabase';
import { generateDay21Report } from '@/lib/day21/report';

export async function GET(request: Request) {
  try {
    // Get authorization token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json(
        { error: 'Unauthorized: Missing or invalid authorization token' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token using service role client
    const serverClient = getServerClient();
    const { data: userData, error: authError } = await serverClient.auth.getUser(token);

    if (authError || !userData.user) {
      console.error('[Day21 Report API] Auth verification failed:', authError);
      return Response.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    const userId = userData.user.id;

    // Get user's trial start date
    const { data: user, error: userError } = await serverClient
      .from('users')
      .select('trial_start_date, current_phase')
      .eq('id', userId)
      .single();

    if (userError || !user?.trial_start_date) {
      console.error('[Day21 Report API] User fetch failed:', userError);
      return Response.json(
        { error: 'User not found or trial not started' },
        { status: 404 }
      );
    }

    // Check if user is at or past Day 21
    const trialStart = new Date(user.trial_start_date);
    const now = new Date();
    const daysSinceStart = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (daysSinceStart < 21) {
      return Response.json(
        {
          error: 'Day 21 not reached yet',
          current_day: daysSinceStart,
          days_until_day21: 21 - daysSinceStart,
        },
        { status: 400 }
      );
    }

    // Generate the report
    const report = await generateDay21Report(serverClient, userId, user.trial_start_date);

    console.log('[Day21 Report API] Report generated for user:', userId);

    // Format response
    return Response.json({
      success: true,
      current_day: daysSinceStart,
      metrics: {
        checkin_rate: report.metrics.checkinRate,
        checkin_count: report.metrics.checkinCount,
        checkin_total: report.metrics.checkinTotal,
        if_then_rate: report.metrics.ifThenRate,
        if_then_count: report.metrics.ifThenCount,
        evidence_rate: report.metrics.evidenceRate,
        evidence_count: report.metrics.evidenceCount,
        commitment_rate: report.metrics.commitmentRate,
        commitment_completed: report.metrics.commitmentCompleted,
        commitment_total: report.metrics.commitmentTotal,
      },
      tier: report.tier,
      tier_label: report.tierLabel,
      tier_message: report.tierMessage,
      average_rate: report.averageRate,
      resilience_count: report.resilienceCount,
      resilience_breakdown: {
        if_then_executions: report.resilienceBreakdown.ifThenExecutions,
        comebacks: report.resilienceBreakdown.comebacks,
        persistence_in_checkins: report.resilienceBreakdown.persistenceInCheckins,
      },
      evidence_highlights: report.evidenceHighlights.map(h => ({
        id: h.id,
        title: h.title,
        date: h.date,
        type: h.type,
        score: h.score,
        reason: h.reason,
      })),
      vow_evolution: {
        v1: report.vowEvolution.v1 ? {
          content: report.vowEvolution.v1.content,
          created_at: report.vowEvolution.v1.createdAt,
        } : null,
        v2: report.vowEvolution.v2 ? {
          content: report.vowEvolution.v2.content,
          created_at: report.vowEvolution.v2.createdAt,
        } : null,
        has_evolved: report.vowEvolution.hasEvolved,
      },
      potential_statement: report.potentialStatement,
      tough_love_preview: report.toughLovePreview,
    });
  } catch (error) {
    console.error('[Day21 Report API] Error:', error);

    return Response.json(
      {
        error: 'Failed to generate Day 21 report',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
