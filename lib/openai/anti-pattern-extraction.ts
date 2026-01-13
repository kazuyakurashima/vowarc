/**
 * Anti-Pattern Extraction Service
 * Extracts anti-patterns (逃げ癖) from user's pain points
 */

import { openai } from './client';

export interface AntiPattern {
  pattern: string;
  confidence: number;
}

/**
 * Extract anti-patterns from user's pain answer
 */
export async function extractAntiPatterns(
  painAnswer: string
): Promise<AntiPattern[]> {
  const prompt = `以下のユーザー回答から、「逃げ癖パターン（Anti-Pattern）」を抽出してください。

【ユーザー回答（痛み・障害）】
${painAnswer}

---

【Anti-Patternの要件】
- 「〜すると、〜してしまう」形式
- 1-3個程度
- 敵として言語化できるパターン
- ユーザーが認識できる具体的な行動パターン

【出力形式（JSON）】
{
  "antiPatterns": [
    {
      "pattern": "締め切りが近づくと、逃げてしまう",
      "confidence": 0.8
    },
    {
      "pattern": "難しいと感じると、先延ばしにしてしまう",
      "confidence": 0.7
    }
  ]
}

confidence（信頼度）は0.0〜1.0の範囲で、ユーザーの回答から明確に読み取れるほど高くなります。`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content:
          'あなたは行動分析の専門家です。ユーザーの言葉から、具体的な「逃げ癖パターン（Anti-Pattern）」を抽出します。',
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
    throw new Error('Failed to extract anti-patterns');
  }

  const result = JSON.parse(content);

  // confidence >= 0.6 のパターンのみ返す
  return result.antiPatterns.filter((ap: AntiPattern) => ap.confidence >= 0.6);
}
