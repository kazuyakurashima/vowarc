/**
 * Contract Acceptance API
 * Updates user phase to 'trial' and sets trial_start_date
 * This marks the official start of the 3-month journey
 * Also creates initial Cognitive Map nodes from Day0 data
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
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[Accept Contract] Failed to update user:', updateError);
      throw new Error(`Failed to start trial: ${updateError.message}`);
    }

    console.log('[Accept Contract] Trial started successfully');

    // Create initial Cognitive Map nodes from Day0 data
    await createInitialMapNodes(serverClient, userId);

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

/**
 * Create initial Cognitive Map nodes from Day0 data
 * - Vow (from vows table)
 * - Meaning Statement (from meaning_statements table)
 * - Anti-patterns (from onboarding_answers.fear)
 */
async function createInitialMapNodes(serverClient: any, userId: string) {
  try {
    console.log('[Accept Contract] Creating initial map nodes for user:', userId);

    // Fetch vow
    const { data: vow } = await serverClient
      .from('vows')
      .select('content')
      .eq('user_id', userId)
      .eq('is_current', true)
      .single();

    // Fetch meaning statement
    const { data: meaning } = await serverClient
      .from('meaning_statements')
      .select('content')
      .eq('user_id', userId)
      .eq('is_current', true)
      .single();

    // Fetch fear answer (used for anti-patterns)
    const { data: fearAnswer } = await serverClient
      .from('onboarding_answers')
      .select('answer')
      .eq('user_id', userId)
      .eq('question_key', 'fear')
      .single();

    // Prepare nodes to insert
    const nodesToInsert: any[] = [];

    if (vow?.content) {
      nodesToInsert.push({
        user_id: userId,
        type: 'vow',
        content: vow.content,
        source_type: 'day0',
      });
    }

    if (meaning?.content) {
      nodesToInsert.push({
        user_id: userId,
        type: 'meaning',
        content: meaning.content,
        source_type: 'day0',
      });
    }

    // Extract anti-patterns from fear answer
    if (fearAnswer?.answer) {
      // Simple extraction: treat each sentence as an anti-pattern
      const antiPatterns = extractAntiPatterns(fearAnswer.answer);
      for (const pattern of antiPatterns) {
        nodesToInsert.push({
          user_id: userId,
          type: 'anti_pattern',
          content: pattern,
          source_type: 'day0',
        });
      }
    }

    // Insert nodes
    if (nodesToInsert.length > 0) {
      const { error: insertError } = await serverClient
        .from('map_nodes')
        .insert(nodesToInsert);

      if (insertError) {
        console.error('[Accept Contract] Failed to create map nodes:', insertError);
        // Non-blocking error - don't throw, just log
      } else {
        console.log('[Accept Contract] Created', nodesToInsert.length, 'map nodes');
      }
    }
  } catch (error) {
    console.error('[Accept Contract] Error creating map nodes:', error);
    // Non-blocking - don't throw
  }
}

/**
 * Extract anti-patterns from fear answer text
 * Splits by common delimiters and filters meaningful items
 */
function extractAntiPatterns(fearText: string): string[] {
  // Split by common delimiters (newlines, periods, commas, etc.)
  const patterns = fearText
    .split(/[。\n、・]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5 && s.length < 200); // Filter meaningful items

  // Limit to 5 anti-patterns max
  return patterns.slice(0, 5);
}
