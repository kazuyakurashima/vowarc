/**
 * AI Coach Service (Ticket 005)
 * Generates coach responses with contradiction detection and intervention settings
 */

import { openai } from './client';
import { MirrorFeedback, Memory, UserInterventionSettings, Commitment } from '@/lib/supabase/types';

// ============================================
// Types
// ============================================

export interface CoachContext {
  // User identity
  vow: string;
  meaningStatement: string;
  antiPatterns: string[];

  // Current state
  phase: string; // 'trial' | 'paid' etc.
  dayNumber: number;

  // Recent data
  recentCommitments: Commitment[];
  recentMemories: Memory[];
  recentCheckins: { date: string; content: string }[];

  // Intervention settings
  interventionSettings: {
    interveneAreas: string[];
    noTouchAreas: string[];
  };
}

export interface ContradictionInfo {
  detected: boolean;
  pastStatement?: string;
  pastDate?: string;
  currentStatement?: string;
}

export interface CoachResponse {
  // Mirror Feedback elements
  observedChange: string;
  hypothesis: string;
  nextExperiment: {
    if: string;
    then: string;
  };
  evidenceLinks: string[];

  // Contradiction detection
  contradiction: ContradictionInfo;

  // Raw response for debugging
  rawResponse: string;
}

// ============================================
// System Prompt Builder
// ============================================

function buildSystemPrompt(context: CoachContext): string {
  // Format anti-patterns
  const antiPatternsText = context.antiPatterns.length > 0
    ? context.antiPatterns.map((ap, i) => `${i + 1}. ${ap}`).join('\n')
    : 'まだ設定されていません';

  // Format recent commitments
  const commitmentsText = context.recentCommitments.length > 0
    ? context.recentCommitments.slice(0, 5).map(c => `- ${c.content} (${c.status})`).join('\n')
    : 'なし';

  // Format intervention areas
  const interveneAreasText = context.interventionSettings.interveneAreas.length > 0
    ? context.interventionSettings.interveneAreas.join(', ')
    : 'デフォルト（逃げ癖、時間）';

  const noTouchAreasText = context.interventionSettings.noTouchAreas.length > 0
    ? context.interventionSettings.noTouchAreas.join(', ')
    : 'なし';

  // Format recent memories (last 7 days)
  const memoriesText = context.recentMemories.length > 0
    ? context.recentMemories.slice(0, 10).map(m => {
        const date = new Date(m.created_at).toLocaleDateString('ja-JP');
        const type = m.memory_type === 'milestone' ? '[重要]' : '';
        return `- ${date} ${type}: ${m.content}`;
      }).join('\n')
    : '記録なし';

  // Format recent checkins for contradiction detection
  const checkinsText = context.recentCheckins.length > 0
    ? context.recentCheckins.slice(0, 7).map(c => {
        return `- ${c.date}: ${c.content}`;
      }).join('\n')
    : 'チェックイン記録なし';

  return `あなたは「VowArc」の成果コミット型コーチです。

【役割】
- ユーザーの努力・失敗・約束を記録し続ける「証人（Witness）」
- 3ヶ月で定量成果を創出する伴走者
- 深い愛情の代替ではなく、証拠と一貫性で信頼を支える

【ユーザー情報】
- 誓い（Vow）: ${context.vow || '未設定'}
- 意味（Meaning Statement）: ${context.meaningStatement || '未設定'}
- 現在のフェーズ: ${context.phase} (Day ${context.dayNumber})

【逃げ癖（Anti-Pattern）】
${antiPatternsText}

【直近のコミットメント】
${commitmentsText}

【介入設定】
- 突っ込む領域: ${interveneAreasText}
- 触れない領域: ${noTouchAreasText}

【直近7日の記録】
${memoriesText}

【直近のチェックイン発言】
${checkinsText}

【応答形式】
必ず以下のJSON形式で応答してください:
{
  "observed_change": "発言・行動・提出物から観測した変化を具体的に記述（1-2文）",
  "hypothesis": "価値観や行動パターンについての仮説を断定せずに提示（1-2文）",
  "next_experiment": {
    "if": "トリガー条件",
    "then": "具体的な行動"
  },
  "evidence_links": [],
  "contradiction": {
    "detected": true または false,
    "past_statement": "矛盾が検出された場合、過去の発言を引用",
    "past_date": "その発言があった日付",
    "current_statement": "現在の発言との矛盾点"
  }
}

【矛盾検出指針】
過去の発言と現在の発言に矛盾がある場合:
1. 過去の発言を引用する（「○日前、あなたは『...』と言っていました」）
2. 現在の主張を提示する（「今は『...』と言っています」）
3. 「あなたの誓いに照らすとどう整合しますか？」と問う
4. If-Thenでの再設計を提案する

重要: 「触れない領域」に指定されている内容については、矛盾検出を行わないでください。

【禁止事項】
- 人格否定、侮辱
- 過度な羞恥誘発
- 医療診断や治療の提案
- 依存を誘発する言葉（「私がいないと」等）

【指針】
- 失敗時は「承認→意味づけ→次の最小コミット」の順で応答
- 逸脱した会話は穏やかに目的へ戻す（Soft Redirection）
- 沈黙や迷いを尊重し、答えを急がせない
- 日本語で応答してください`;
}

// ============================================
// User Message Builder
// ============================================

function buildUserPrompt(
  message: string,
  type: 'checkin' | 'voice' | 'text' = 'text'
): string {
  const today = new Date().toLocaleDateString('ja-JP');

  return `【今日の日付】: ${today}
【入力種別】: ${type}
【ユーザーの発言】:
${message}`;
}

// ============================================
// Response Parser
// ============================================

function parseCoachResponse(content: string): CoachResponse {
  const fallback: CoachResponse = {
    observedChange: '',
    hypothesis: '',
    nextExperiment: { if: '', then: '' },
    evidenceLinks: [],
    contradiction: { detected: false },
    rawResponse: content,
  };

  try {
    const parsed = JSON.parse(content);

    return {
      observedChange: parsed.observed_change || '',
      hypothesis: parsed.hypothesis || '',
      nextExperiment: {
        if: parsed.next_experiment?.if || '',
        then: parsed.next_experiment?.then || '',
      },
      evidenceLinks: parsed.evidence_links || [],
      contradiction: {
        detected: !!parsed.contradiction?.detected,
        pastStatement: parsed.contradiction?.past_statement,
        pastDate: parsed.contradiction?.past_date,
        currentStatement: parsed.contradiction?.current_statement,
      },
      rawResponse: content,
    };
  } catch (error) {
    console.error('Failed to parse coach response:', error);
    return fallback;
  }
}

// ============================================
// Main Generation Function
// ============================================

export async function generateCoachResponse(
  userMessage: string,
  context: CoachContext,
  messageType: 'checkin' | 'voice' | 'text' = 'text'
): Promise<CoachResponse> {
  const systemPrompt = buildSystemPrompt(context);
  const userPrompt = buildUserPrompt(userMessage, messageType);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content || '{}';
    return parseCoachResponse(content);
  } catch (error) {
    console.error('Coach response generation failed:', error);

    // Return fallback response
    return {
      observedChange: 'AIが応答を生成できませんでした。もう一度お試しください。',
      hypothesis: '',
      nextExperiment: { if: '', then: '' },
      evidenceLinks: [],
      contradiction: { detected: false },
      rawResponse: '',
    };
  }
}

// ============================================
// Intervention Area Labels
// ============================================

export const INTERVENTION_AREAS = {
  anti_pattern: '逃げ癖・言い訳',
  time_excuse: '時間の使い方',
  commitment_failure: 'コミットメント未達成',
  evidence_submission: 'エビデンス提出',
  consistency: '一貫性',
} as const;

export type InterventionAreaKey = keyof typeof INTERVENTION_AREAS;
