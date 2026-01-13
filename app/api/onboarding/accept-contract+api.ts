/**
 * Contract Acceptance API
 * Updates user phase to 'trial' and sets trial_start_date
 * This marks the official start of the 3-month journey
 */

import { getServerClient } from '@/lib/supabase';

export async function POST(request: Request) {
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
      console.error('[Accept Contract] Auth verification failed:', authError);
      return Response.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    const userId = userData.user.id;

    console.log('[Accept Contract] Processing contract acceptance for user:', userId);

    // Update user phase to 'trial' and set trial_start_date
    const now = new Date().toISOString();
    const { error: updateError } = await serverClient
      .from('users')
      .update({
        current_phase: 'trial',
        trial_start_date: now,
        updated_at: now,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[Accept Contract] Failed to update user:', updateError);
      throw new Error(`Failed to start trial: ${updateError.message}`);
    }

    console.log('[Accept Contract] Trial started successfully');

    return Response.json({
      success: true,
      trialStartDate: now,
      message: 'Trial period started successfully',
    });
  } catch (error) {
    console.error('[Accept Contract] Error:', error);

    return Response.json(
      {
        error: 'Failed to accept contract',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
