/**
 * AI Evidence Analysis Service (Ticket 009)
 * Scores evidences for Day21 highlight selection
 */

import OpenAI from 'openai';
import { Evidence } from '@/lib/supabase/types';

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

export interface EvidenceScore {
  evidence_id: string;
  score: number; // 0.00-1.00
  reason: string;
}

export interface EvidenceAnalysisResult {
  scores: EvidenceScore[];
  highlights: EvidenceScore[]; // Top 3 evidences
}

/**
 * Score evidences for Day21 Commitment Report
 *
 * Analyzes all evidences in the context of the user's vow and meaning statement
 * to identify the most impactful ones for Day21 presentation.
 *
 * @param evidences - All evidences to analyze
 * @param vowContent - User's vow (誓い)
 * @param meaningContent - User's meaning statement
 * @returns Scored evidences with top 3 highlights
 */
export async function scoreEvidencesForDay21(
  evidences: Evidence[],
  vowContent?: string,
  meaningContent?: string
): Promise<EvidenceAnalysisResult> {
  try {
    if (evidences.length === 0) {
      return { scores: [], highlights: [] };
    }

    // Prepare evidence summaries for AI
    const evidenceSummaries = evidences.map((e, index) => ({
      index,
      id: e.id,
      type: e.type,
      title: e.title,
      content: e.content || '(画像)',
      date: e.date,
    }));

    const prompt = `あなたは優秀なコーチです。以下のユーザーのエビデンスを分析し、Day21のCommitment Reportで表示するハイライト3つを選定してください。

## ユーザーの背景

**誓い（Vow）:**
${vowContent || '(未設定)'}

**意味づけ（Meaning Statement）:**
${meaningContent || '(未設定)'}

## エビデンス一覧

${evidenceSummaries.map((e, i) => `
${i + 1}. [${getTypeLabel(e.type)}] ${e.title}
   日付: ${e.date}
   内容: ${e.content}
`).join('\n')}

## 採点基準

以下の観点で各エビデンスを0.00〜1.00でスコアリングしてください:

1. **Vowとの関連性**: 誓いの達成にどれだけ直接的に貢献しているか
2. **変化の証明**: Before/Afterや成長が明確に見える証拠か
3. **インパクト**: 困難を乗り越えた証拠、重要なマイルストーンか
4. **時系列の重要性**: トライアル期間の重要なタイミングか（初期/中期/直近）

## 出力形式

各エビデンスのスコアと理由をJSON形式で返してください:

{
  "scores": [
    {
      "evidence_id": "エビデンスID",
      "score": 0.85,
      "reason": "スコアの理由（1-2文）"
    }
  ]
}

**重要**: 必ずJSONのみを返してください。説明文は不要です。`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'あなたは優秀なコーチです。ユーザーの成長エビデンスを分析し、Day21で表示すべきハイライトを選定します。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('AI response is empty');
    }

    const result = JSON.parse(content);

    // Validate and normalize scores
    const scores: EvidenceScore[] = result.scores.map((s: any) => ({
      evidence_id: s.evidence_id,
      score: Math.max(0, Math.min(1, s.score)), // Clamp to 0-1
      reason: s.reason || '',
    }));

    // Get top 3 highlights
    const highlights = [...scores]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return { scores, highlights };
  } catch (error) {
    console.error('Error scoring evidences:', error);
    throw new Error('エビデンスの分析に失敗しました');
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'image':
      return '画像';
    case 'url':
      return 'URL';
    case 'note':
      return 'メモ';
    default:
      return 'その他';
  }
}
