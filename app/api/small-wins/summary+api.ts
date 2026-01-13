/**
 * Small Wins Summary API (Ticket 010)
 * Returns process metrics for the Small Wins dashboard
 */

import { getServerClient } from '@/lib/supabase';
import { calculateSmallWinsSummary, TIER_CONFIG } from '@/lib/metrics/small-wins';

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
      console.error('[Small Wins API] Auth verification failed:', authError);
      return Response.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    const userId = userData.user.id;

    // Get user's trial start date
    const { data: user, error: userError } = await serverClient
      .from('users')
      .select('trial_start_date')
      .eq('id', userId)
      .single();

    if (userError || !user?.trial_start_date) {
      console.error('[Small Wins API] User fetch failed:', userError);
      return Response.json(
        { error: 'User not found or trial not started' },
        { status: 404 }
      );
    }

    // Calculate metrics
    const summary = await calculateSmallWinsSummary(
      serverClient,
      userId,
      user.trial_start_date
    );

    console.log('[Small Wins API] Summary calculated for user:', userId);

    // Format response
    return Response.json({
      success: true,
      metrics: {
        checkin_rate: summary.metrics.checkinRate,
        checkin_count: summary.metrics.checkinCount,
        checkin_total: summary.metrics.checkinTotal,
        checkin_streak: summary.metrics.checkinStreak,
        if_then_count: summary.metrics.ifThenCount,
        if_then_rate: summary.metrics.ifThenRate,
        evidence_count: summary.metrics.evidenceCount,
        evidence_rate: summary.metrics.evidenceRate,
        evidence_expected: summary.metrics.evidenceExpected,
        commitment_completed: summary.metrics.commitmentCompleted,
        commitment_total: summary.metrics.commitmentTotal,
        commitment_rate: summary.metrics.commitmentRate,
      },
      tier: summary.tier,
      tier_label: TIER_CONFIG[summary.tier].label,
      tier_message: summary.tierMessage,
      average_rate: summary.averageRate,
    });
  } catch (error) {
    console.error('[Small Wins API] Error:', error);

    return Response.json(
      {
        error: 'Failed to calculate metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
