import { openai } from './client';
import { MirrorFeedback } from '@/lib/supabase/types';

/**
 * Generate Mirror Feedback from checkin text using GPT-4
 * Returns 4 elements: Observed Change, Hypothesis, Next Experiment, Evidence Links
 */
export async function generateMirrorFeedback(
  checkinText: string,
  vowContent?: string,
  meaningContent?: string
): Promise<MirrorFeedback> {
  const contextInfo = [
    vowContent && `【誓い (Vow)】\n${vowContent}`,
    meaningContent && `【意味づけ (Meaning Statement)】\n${meaningContent}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const prompt = `あなたはユーザーの変化を支援するコーチです。以下のチェックイン内容から、Mirror Feedbackを生成してください。

${contextInfo ? contextInfo + '\n\n' : ''}【チェックイン内容】
${checkinText}

【Mirror Feedback の4要素】
1. Observed Change (変化の観察):
   - ユーザーの言葉から観察できる変化や行動
   - 具体的で事実ベース

2. Hypothesis (仮説):
   - なぜその変化が起きたのか、あるいは起きなかったのか
   - 可能性のある理由や背景

3. Next Experiment (次の実験):
   - 仮説を検証するための具体的な次のアクション
   - 小さく、実行可能なステップ

4. Evidence Links (エビデンスへのリンク):
   - 現時点では空配列を返す（将来的にエビデンスIDを含める）

【出力形式】
JSON形式で返してください:
{
  "observed_change": "変化の観察（1-2文）",
  "hypothesis": "仮説（1-2文）",
  "next_experiment": "次の実験（1-2文、具体的なアクション）",
  "evidence_links": []
}

【条件】
- 日本語で生成
- ユーザーの言葉を尊重し、押し付けない
- 具体的で実行可能な内容
- ポジティブな変化を強調しつつ、課題にも触れる`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0].message.content || '{"observed_change":"","hypothesis":"","next_experiment":"","evidence_links":[]}';

  try {
    return JSON.parse(content) as MirrorFeedback;
  } catch (error) {
    console.error('Failed to parse Mirror Feedback:', error);
    return {
      observed_change: '',
      hypothesis: '',
      next_experiment: '',
      evidence_links: [],
    };
  }
}
