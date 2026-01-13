import { extractMemoriesFromCheckin, calculateExpirationDate } from '@/lib/openai/memory-extraction';
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
      console.error('Auth verification failed:', authError);
      return Response.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    // User is authenticated, extract userId from JWT
    const userId = userData.user.id;

    const { checkinId, transcript } = await request.json();

    // Validate input
    if (!checkinId || !transcript) {
      return Response.json(
        { error: 'Missing required fields: checkinId and transcript' },
        { status: 400 }
      );
    }

    // Extract memories using AI (server-side only - protects OpenAI API key)
    const { memories } = await extractMemoriesFromCheckin(transcript, userId);

    // Insert memories to database server-side using service role client (bypasses RLS)
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

    if (memoriesToInsert.length > 0) {
      const { error: insertError } = await serverClient
        .from('memories')
        .insert(memoriesToInsert);

      if (insertError) {
        console.error('Failed to insert memories:', insertError);
        return Response.json(
          { error: 'Failed to save memories' },
          { status: 500 }
        );
      }
    }

    return Response.json({
      success: true,
      count: memoriesToInsert.length,
    });

  } catch (error) {
    console.error('Memory extraction failed:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
