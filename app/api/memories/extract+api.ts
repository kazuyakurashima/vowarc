import { extractMemoriesFromCheckin, calculateExpirationDate } from '@/lib/openai/memory-extraction';

export async function POST(request: Request) {
  try {
    const { checkinId, transcript, userId } = await request.json();

    // Validate input
    if (!checkinId || !transcript || !userId) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Extract memories using AI (server-side only - protects OpenAI API key)
    const { memories } = await extractMemoriesFromCheckin(transcript, userId);

    // Return extracted memories to client for insertion
    // Client will insert using authenticated Supabase client (RLS-safe)
    const memoriesToInsert = memories.map(memory => ({
      content: memory.content,
      memory_type: memory.type,
      source_type: 'checkin' as const,
      source_id: checkinId,
      tags: memory.tags,
      confidence_score: memory.confidence,
      expires_at: calculateExpirationDate(memory.type)?.toISOString(),
    }));

    return Response.json({
      success: true,
      count: memoriesToInsert.length,
      memories: memoriesToInsert,
    });

  } catch (error) {
    console.error('Memory extraction failed:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
