/**
 * Meaning Statement & Vow Generation Service
 * Generates Meaning Statement and Vow from onboarding answers
 */

import { openai } from './client';

export interface OnboardingAnswers {
  why: string;
  pain: string;
  ideal: string;
}

export interface MeaningAndVow {
  meaningStatement: string;
  vow: string;
}

/**
 * Generate Meaning Statement and Vow from user's onboarding answers
 */
export async function generateMeaningAndVow(
  answers: OnboardingAnswers
): Promise<MeaningAndVow> {
  const prompt = `以下のユーザー回答から、「北極星（Meaning Statement）」と「誓い（Vow）」を生成してください。

【ユーザー回答】
Why（なぜ変わろうと思ったか）: ${answers.why}

Pain（何が止めてきたか）: ${answers.pain}

Ideal（3ヶ月後の理想の姿）: ${answers.ideal}

---

【Meaning Statement（北極星）の要件】
- 1-2文で表現
- 毎日見て心に響く言葉
- 抽象的すぎず、具体的すぎない
- ユーザー自身の言葉を可能な限り活かす
- 「〜を通じて、〜になる」のような形式

【Vow（誓い）の要件】
- 1-2文で表現
- 具体的な行動宣言
- 測定可能な要素を含む
- ユーザーが署名したくなる言葉

【出力形式（JSON）】
{
  "meaningStatement": "...",
  "vow": "..."
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'あなたはコーチングの専門家です。ユーザーの言葉から、心に響く「北極星（Meaning Statement）」と「誓い（Vow）」を生成します。',
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
    throw new Error('Failed to generate Meaning Statement and Vow');
  }

  let result: { meaningStatement?: string; vow?: string };
  try {
    result = JSON.parse(content);
  } catch (parseError) {
    console.error('Failed to parse OpenAI response:', content);
    throw new Error('AIからの応答を解析できませんでした。もう一度お試しください。');
  }

  // Validate required fields
  if (!result.meaningStatement || !result.vow) {
    console.error('Invalid response structure:', result);
    throw new Error('AIからの応答が不完全でした。もう一度お試しください。');
  }

  return {
    meaningStatement: result.meaningStatement,
    vow: result.vow,
  };
}
