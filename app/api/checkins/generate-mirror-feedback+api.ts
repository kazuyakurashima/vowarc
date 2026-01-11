import { generateMirrorFeedback } from '@/lib/openai/mirror-feedback';

export async function POST(request: Request) {
  try {
    const { checkinText, vowContent, meaningContent } = await request.json();

    // Validate input
    if (!checkinText) {
      return Response.json(
        { error: 'Missing checkinText' },
        { status: 400 }
      );
    }

    // Generate Mirror Feedback using AI (server-side only - protects OpenAI API key)
    // vowContent and meaningContent are optional context from client
    const mirrorFeedback = await generateMirrorFeedback(
      checkinText,
      vowContent,
      meaningContent
    );

    return Response.json({
      success: true,
      mirrorFeedback,
    });

  } catch (error) {
    console.error('Mirror Feedback generation failed:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
