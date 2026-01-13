/**
 * Intervention Settings API (Ticket 005)
 * GET: Fetch user's intervention settings
 * PUT: Update user's intervention settings
 */

import { getServerClient } from '@/lib/supabase';
import { INTERVENTION_AREAS, InterventionAreaKey } from '@/lib/openai/coach';

// Valid intervention area keys
const VALID_AREAS = Object.keys(INTERVENTION_AREAS) as InterventionAreaKey[];

/**
 * GET: Fetch intervention settings
 */
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
      console.error('[Intervention Settings API] Auth verification failed:', authError);
      return Response.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    const userId = userData.user.id;

    // Fetch intervention settings
    const { data, error } = await serverClient
      .from('user_intervention_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found (acceptable, return defaults)
      console.error('[Intervention Settings API] Fetch error:', error);
      return Response.json(
        { error: 'Failed to fetch intervention settings' },
        { status: 500 }
      );
    }

    // Return settings with defaults
    return Response.json({
      success: true,
      settings: {
        intervene_areas: data?.intervene_areas || ['anti_pattern', 'time_excuse'],
        no_touch_areas: data?.no_touch_areas || [],
      },
      available_areas: INTERVENTION_AREAS,
    });
  } catch (error) {
    console.error('[Intervention Settings API] Error:', error);
    return Response.json(
      {
        error: 'Failed to fetch intervention settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update intervention settings
 */
export async function PUT(request: Request) {
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
      console.error('[Intervention Settings API] Auth verification failed:', authError);
      return Response.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    const userId = userData.user.id;

    // Parse request body
    const { intervene_areas, no_touch_areas } = await request.json();

    // Validate input
    if (!Array.isArray(intervene_areas) || !Array.isArray(no_touch_areas)) {
      return Response.json(
        { error: 'Invalid input: intervene_areas and no_touch_areas must be arrays' },
        { status: 400 }
      );
    }

    // Validate area keys
    const invalidIntervene = intervene_areas.filter(a => !VALID_AREAS.includes(a));
    const invalidNoTouch = no_touch_areas.filter(a => !VALID_AREAS.includes(a));

    if (invalidIntervene.length > 0 || invalidNoTouch.length > 0) {
      return Response.json(
        {
          error: 'Invalid area keys',
          invalid_intervene: invalidIntervene,
          invalid_no_touch: invalidNoTouch,
          valid_areas: VALID_AREAS,
        },
        { status: 400 }
      );
    }

    // Check for overlapping areas (can't be in both lists)
    const overlapping = intervene_areas.filter(a => no_touch_areas.includes(a));
    if (overlapping.length > 0) {
      return Response.json(
        {
          error: 'Area cannot be in both intervene_areas and no_touch_areas',
          overlapping,
        },
        { status: 400 }
      );
    }

    console.log('[Intervention Settings API] Updating settings for user:', userId);

    // Upsert intervention settings
    const { data, error } = await serverClient
      .from('user_intervention_settings')
      .upsert(
        {
          user_id: userId,
          intervene_areas,
          no_touch_areas,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('[Intervention Settings API] Update error:', error);
      return Response.json(
        { error: 'Failed to update intervention settings' },
        { status: 500 }
      );
    }

    console.log('[Intervention Settings API] Settings updated successfully');

    return Response.json({
      success: true,
      settings: {
        intervene_areas: data.intervene_areas,
        no_touch_areas: data.no_touch_areas,
      },
    });
  } catch (error) {
    console.error('[Intervention Settings API] Error:', error);
    return Response.json(
      {
        error: 'Failed to update intervention settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
