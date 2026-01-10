# 015: Tough Love / Soft Redirection（高度版）

## 概要

005 AIコーチ基本の矛盾検出・介入を拡張し、Week 4以降のフェーズ別介入強度と高度なTough Loveを実装する。人格否定なしに、価値観と合意に照らした厳しい問いを投げかける。

## Phase

**Phase B: 拡張機能**

## 優先度

低

## 依存関係

- 前提: 005 AIコーチ基本（矛盾検出・介入設定基本版）
- 後続: 016 契約違反プロトコル

---

## 機能要件

### 1. Tough Loveの定義

**本質:**
- "叱る" = 感情的攻撃ではない
- 価値観（美学）と合意（契約）に照らした問い

**例:**
- 「それは君の志に一致している？」
- 「本当にそれでいい？ 卒業すると誓ったはずだ」
- 「3日前、あなたは『絶対にやる』と言っていた。今の選択は、その言葉と整合している？」

**禁止:**
- 侮辱
- 人格攻撃
- 過度な羞恥誘発

### 2. 介入強度レベル

Day 21で合意した設定に基づく:

| レベル | 説明 | 例 |
|-------|------|-----|
| 穏やか | 提案型、選択肢提示 | 「〜という方法もありますね」 |
| 標準 | 質問型、矛盾指摘 | 「〇〇と言っていましたが、今の選択は？」 |
| 強め | 直接型、明確な問い | 「それは君の志に反している。本当にいいのか？」 |

### 3. 介入領域

Day 21で合意した領域のみ介入:

- 逃げ癖（Anti-Pattern発現時）
- 時間言い訳（「時間がない」等の繰り返し）
- 提出物（Evidence未提出が続く）
- 逸脱会話（目的から外れた会話）

### 4. Soft Redirectionの定義

**本質:**
- 逸脱会話を否定しない
- 目的（北極星）へ戻す

**戻し先:**
- 今日の最小コミット、または
- 障害の再設計（WOOP/If-Then）

**例:**
```
ユーザー: 「昨日飲み会があって楽しかったんだ」
AI: 「楽しい時間を過ごせたんですね。
     ところで、今朝の5時起床のコミットはどうでしたか？」
```

---

## フェーズ別強度設計

### Week 4-8（Phase 2）

- Care: 高（維持）
- Challenge: 中
- 対等な共創
- 必要に応じて厳しさ増

### Week 9-12（Phase 3）

- Care: 高（維持）
- Challenge: 高
- 美学・志に照らした厳しい問い
- 成果スプリントへの集中

---

## プロンプト設計

### Tough Love プロンプト（追加指示）

```
【現在のフェーズ】: {phase} (Week {week_number})
【合意された介入設定】:
  - 領域: {intervention_areas}
  - 強度: {intensity_level}

【Tough Love指針】
あなたは今、Phase {phase} にいます。ユーザーとの信頼関係は構築されています。

介入強度「{intensity_level}」に基づき、以下のように応答してください:

穏やかの場合:
- 提案型の言葉を使う
- 選択肢を提示する
- 「〜かもしれませんね」「〜という方法もあります」

標準の場合:
- 質問型で矛盾を指摘する
- 「〇〇と言っていましたが、今の選択はどうですか？」
- 過去の発言を引用して照合する

強めの場合:
- 直接的に問いかける
- 「それは君の志に反している」
- 「本当にこれでいいのか？」
- ただし人格否定は絶対にしない

【介入すべき領域】
{intervention_areas} に関する発言・行動があった場合のみ、上記の強度で介入してください。
それ以外の領域では、標準的なサポートを継続してください。
```

### Soft Redirection プロンプト

```
【Soft Redirection指針】
ユーザーが目的から逸れた会話をしている場合:

1. まず共感・承認する（否定しない）
2. 自然な接続詞で目的に戻す（「ところで」「そういえば」）
3. 戻し先は以下のいずれか:
   - 今日の最小コミット
   - 障害の再設計（If-Thenの見直し）

例:
ユーザー: 「昨日映画見たんだけど面白かったよ」
AI: 「いい気分転換になりましたね。
     ところで、今日の朝のコミット『10分コードを書く』は達成できましたか？」

注意:
- 逸脱を責めない
- 無理に話を切らない
- 自然な流れで戻す
```

---

## 矛盾検出強化

### 照合問いの強化版

Phase 2以降は、矛盾検出後の問いをより直接的に:

```typescript
interface ContradictionResponse {
  // Phase 1（Trial）の場合
  gentle: string;
  // Phase 2（Week 4-8）の場合
  standard: string;
  // Phase 3（Week 9-12）の場合
  direct: string;
}

function generateContradictionResponse(
  pastStatement: string,
  currentStatement: string,
  phase: string,
  intensity: string
): string {
  const base = {
    gentle: `3日前、あなたは「${pastStatement}」と言っていましたね。今は「${currentStatement}」とのこと。どちらがあなたの本心に近いですか？`,
    standard: `「${pastStatement}」と言っていましたが、今は「${currentStatement}」。この2つを、あなたの誓いに照らすとどう整合しますか？`,
    direct: `「${pastStatement}」と誓ったはずだ。今の「${currentStatement}」は、その誓いに反している。本当にこれでいいのか？`,
  };

  // Phase と intensity に基づいて選択
}
```

---

## データモデル

### user_intervention_settings テーブル

```sql
CREATE TABLE user_intervention_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL UNIQUE,
  intensity VARCHAR(20) DEFAULT 'standard', -- 'gentle' | 'standard' | 'strong'
  areas JSONB DEFAULT '[]', -- ['anti_pattern', 'time_excuse', 'evidence', 'off_topic']
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### intervention_logs テーブル

```sql
CREATE TABLE intervention_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'tough_love' | 'soft_redirect' | 'contradiction'
  area VARCHAR(50), -- どの領域に介入したか
  trigger_content TEXT, -- 何がトリガーになったか
  response_content TEXT, -- AIの応答内容
  user_reaction VARCHAR(50), -- 'accepted' | 'rejected' | 'no_response'
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API設計

### PUT /api/settings/intervention

介入設定を更新

**Request:**
```json
{
  "intensity": "standard",
  "areas": ["anti_pattern", "time_excuse"]
}
```

### GET /api/settings/intervention

現在の介入設定を取得

---

## UI設計

### 介入設定画面（Day 21 or 設定）

```
┌─────────────────────────────┐
│  介入設定                    │
├─────────────────────────────┤
│                              │
│  介入強度:                   │
│  [穏やか] [標準] [強め]      │
│       ↑ 選択中               │
│                              │
│  介入する領域:               │
│  ☑ 逃げ癖                    │
│  ☑ 時間言い訳                │
│  ☐ 提出物                    │
│  ☐ 逸脱会話                  │
│                              │
│  ─────────────────────────  │
│  ⚠️ 人格否定は行いません。    │
│  あくまで志と合意に照らした   │
│  問いかけです。              │
│                              │
│           [保存する]          │
└─────────────────────────────┘
```

---

## Todo

### プロンプト設計
- [ ] Tough Loveプロンプト（3段階）
- [ ] Soft Redirectionプロンプト
- [ ] 矛盾検出強化版プロンプト

### データモデル
- [ ] user_intervention_settings テーブル作成
- [ ] intervention_logs テーブル作成

### AI実装
- [ ] Phase判定ロジック
- [ ] 介入設定取得・反映
- [ ] 矛盾検出の強度調整
- [ ] Soft Redirection実装

### UI実装
- [ ] 介入設定画面
- [ ] Day 21での設定フロー連携

### ログ・分析
- [ ] 介入ログの記録
- [ ] ユーザー反応の追跡

---

## 完了条件

1. Phase 2以降で介入強度が上がる
2. ユーザーが合意した領域のみ介入する
3. 合意した強度で問いかけができる
4. 逸脱会話を自然に目的へ戻せる
5. 人格否定なしに厳しい問いができる
6. 介入ログが記録される
