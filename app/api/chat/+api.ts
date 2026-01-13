/**
 * Chat API Endpoint (Ticket 005)
 * AI Coach conversation with context, contradiction detection, and intervention settings
 */

import { getServerClient } from '@/lib/supabase';
import { generateCoachResponse, CoachContext, CoachResponse, InterventionAreaKey } from '@/lib/openai/coach';

// Valid message types
const VALID_MESSAGE_TYPES = ['checkin', 'voice', 'text'] as const;
type MessageType = typeof VALID_MESSAGE_TYPES[number];

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
      console.error('[Chat API] Auth verification failed:', authError);
      return Response.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    const userId = userData.user.id;

    // Parse request body
    const { message, type = 'text' } = await request.json();

    if (!message || typeof message !== 'string') {
      return Response.json(
        { error: 'Missing required field: message' },
        { status: 400 }
      );
    }

    // Validate type parameter
    const messageType: MessageType = VALID_MESSAGE_TYPES.includes(type as MessageType)
      ? (type as MessageType)
      : 'text';

    console.log('[Chat API] Processing message for user:', userId, 'type:', messageType);

    // Fetch user context in parallel
    const [
      userResult,
      vowResult,
      meaningResult,
      memoriesResult,
      commitmentsResult,
      interventionResult,
      checkinsResult,
    ] = await Promise.all([
      // User profile
      serverClient.from('users').select('*').eq('id', userId).single(),
      // Current vow
      serverClient
        .from('vows')
        .select('*')
        .eq('user_id', userId)
        .eq('is_current', true)
        .single(),
      // Current meaning statement
      serverClient
        .from('meaning_statements')
        .select('*')
        .eq('user_id', userId)
        .eq('is_current', true)
        .single(),
      // Recent memories (last 7 days, active only)
      serverClient
        .from('memories')
        .select('*')
        .eq('user_id', userId)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(20),
      // Recent commitments
      serverClient
        .from('commitments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),
      // Intervention settings
      serverClient
        .from('user_intervention_settings')
        .select('*')
        .eq('user_id', userId)
        .single(),
      // Recent checkins (for contradiction detection)
      serverClient
        .from('checkins')
        .select('date, content, transcript')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(7),
    ]);

    // Extract anti-patterns from memories
    const antiPatterns = (memoriesResult.data || [])
      .filter(m => m.tags && Array.isArray(m.tags) && m.tags.includes('anti_pattern'))
      .map(m => m.content);

    // Calculate day number from trial start
    let dayNumber = 1;
    if (userResult.data?.trial_start_date) {
      const startDate = new Date(userResult.data.trial_start_date);
      const today = new Date();
      dayNumber = Math.floor((today.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    }

    // Format recent checkins for context
    const recentCheckins = (checkinsResult.data || []).map(c => ({
      date: c.date,
      content: c.content || c.transcript || '',
    })).filter(c => c.content);

    // Build coach context
    const context: CoachContext = {
      vow: vowResult.data?.content || '',
      meaningStatement: meaningResult.data?.content || '',
      antiPatterns,
      phase: userResult.data?.current_phase || 'trial',
      dayNumber,
      recentCommitments: commitmentsResult.data || [],
      recentMemories: memoriesResult.data || [],
      recentCheckins,
      interventionSettings: {
        interveneAreas: (interventionResult.data?.intervene_areas as string[]) || ['anti_pattern', 'time_excuse'],
        noTouchAreas: (interventionResult.data?.no_touch_areas as string[]) || [],
      },
    };

    // Generate coach response
    const response = await generateCoachResponse(message, context, messageType);

    // Server-side enforcement: Clear contradiction if related to no-touch areas
    // This is a safety net in case AI ignores the prompt instruction
    const noTouchAreas = context.interventionSettings.noTouchAreas;
    let contradictionDetected = response.contradiction.detected;
    let contradictionReference = response.contradiction.detected
      ? {
          past_statement: response.contradiction.pastStatement || '',
          past_date: response.contradiction.pastDate || '',
        }
      : null;

    // If there are no-touch areas and contradiction was detected, suppress it
    // Note: This is a broad suppression. In future iterations, we could do
    // more sophisticated matching to determine if the contradiction is
    // actually related to a no-touch area.
    if (noTouchAreas.length > 0 && contradictionDetected) {
      console.log('[Chat API] Suppressing contradiction due to no-touch areas:', noTouchAreas);
      contradictionDetected = false;
      contradictionReference = null;
    }

    console.log('[Chat API] Response generated successfully');

    return Response.json({
      success: true,
      response: {
        observed_change: response.observedChange,
        hypothesis: response.hypothesis,
        next_experiment: response.nextExperiment,
        evidence_links: response.evidenceLinks,
        contradiction_detected: contradictionDetected,
        contradiction_reference: contradictionReference,
      },
      raw_response: response.rawResponse,
    });
  } catch (error) {
    console.error('[Chat API] Error:', error);

    return Response.json(
      {
        error: 'Failed to process chat message',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
