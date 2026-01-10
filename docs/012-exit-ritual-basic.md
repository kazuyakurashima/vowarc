# 012: Exit Ritual（基本版）

## 概要

Day 21での停止選択時、または有料期間中の解約時に、誠実に関係を閉じるExit Ritualの基本版を実装する。学びを回収し、解約レビューを取得する。

## Phase

**Phase A: MVP**

## 優先度

中

## 依存関係

- 前提: 007 Day21 Judgment Gate
- 後続: なし（MVP完結）

---

## 機能要件（MVP版）

### 1. Exit Ritual のタイミング

- Day 21で「停止」を選択した場合
- 有料期間中に「解約」を選択した場合

### 2. 基本フロー

```
[停止/解約選択] → [学び回収レポート] → [解約レビュー] → [完了]
```

### 3. 学び回収レポート（簡易版）

**表示内容:**
- 参加期間と経過日数
- チェックイン回数
- Evidence数
- AIが見ていた可能性（1文）

### 4. 解約レビュー（必須）

**理由カテゴリ:**
- 効果を感じなかった
- 時間が確保できなかった
- 金銭的な理由
- 他のサービスを使う
- 目標を達成した
- その他

**追加質問（任意）:**
- 期待との差
- 欲しかったサポート

### 5. 誠実なクロージング

**表示メッセージ:**
```
あなたの可能性はまだここにあります。
いつか再び挑戦したくなった時、ここで待っています。
```

---

## UI設計（MVP版）

### 学び回収レポート画面

```
┌─────────────────────────────┐
│  ここまでの旅を振り返る      │
├─────────────────────────────┤
│                              │
│  📊 あなたの歩み             │
│  ├ 参加期間: 21日間          │
│  ├ チェックイン: 18回        │
│  └ Evidence: 5件             │
│                              │
│  🔮 AIが見ていた可能性       │
│  "あなたには継続する力がある。│
│   チェックイン継続率が        │
│   それを示しています。"      │
│                              │
│  ─────────────────────────  │
│  この経験は無駄ではありません。│
│                              │
│           [次へ]             │
└─────────────────────────────┘
```

### 解約レビュー画面

```
┌─────────────────────────────┐
│  最後に教えてください        │
├─────────────────────────────┤
│                              │
│  停止/解約の理由:            │
│  ○ 効果を感じなかった        │
│  ○ 時間が確保できなかった    │
│  ○ 金銭的な理由              │
│  ○ 他のサービスを使う        │
│  ○ 目標を達成した            │
│  ○ その他                    │
│                              │
│  期待との差（任意）:         │
│  [________________]          │
│                              │
│  欲しかったサポート（任意）:  │
│  [________________]          │
│                              │
│           [送信]             │
└─────────────────────────────┘
```

### 完了画面

```
┌─────────────────────────────┐
│  ありがとうございました      │
├─────────────────────────────┤
│                              │
│  あなたの可能性は            │
│  まだここにあります。        │
│                              │
│  いつか再び挑戦したくなった  │
│  時、ここで待っています。    │
│                              │
│           [閉じる]           │
└─────────────────────────────┘
```

---

## データモデル

### exit_rituals テーブル

```sql
CREATE TABLE exit_rituals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  trigger VARCHAR(50) NOT NULL, -- 'day21_stop' | 'cancellation'
  day_count INTEGER NOT NULL,
  checkin_count INTEGER NOT NULL,
  evidence_count INTEGER NOT NULL,
  potential_statement TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### cancellation_reviews テーブル（008で定義済み、拡張）

```sql
CREATE TABLE cancellation_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  exit_ritual_id UUID REFERENCES exit_rituals(id),
  reason_category VARCHAR(100) NOT NULL,
  expectation_gap TEXT,
  missing_support TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API設計

### GET /api/exit-ritual/summary

Exit Ritual用のサマリーデータを取得

**Response:**
```json
{
  "day_count": 21,
  "checkin_count": 18,
  "evidence_count": 5,
  "potential_statement": "あなたには継続する力がある。チェックイン継続率がそれを示しています。"
}
```

### POST /api/exit-ritual/complete

Exit Ritualを完了

**Request:**
```json
{
  "trigger": "day21_stop",
  "review": {
    "reason_category": "時間が確保できなかった",
    "expectation_gap": "...",
    "missing_support": "..."
  }
}
```

---

## Potential Statement生成

```typescript
async function generatePotentialStatement(
  userId: string,
  metrics: ExitMetrics
): Promise<string> {
  const prompt = `
以下のユーザーの実績から、可能性を示す1文を生成してください。

【実績】
- 参加期間: ${metrics.day_count}日
- チェックイン回数: ${metrics.checkin_count}回
- Evidence提出: ${metrics.evidence_count}件

【条件】
- ポジティブだが過度でない
- 具体的な数値を引用する
- 将来への可能性を示唆する
- 1文で簡潔に

【出力形式】
1文のPotential Statement
`;

  // AI生成
}
```

---

## Todo

### データモデル
- [ ] exit_rituals テーブル作成
- [ ] cancellation_reviews テーブル拡張（exit_ritual_id追加）

### サマリー生成
- [ ] 期間・回数の計算
- [ ] Potential Statement生成（AI）

### UI実装
- [ ] 学び回収レポート画面
- [ ] 解約レビュー画面
- [ ] 完了画面

### API実装
- [ ] GET /api/exit-ritual/summary
- [ ] POST /api/exit-ritual/complete

### 連携
- [ ] Day21からの遷移
- [ ] 解約画面からの遷移
- [ ] ユーザーフェーズ更新（terminated）

---

## 完了条件

1. Day21停止時にExit Ritualが表示される
2. 学び回収レポートが表示される
3. 解約レビューが必須入力される
4. Potential Statementが生成される
5. 誠実なクロージングメッセージが表示される
6. ユーザーフェーズが適切に更新される
