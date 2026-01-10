import OpenAI from 'openai';

// OpenAI configuration
const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY!;

// Create OpenAI client
export const openai = new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true, // Required for Expo/React Native
});

/**
 * Generate Meaning Statement from onboarding answers
 */
export async function generateMeaningStatement(
  whyAnswer: string,
  painAnswer: string,
  idealAnswer: string
): Promise<string> {
  const prompt = `以下のユーザー回答から、「北極星(Meaning Statement)」を1-2文で生成してください。

【回答】
Why: ${whyAnswer}
Pain: ${painAnswer}
Ideal: ${idealAnswer}

【条件】
- 毎日見て心に響く言葉
- 抽象的すぎず、具体的すぎない
- ユーザー自身の言葉を可能な限り活かす
- 「〜を通じて、〜になる」のような形式

【出力形式】
1-2文のMeaning Statement`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 200,
  });

  return completion.choices[0].message.content || '';
}

/**
 * Generate Vow from onboarding answers
 */
export async function generateVow(
  whyAnswer: string,
  painAnswer: string,
  idealAnswer: string
): Promise<string> {
  const prompt = `以下のユーザー回答から、「誓い(Vow)」を1-2文で生成してください。

【回答】
Why: ${whyAnswer}
Pain: ${painAnswer}
Ideal: ${idealAnswer}

【条件】
- 具体的な行動宣言
- 測定可能な要素を含む
- ユーザーが署名したくなる言葉

【出力形式】
1-2文のVow`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 200,
  });

  return completion.choices[0].message.content || '';
}

/**
 * Extract anti-patterns from pain answer
 */
export async function extractAntiPatterns(painAnswer: string): Promise<string[]> {
  const prompt = `以下のユーザー回答から、「逃げ癖パターン」を抽出してください。

【回答（特にPain）】
Pain: ${painAnswer}

【条件】
- 「〜すると、〜してしまう」形式
- 1-2個程度
- 敵として言語化できるパターン

【出力形式】
JSON配列: ["パターン1", "パターン2"]`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 200,
  });

  const content = completion.choices[0].message.content || '[]';

  try {
    return JSON.parse(content);
  } catch {
    return [];
  }
}
