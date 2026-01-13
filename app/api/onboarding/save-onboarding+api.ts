/**
 * Onboarding Save API
 * Saves all onboarding data: answers, Meaning Statement, Vow, Anti-Patterns
 * Note: Phase transition to 'trial' happens after contract acceptance
 */

import { getServerClient } from '@/lib/supabase';
import { extractAntiPatterns } from '@/lib/openai/anti-pattern-extraction';

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
      console.error('[Save Onboarding] Auth verification failed:', authError);
      return Response.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    const userId = userData.user.id;

    // Parse request body
    const {
      answers, // { why, pain, ideal }
      meaningStatement,
      vow,
    } = await request.json();

    // Validate input
    if (!answers?.why || !answers?.pain || !answers?.ideal) {
      return Response.json(
        { error: 'Missing required fields: answers (why, pain, ideal)' },
        { status: 400 }
      );
    }

    if (!meaningStatement || !vow) {
      return Response.json(
        { error: 'Missing required fields: meaningStatement, vow' },
        { status: 400 }
      );
    }

    console.log('[Save Onboarding] Saving for user:', userId);

    // 1. Save onboarding answers
    console.log('[Save Onboarding] Saving answers...');
    const answerPromises = [
      serverClient.from('onboarding_answers').insert({
        user_id: userId,
        question_key: 'why',
        answer: answers.why,
        input_type: 'text',
      }),
      serverClient.from('onboarding_answers').insert({
        user_id: userId,
        question_key: 'pain',
        answer: answers.pain,
        input_type: 'text',
      }),
      serverClient.from('onboarding_answers').insert({
        user_id: userId,
        question_key: 'ideal',
        answer: answers.ideal,
        input_type: 'text',
      }),
    ];

    await Promise.all(answerPromises);

    // 2. Save Meaning Statement (version 1)
    console.log('[Save Onboarding] Saving Meaning Statement...');
    const { data: meaningData, error: meaningError } = await serverClient
      .from('meaning_statements')
      .insert({
        user_id: userId,
        content: meaningStatement,
        version: 1,
        is_current: true,
      })
      .select()
      .single();

    if (meaningError) {
      throw new Error(`Failed to save Meaning Statement: ${meaningError.message}`);
    }

    // 3. Save Vow (version 1)
    console.log('[Save Onboarding] Saving Vow...');
    const { data: vowData, error: vowError } = await serverClient
      .from('vows')
      .insert({
        user_id: userId,
        content: vow,
        version: 1,
        is_current: true,
      })
      .select()
      .single();

    if (vowError) {
      throw new Error(`Failed to save Vow: ${vowError.message}`);
    }

    // 4. Extract and save Anti-Patterns
    console.log('[Save Onboarding] Extracting Anti-Patterns...');
    let antiPatternCount = 0;

    try {
      const antiPatterns = await extractAntiPatterns(answers.pain);

      if (antiPatterns.length > 0) {
        console.log(
          `[Save Onboarding] Saving ${antiPatterns.length} Anti-Patterns...`
        );

        const memoryInserts = antiPatterns.map((ap) => ({
          user_id: userId,
          memory_type: 'milestone' as const,
          category: 'anti_pattern',
          content: ap.pattern,
          confidence_score: ap.confidence,
          source_type: 'onboarding' as const,
          is_mutable: true,
        }));

        const { error: memoryError } = await serverClient
          .from('memories')
          .insert(memoryInserts);

        if (memoryError) {
          console.error('[Save Onboarding] Failed to save Anti-Patterns:', memoryError);
          // Non-blocking error - continue
        } else {
          antiPatternCount = antiPatterns.length;
        }
      }
    } catch (error) {
      console.error('[Save Onboarding] Anti-Pattern extraction failed:', error);
      // Non-blocking error - continue
    }

    console.log('[Save Onboarding] Onboarding data saved successfully');

    return Response.json({
      success: true,
      meaningStatementId: meaningData.id,
      vowId: vowData.id,
      antiPatternCount,
    });
  } catch (error) {
    console.error('[Save Onboarding] Error:', error);

    return Response.json(
      {
        error: 'Failed to save onboarding data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
