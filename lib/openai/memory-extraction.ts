import { openai } from './client';
import { MemoryType } from '@/lib/supabase/types';

interface ExtractionResult {
  memories: {
    content: string;
    type: MemoryType;
    tags: string[];
    confidence: number;
  }[];
}

/**
 * Extract memories from checkin transcript using GPT-4
 */
export async function extractMemoriesFromCheckin(
  transcript: string,
  userId: string
): Promise<ExtractionResult> {
  const prompt = `以下のチェックイン内容から、重要な記憶(Memory)を抽出してください。

【チェックイン内容】
${transcript}

【抽出ルール】
1. Short-term Memory (7日保持):
   - 日常の気づき、小さな変化
   - 行動記録、感情の変化

2. Milestone (永続保存):
   - 重要な決断、転機
   - 大きな達成、失敗からの学び
   - 価値観の変化

【出力形式】
JSON形式で返してください:
{
  "memories": [
    {
      "content": "記憶の内容(1-2文)",
      "type": "short_term" | "milestone",
      "tags": ["タグ1", "タグ2"],
      "confidence": 0.0-1.0
    }
  ]
}

【条件】
- ユーザーの言葉をできるだけそのまま使う
- 抽象的すぎる内容は避ける
- 重複を避ける
- 抽出できるものがなければ空配列を返す`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 800,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0].message.content || '{"memories":[]}';

  try {
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to parse memory extraction:', error);
    return { memories: [] };
  }
}

/**
 * Calculate expiration date for short-term memories
 */
export function calculateExpirationDate(type: MemoryType): Date | null {
  if (type === 'milestone') return null;

  const now = new Date();
  now.setDate(now.getDate() + 7);
  return now;
}
