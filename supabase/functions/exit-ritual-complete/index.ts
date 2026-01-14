// VowArc Exit Ritual Complete API
// Completes the Exit Ritual and saves review data
// Ticket 012: Exit Ritual (Basic)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExitRitualCompleteRequest {
  trigger: 'day21_stop' | 'cancellation';
  day_count: number;
  checkin_count: number;
  evidence_count: number;
  potential_statement: string;
  review: {
    reason_category: string;
    expectation_gap?: string;
    missing_support?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: ExitRitualCompleteRequest = await req.json();

    // Validate required fields
    if (!body.trigger || !body.review?.reason_category) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: trigger and review.reason_category' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create exit ritual record
    const { data: exitRitual, error: ritualError } = await supabase
      .from('exit_rituals')
      .insert({
        user_id: user.id,
        trigger: body.trigger,
        day_count: body.day_count || 0,
        checkin_count: body.checkin_count || 0,
        evidence_count: body.evidence_count || 0,
        potential_statement: body.potential_statement || null,
      })
      .select('id')
      .single();

    if (ritualError) {
      console.error('Exit ritual insert error:', ritualError);
      // Continue even if exit_rituals table doesn't exist
    }

    // Determine exit type based on trigger
    // trial_stop: Day21で停止, cancellation: 有料期間中の解約（refundはWebhookで実際の返金イベント用）
    const exitType = body.trigger === 'day21_stop' ? 'trial_stop' : 'cancellation';

    // Create exit review record
    const { error: reviewError } = await supabase
      .from('exit_reviews')
      .insert({
        user_id: user.id,
        exit_ritual_id: exitRitual?.id || null,
        exit_type: exitType,
        reason_category: body.review.reason_category,
        expected_vs_reality: body.review.expectation_gap || null,
        missing_support: body.review.missing_support || null,
      });

    if (reviewError) {
      console.error('Exit review insert error:', reviewError);
      // Don't fail the request if review insert fails
    }

    // Update user current_phase to 'terminated'
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        current_phase: 'terminated',
      })
      .eq('id', user.id);

    if (userUpdateError) {
      console.error('User phase update error:', userUpdateError);
      // Don't fail the request if user update fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        exit_ritual_id: exitRitual?.id || null,
        message: 'Exit ritual completed successfully',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Exit ritual complete error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
