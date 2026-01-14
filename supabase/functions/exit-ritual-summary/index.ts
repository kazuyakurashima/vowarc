// VowArc Exit Ritual Summary API
// Returns summary data for Exit Ritual (day count, checkin count, evidence count, potential statement)
// Ticket 012: Exit Ritual (Basic)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExitSummary {
  day_count: number;
  checkin_count: number;
  evidence_count: number;
  potential_statement: string;
  meaning_statement: string | null;
  vow_content: string | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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

    // Get exit ritual summary using helper function
    const { data: summaryData, error: summaryError } = await supabase
      .rpc('get_exit_ritual_summary', { p_user_id: user.id });

    if (summaryError) {
      console.error('Summary fetch error:', summaryError);
      // Fallback to direct query if function doesn't exist
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, trial_start_date, created_at')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      // Get checkin count
      const { count: checkinCount } = await supabase
        .from('checkins')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get evidence count
      const { count: evidenceCount } = await supabase
        .from('evidences')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get meaning statement (is_current, not is_active)
      const { data: meaningData } = await supabase
        .from('meaning_statements')
        .select('content')
        .eq('user_id', user.id)
        .eq('is_current', true)
        .single();

      // Get vow (is_current, not is_active)
      const { data: vowData } = await supabase
        .from('vows')
        .select('content')
        .eq('user_id', user.id)
        .eq('is_current', true)
        .single();

      // Calculate day count based on trial_start_date (fallback to created_at)
      const startDate = userData.trial_start_date
        ? new Date(userData.trial_start_date)
        : new Date(userData.created_at);
      const now = new Date();
      const dayCount = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Generate potential statement
      const potentialStatement = await generatePotentialStatement({
        day_count: dayCount,
        checkin_count: checkinCount || 0,
        evidence_count: evidenceCount || 0,
        meaning_statement: meaningData?.content || null,
      });

      const summary: ExitSummary = {
        day_count: dayCount,
        checkin_count: checkinCount || 0,
        evidence_count: evidenceCount || 0,
        potential_statement: potentialStatement,
        meaning_statement: meaningData?.content || null,
        vow_content: vowData?.content || null,
      };

      return new Response(
        JSON.stringify(summary),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const row = summaryData?.[0] || {
      day_count: 0,
      checkin_count: 0,
      evidence_count: 0,
      meaning_statement: null,
      vow_content: null,
    };

    // Generate potential statement using AI
    const potentialStatement = await generatePotentialStatement({
      day_count: row.day_count,
      checkin_count: row.checkin_count,
      evidence_count: row.evidence_count,
      meaning_statement: row.meaning_statement,
    });

    const summary: ExitSummary = {
      day_count: row.day_count || 0,
      checkin_count: row.checkin_count || 0,
      evidence_count: row.evidence_count || 0,
      potential_statement: potentialStatement,
      meaning_statement: row.meaning_statement,
      vow_content: row.vow_content,
    };

    return new Response(
      JSON.stringify(summary),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Exit ritual summary error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

interface PotentialStatementInput {
  day_count: number;
  checkin_count: number;
  evidence_count: number;
  meaning_statement: string | null;
}

async function generatePotentialStatement(metrics: PotentialStatementInput): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

  // Fallback if no API key
  if (!openaiApiKey) {
    return generateFallbackStatement(metrics);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `あなたは誠実なAIコーチです。
ユーザーがアプリを停止する際に、これまでの取り組みを認め、将来の可能性を示唆する1文を生成してください。

条件:
- ポジティブだが過度でない
- 具体的な数値を自然に引用する
- 将来への可能性を示唆する
- 1文で40文字以内
- 日本語で出力`,
          },
          {
            role: 'user',
            content: `以下の実績から可能性を示す1文を生成してください。

参加期間: ${metrics.day_count}日
チェックイン回数: ${metrics.checkin_count}回
Evidence提出: ${metrics.evidence_count}件
${metrics.meaning_statement ? `Meaning Statement: ${metrics.meaning_statement}` : ''}`,
          },
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || generateFallbackStatement(metrics);
  } catch (error) {
    console.error('Potential statement generation error:', error);
    return generateFallbackStatement(metrics);
  }
}

function generateFallbackStatement(metrics: PotentialStatementInput): string {
  const { day_count, checkin_count } = metrics;

  if (checkin_count === 0) {
    return 'この一歩を踏み出したこと自体が、変化への意志の証です。';
  }

  const rate = day_count > 0 ? Math.round((checkin_count / day_count) * 100) : 0;

  if (rate >= 80) {
    return `${day_count}日間、${checkin_count}回のチェックインを続けたあなたには、継続する力があります。`;
  } else if (rate >= 50) {
    return `${checkin_count}回の対話を重ねた経験は、次の挑戦の土台になります。`;
  } else {
    return '自分と向き合おうとした時間は、決して無駄ではありません。';
  }
}
