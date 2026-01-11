/**
 * Evidence Analysis API Endpoint (Ticket 009)
 * Analyzes evidences for Day21 highlight selection
 */

import { scoreEvidencesForDay21 } from '@/lib/openai/evidence-analysis';
import { Evidence } from '@/lib/supabase/types';

export async function POST(request: Request) {
  try {
    const { evidences, vowContent, meaningContent } = await request.json();

    // Validate input
    if (!evidences || !Array.isArray(evidences)) {
      return Response.json(
        { error: 'Invalid request: evidences array is required' },
        { status: 400 }
      );
    }

    // Score evidences using AI
    const result = await scoreEvidencesForDay21(
      evidences as Evidence[],
      vowContent,
      meaningContent
    );

    return Response.json({
      success: true,
      scores: result.scores,
      highlights: result.highlights,
    });
  } catch (error) {
    console.error('Error in evidence analysis API:', error);

    return Response.json(
      {
        error: 'Failed to analyze evidences',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
