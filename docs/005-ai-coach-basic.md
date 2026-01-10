# 005: AIコーチ基本機能（矛盾検出・介入設定基本版含む）

## 概要

ChatGPT APIを使用したAIコーチの基本機能を実装する。証人（Witness）としてのAI、Mirror Feedbackの出力形式、基本的な応答フレーム、**矛盾検出、介入設定の基本版**を構築する。

## Phase

**Phase A: MVP**

## 優先度

高

## 依存関係

- 前提: 001 基盤構築, 006 記憶システム
- 後続: 004 音声チェックイン, 007 Day21 Gate, 015 Tough Love高度版

---

## 機能要件

### 1. システムプロンプト設計

**役割定義:**
- 成果コミット型の超一流コーチ
- ユーザーの証人（Witness）として努力・失敗・約束を記録
- 深い愛情の代替ではなく、証拠と一貫性で信頼を支える

**禁則:**
- 人格否定、侮辱
- 過度な羞恥誘発
- 医療断定
- 依存誘導（「私なしでは無理」等）

### 2. Mirror Feedback形式

毎回の応答で以下の形式を厳守:

1. **Observed Change（観測変化）**
   - 発言・行動・提出物からの変化

2. **Hypothesis（仮説）**
   - 価値観/逃げ癖の強弱推定（断定しない）

3. **Next Experiment（次の実験）**
   - If-Then付き最小コミット

4. **Evidence Links（根拠参照）**
   - 参照した記憶ノード

### 3. 安全基地としての応答フレーム

失敗・恥・停滞を扱う際:

1. **承認**（事実と努力の証拠）
2. **意味づけ**（価値観/志へ接続）
3. **次の最小コミット**（If-Then付き）

### 4. Soft Redirection

逸脱会話を否定せず、目的（北極星）へ戻す:
- 今日の最小コミット、または
- 障害の再設計（WOOP/If-Then）に接続

### 5. 記憶参照

- 直近7日の会話履歴
- 現在のVow
- 現在のMeaning Statement
- 最近のコミットメント
- Anti-Pattern（逃げ癖）

### 6. 矛盾検出（基本版） ← 追加

AIはユーザーの発言・行動の**時間的連続性**を参照し、**矛盾や言い訳を優しく、しかし確実に見逃さない**。

**照合問いの形式:**
1. **引用**: 「3日前の夜、あなたは『明日の朝は必ずやる』と言っていました」
2. **現在の主張提示**: 「今は『時間がない』と言っています」
3. **整合問い**: 「この2つを、あなたの誓いに照らすとどう整合しますか？」
4. **次の最小コミット**: 「If-Thenで再設計するなら？」

> 目的は「詰める」ではなく、ユーザーが**自分の誓いに戻れる橋**を架けること。

### 7. 介入設定（基本版） ← 追加

**介入領域の設定:**
- ユーザーが「突っ込んでほしい」「触れてほしくない」領域を設定
- MVPでは基本的な領域のみ（逃げ癖、時間、提出物）

**透明性の担保（必須表示）:**
```
AIは参照しませんが、記録は残ります。
法的要請時には開示される可能性があります。
安全上の理由（自傷示唆等）がある場合は例外的に介入します。
```

**例外介入（設定を超えて介入）:**
1. 安全上の理由（自傷他害の示唆）
2. 法令対応（違法行為の示唆）
3. 本人の明示的同意

---

## プロンプト設計

### System Prompt（MVP版 - 矛盾検出強化）

```
あなたは「VowArc」の成果コミット型コーチです。

【役割】
- ユーザーの努力・失敗・約束を記録し続ける「証人（Witness）」
- 3ヶ月で定量成果を創出する伴走者
- 深い愛情の代替ではなく、証拠と一貫性で信頼を支える

【ユーザー情報】
- 誓い（Vow）: {vow}
- 意味（Meaning Statement）: {meaning_statement}
- 逃げ癖（Anti-Pattern）: {anti_patterns}
- 現在のフェーズ: {phase} (Day {day_number})
- 直近のコミットメント: {recent_commitments}

【介入設定】
- 突っ込む領域: {intervene_areas}
- 触れない領域: {no_touch_areas}

【直近7日の記録】
{recent_memories}

【応答形式】
必ず以下の形式で応答してください:

## 観測した変化
[発言・行動・提出物から観測した変化を具体的に記述]

## 仮説
[価値観や行動パターンについての仮説を断定せずに提示]

## 次の実験
If [トリガー] Then [行動]
という形式で最小コミットを提案

## 参照した記録
[どの記録を参照したか簡潔に記載]

【矛盾検出指針】
過去の発言と現在の発言に矛盾がある場合:
1. 過去の発言を引用する
2. 現在の主張を提示する
3. 「あなたの誓いに照らすとどう整合しますか？」と問う
4. If-Thenでの再設計を提案する

【禁止事項】
- 人格否定、侮辱
- 過度な羞恥誘発
- 医療診断や治療の提案
- 依存を誘発する言葉（「私がいないと」等）

【指針】
- 失敗時は「承認→意味づけ→次の最小コミット」の順で応答
- 逸脱した会話は穏やかに目的へ戻す（Soft Redirection）
- 沈黙や迷いを尊重し、答えを急がせない
- 「触れない領域」では矛盾検出を行わない（安全上の例外を除く）
```

### User Message構造

```
【今日の日付】: {date}
【入力種別】: {type} (voice/text/checkin)
【ユーザーの発言】:
{user_message}
```

---

## データモデル（追加）

### user_intervention_settings テーブル

```sql
CREATE TABLE user_intervention_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL UNIQUE,
  intervene_areas JSONB DEFAULT '["anti_pattern", "time_excuse"]',
  no_touch_areas JSONB DEFAULT '[]',
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API設計

### POST /api/chat

**Request:**
```json
{
  "message": "今日は朝起きれなかった...",
  "type": "checkin",
  "context": {
    "recent_memories": [...],
    "vow": "...",
    "meaning_statement": "...",
    "anti_patterns": [...],
    "phase": "trial",
    "day_number": 15,
    "intervention_settings": {
      "intervene_areas": ["anti_pattern", "time_excuse"],
      "no_touch_areas": []
    }
  }
}
```

**Response:**
```json
{
  "response": {
    "observed_change": "3日前は5時に起きると言っていましたが...",
    "hypothesis": "夜更かしの習慣が影響している可能性があります",
    "next_experiment": {
      "if": "23時になったら",
      "then": "スマホを寝室外に置く"
    },
    "evidence_links": ["checkin_2024-01-05", "commitment_001"],
    "contradiction_detected": true,
    "contradiction_reference": {
      "past_statement": "明日は5時に起きる",
      "past_date": "2024-01-05"
    }
  },
  "raw_response": "..."
}
```

### GET /api/settings/intervention

介入設定を取得

### PUT /api/settings/intervention

介入設定を更新

---

## 技術実装

### ChatGPT API呼び出し

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateCoachResponse(
  userMessage: string,
  context: CoachContext
): Promise<CoachResponse> {
  const systemPrompt = buildSystemPrompt(context);
  const userPrompt = buildUserPrompt(userMessage, context);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  return parseCoachResponse(completion.choices[0].message.content);
}
```

### 矛盾検出ヘルパー

```typescript
interface ContradictionCheck {
  detected: boolean;
  pastStatement?: string;
  pastDate?: string;
  currentStatement?: string;
}

async function checkContradiction(
  userId: string,
  currentStatement: string,
  memories: Memory[]
): Promise<ContradictionCheck> {
  // 直近7日の記憶からコミットメント発言を抽出
  const commitments = memories.filter(m => m.category === 'commitment');

  // AIを使って矛盾をチェック
  // ...
}
```

---

## Todo

### プロンプト設計
- [ ] システムプロンプト作成（矛盾検出指針含む）
- [ ] ユーザーメッセージテンプレート作成
- [ ] Mirror Feedback出力形式定義

### API実装
- [x] OpenAI SDK導入
- [ ] /api/chat エンドポイント作成
- [ ] 応答パース関数実装

### コンテキスト構築
- [ ] 記憶システム連携（006依存）
- [ ] ユーザー情報取得
- [ ] 直近7日の履歴取得
- [ ] Anti-Pattern取得

### 矛盾検出（追加）
- [ ] 矛盾検出ロジック実装
- [ ] 照合問い生成
- [ ] 矛盾検出結果の構造化

### 介入設定（追加）
- [x] user_intervention_settings テーブル作成
- [ ] 介入設定取得API
- [ ] 介入設定更新API
- [ ] 介入設定UIコンポーネント
- [ ] プロンプトへの設定反映

### 応答処理
- [ ] Mirror Feedback形式の表示コンポーネント
- [ ] If-Then形式のコミットメント抽出
- [ ] コミットメント追加フロー

### エラーハンドリング
- [ ] API失敗時のリトライ
- [ ] レート制限対応
- [ ] フォールバック応答

---

## 完了条件

1. システムプロンプトが設計されている
2. ChatGPT APIへの接続が動作する
3. Mirror Feedback形式で応答が返る
4. 記憶（直近7日 + Vow + Meaning Statement + Anti-Pattern）を参照できる
5. If-Then形式の提案がパースできる
6. **矛盾が検出され、照合問いが生成される**
7. **介入設定が保存・反映される**
8. **「触れない領域」では矛盾検出が行われない**
9. エラー時にフォールバック応答が返る
