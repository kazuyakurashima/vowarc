/**
 * Checkin Save API Endpoint (Ticket 004)
 * Saves checkin and triggers memory extraction
 */

import { getServerClient } from '@/lib/supabase';
import { extractMemoriesFromCheckin, calculateExpirationDate } from '@/lib/openai/memory-extraction';

interface SaveCheckinRequest {
  content: string;
  audioUrl?: string;
  ifThenTriggered: boolean | null;
  type: 'text' | 'voice';
  mirrorFeedback?: {
    observedChange: string;
    hypothesis: string;
    nextExperiment: string;
    evidenceLinks: string[];
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

    // Verify token and get user using service role client
    const serverClient = getServerClient();
    const { data: userData, error: authError } = await serverClient.auth.getUser(token);

    if (authError || !userData.user) {
      console.error('Auth verification failed:', authError);
      return Response.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    // Use authenticated userId (from JWT) instead of request body
    const userId = userData.user.id;

    const body: SaveCheckinRequest = await request.json();
    const { content, audioUrl, ifThenTriggered, type, mirrorFeedback } = body;

    // Validate input
    if (!content || !type) {
      return Response.json(
        { error: 'Invalid request: content and type are required' },
        { status: 400 }
      );
    }

    if (type !== 'text' && type !== 'voice') {
      return Response.json(
        { error: 'Invalid type: must be "text" or "voice"' },
        { status: 400 }
      );
    }

    // Insert checkin to database using service role client (bypasses RLS)
    // Note: serverClient already initialized above for auth verification
    const { data: checkin, error: insertError } = await serverClient
      .from('checkins')
      .insert({
        user_id: userId,
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        content,
        transcript: content, // For backward compatibility with existing schema
        audio_url: audioUrl || null,
        if_then_triggered: ifThenTriggered,
        type,
        mirror_feedback: mirrorFeedback || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting checkin:', insertError);
      return Response.json(
        { error: 'Failed to save checkin', message: insertError.message },
        { status: 500 }
      );
    }

    // Trigger memory extraction synchronously (await for serverless compatibility)
    // Note: In serverless environments (Vercel/Netlify), fire-and-forget patterns
    // may be interrupted after response is sent. We await to ensure completion.
    try {
      await extractMemoriesAsync(checkin.id, content, userId);
    } catch (error) {
      console.error('Memory extraction failed (non-blocking error):', error);
      // Non-blocking: Don't fail the checkin if memory extraction fails
      // Failed extraction will be handled by cron job in future
    }

    return Response.json({
      success: true,
      checkin: {
        id: checkin.id,
      },
      message: 'Checkin saved successfully.',
    });
  } catch (error) {
    console.error('Error in checkin save API:', error);

    return Response.json(
      {
        error: 'Failed to save checkin',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Memory extraction (synchronous for serverless compatibility)
 * Calls AI service directly instead of HTTP to avoid auth complexity
 * Note: Awaited in main handler to ensure completion before serverless shutdown
 */
async function extractMemoriesAsync(
  checkinId: string,
  transcript: string,
  userId: string
): Promise<void> {
  try {
    // Extract memories using AI service directly
    const { memories } = await extractMemoriesFromCheckin(transcript, userId);

    if (memories.length === 0) {
      console.log(`No memories extracted from checkin ${checkinId}`);
      return;
    }

    // Insert memories to database using service role client
    const serverClient = getServerClient();
    const memoriesToInsert = memories.map(memory => ({
      user_id: userId,
      content: memory.content,
      memory_type: memory.type,
      source_type: 'checkin' as const,
      source_id: checkinId,
      tags: memory.tags,
      confidence_score: memory.confidence,
      expires_at: calculateExpirationDate(memory.type)?.toISOString(),
    }));

    const { error: insertError } = await serverClient
      .from('memories')
      .insert(memoriesToInsert);

    if (insertError) {
      console.error('Failed to insert memories:', insertError);
      throw insertError;
    }

    console.log(`Memory extraction completed for checkin ${checkinId}: ${memories.length} memories`);
  } catch (error) {
    console.error('Error in memory extraction:', error);
    throw error;
  }
}
