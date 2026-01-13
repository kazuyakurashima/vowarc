/**
 * Meaning Statement & Vow Generation API
 * Generates Meaning Statement and Vow from onboarding answers
 */

import { generateMeaningAndVow } from '@/lib/openai/meaning-generation';
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
      console.error('[Generate Meaning] Auth verification failed:', authError);
      return Response.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    // Parse request body
    const { why, pain, ideal } = await request.json();

    // Validate input
    if (!why || !pain || !ideal) {
      return Response.json(
        { error: 'Missing required fields: why, pain, ideal' },
        { status: 400 }
      );
    }

    console.log('[Generate Meaning] Generating for user:', userData.user.id);

    // Generate Meaning Statement and Vow
    const { meaningStatement, vow } = await generateMeaningAndVow({
      why,
      pain,
      ideal,
    });

    console.log('[Generate Meaning] Generation successful');

    return Response.json({
      success: true,
      meaningStatement,
      vow,
    });
  } catch (error) {
    console.error('[Generate Meaning] Error:', error);

    return Response.json(
      {
        error: 'Failed to generate Meaning Statement and Vow',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
