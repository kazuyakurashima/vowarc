/**
 * Day 21 Complete API (Ticket 007)
 * Records the user's Day 21 choice (continue/stop) and settings
 */

import { getServerClient } from '@/lib/supabase';
import { INTERVENTION_AREAS, InterventionAreaKey } from '@/lib/openai/coach';

export type Day21Choice = 'continue' | 'stop';
export type ToughLoveIntensity = 'gentle' | 'standard' | 'strong';

interface Day21CompleteRequest {
  choice: Day21Choice;
  updated_vow?: string;
  tough_love_settings?: {
    areas: InterventionAreaKey[];
    intensity: ToughLoveIntensity;
  };
}

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
      console.error('[Day21 Complete API] Auth verification failed:', authError);
      return Response.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    const userId = userData.user.id;

    // Parse request body
    const body: Day21CompleteRequest = await request.json();

    // Validate choice
    if (!body.choice || !['continue', 'stop'].includes(body.choice)) {
      return Response.json(
        { error: 'Invalid choice. Must be "continue" or "stop"' },
        { status: 400 }
      );
    }

    // Get current user data
    const { data: user, error: userError } = await serverClient
      .from('users')
      .select('trial_start_date, current_phase')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Start transaction-like operations
    const results: Record<string, any> = {};

    // 1. Update vow if provided
    if (body.updated_vow && body.choice === 'continue') {
      // Get current vow version
      const { data: currentVow } = await serverClient
        .from('vows')
        .select('version')
        .eq('user_id', userId)
        .eq('is_current', true)
        .single();

      const newVersion = (currentVow?.version || 0) + 1;

      // Mark old vow as not current
      await serverClient
        .from('vows')
        .update({ is_current: false })
        .eq('user_id', userId)
        .eq('is_current', true);

      // Insert new vow
      const { data: newVow, error: vowError } = await serverClient
        .from('vows')
        .insert({
          user_id: userId,
          content: body.updated_vow,
          version: newVersion,
          is_current: true,
        })
        .select()
        .single();

      if (vowError) {
        console.error('[Day21 Complete API] Vow update failed:', vowError);
      } else {
        results.vow = newVow;
      }
    }

    // 2. Update intervention settings if provided
    if (body.tough_love_settings && body.choice === 'continue') {
      // Validate intervention areas
      const validAreas = body.tough_love_settings.areas.filter(
        area => Object.keys(INTERVENTION_AREAS).includes(area)
      );

      // Get all possible areas
      const allAreas = Object.keys(INTERVENTION_AREAS) as InterventionAreaKey[];
      const noTouchAreas = allAreas.filter(area => !validAreas.includes(area));

      // Upsert intervention settings
      const { data: settings, error: settingsError } = await serverClient
        .from('user_intervention_settings')
        .upsert({
          user_id: userId,
          intervene_areas: validAreas,
          no_touch_areas: noTouchAreas,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        })
        .select()
        .single();

      if (settingsError) {
        console.error('[Day21 Complete API] Settings update failed:', settingsError);
      } else {
        results.intervention_settings = settings;
      }

      // Store intensity preference (could be a separate column or in metadata)
      // For MVP, we'll log it but not store separately
      console.log('[Day21 Complete API] Intensity preference:', body.tough_love_settings.intensity);
    }

    // 3. Update user phase based on choice
    const newPhase = body.choice === 'continue' ? 'paid' : 'terminated';
    const { error: phaseError } = await serverClient
      .from('users')
      .update({
        current_phase: newPhase,
        ...(body.choice === 'continue' ? { paid_start_date: new Date().toISOString() } : {}),
      })
      .eq('id', userId);

    if (phaseError) {
      console.error('[Day21 Complete API] Phase update failed:', phaseError);
      return Response.json(
        { error: 'Failed to update user phase' },
        { status: 500 }
      );
    }

    // 4. Create audit log entry
    await serverClient
      .from('audit_logs')
      .insert({
        user_id: userId,
        action: body.choice === 'continue' ? 'day21_continue' : 'day21_stop',
        target_type: 'user',
        target_id: userId,
        metadata: {
          choice: body.choice,
          vow_updated: !!body.updated_vow,
          tough_love_areas: body.tough_love_settings?.areas || [],
          tough_love_intensity: body.tough_love_settings?.intensity || null,
        },
      });

    console.log('[Day21 Complete API] Day 21 completed for user:', userId, 'Choice:', body.choice);

    return Response.json({
      success: true,
      choice: body.choice,
      new_phase: newPhase,
      results,
      next_step: body.choice === 'continue' ? 'payment' : 'exit_ritual',
    });
  } catch (error) {
    console.error('[Day21 Complete API] Error:', error);

    return Response.json(
      {
        error: 'Failed to complete Day 21',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
