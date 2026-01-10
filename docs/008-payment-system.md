# 008: 課金システム（一括払い）

## 概要

Day 10の決済情報登録（任意）とDay 21の**一括課金**を実装する。儀式体験と課金を分離し、ダークパターンを回避する設計。

## Phase

**Phase A: MVP**

## 優先度

高

## 依存関係

- 前提: 007 Day21 Judgment Gate
- 後続: なし（MVP完結）

---

## 機能要件

### 1. 3段階のコミットメント・エスカレーション

```
Day 0        Day 10              Day 21
  │            │                   │
  ▼            ▼                   ▼
[開始]      [決済情報登録]      [儀式 → 一括課金]
最小入力     課金はしない        継続選択で9週間分一括
```

### 2. Day 10 決済情報登録（任意）

**トリガー:**
- 10日目のチェックイン完了時にモーダル表示

**必須表示文言:**
```
10日間、あなたは戻ってきました。
Day 21に継続を選んだ場合に備え、決済情報をお預かりします。
この時点では課金されません。いつでも取り消せます。
```

**オプトアウト設計:**
- 「後で登録」ボタンを明示
- スキップした場合、Day 21の継続選択時に登録を求める

### 3. Day 21 一括課金

**画面分離（重要）:**
```
[儀式完了] → [継続を選択] → [決済確認画面] → [一括課金]
              ↓
         [停止を選択] → [Exit Ritual]
```

**決済確認画面の表示項目:**
- 課金額（9週間分の一括払い、明示）
- 決済情報（Day 10登録済みの場合は表示、未登録の場合は入力）
- 「課金を確定する」ボタン（能動的選択）

### 4. 解約・返金

- 有料期間中はいつでも解約可能
- 解約時レビュー入力必須
- 返金ポリシーの明示（日割り返金など）

---

## 課金モデル

### 料金設定（MVP）

| 項目 | 期間 | 価格 |
|-----|------|------|
| トライアル | Day 1-21（3週間） | 無料 |
| 有料期間 | Week 4-12（9週間） | **¥19,800（一括払い）** |

### 課金タイミング

- **Day 21に継続を選択した時点で9週間分を一括課金**
- サブスクリプションではなく、1回の決済で完結

### 返金ポリシー

| 解約タイミング | 返金額 |
|--------------|--------|
| Week 4-5 | 残り7週間分の日割り返金 |
| Week 6-8 | 残り週数の日割り返金 |
| Week 9-12 | 返金なし（最終スプリント期間） |

> 返金は「罰」ではなく、双方が本気で改善し続けるための「誠実な終わり方」として設計する。

---

## 技術選定

### 決済プロバイダ

**推奨: Stripe（PaymentIntent）**
- 一括払いに最適
- React Native対応（@stripe/stripe-react-native）
- 日本円対応

**代替: RevenueCat**
- App Store / Google Play課金の統合
- 一括購入（Non-consumable）にも対応

---

## データモデル

### payment_methods テーブル

```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  stripe_payment_method_id VARCHAR(255) NOT NULL,
  card_last4 VARCHAR(4),
  card_brand VARCHAR(50),
  is_default BOOLEAN DEFAULT true,
  registered_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);
```

### payments テーブル

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  amount INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'jpy',
  status VARCHAR(50) NOT NULL, -- 'succeeded' | 'failed' | 'refunded' | 'partially_refunded'
  refunded_amount INTEGER DEFAULT 0,
  paid_period_weeks INTEGER DEFAULT 9, -- 支払い対象週数
  created_at TIMESTAMP DEFAULT NOW()
);
```

### cancellation_reviews テーブル

```sql
CREATE TABLE cancellation_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  payment_id UUID REFERENCES payments(id),
  reason_category VARCHAR(100) NOT NULL,
  free_text TEXT,
  expected_vs_reality TEXT,
  missing_support TEXT,
  refund_amount INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API設計

### POST /api/payment/setup-intent

決済情報登録用のSetupIntent作成

**Response:**
```json
{
  "clientSecret": "seti_xxx_secret_xxx"
}
```

### POST /api/payment/save-method

決済情報を保存

**Request:**
```json
{
  "paymentMethodId": "pm_xxx"
}
```

### POST /api/payment/charge

Day 21で一括課金を実行

**Request:**
```json
{
  "paymentMethodId": "pm_xxx", // Day 10で登録済みの場合は不要
  "amount": 19800 // 金額（円）
}
```

**Response:**
```json
{
  "paymentId": "pay_xxx",
  "status": "succeeded",
  "amount": 19800
}
```

### POST /api/payment/refund

解約時の返金処理

**Request:**
```json
{
  "paymentId": "pay_xxx",
  "review": {
    "reason_category": "効果を感じなかった",
    "free_text": "...",
    "expected_vs_reality": "...",
    "missing_support": "..."
  }
}
```

**Response:**
```json
{
  "refundedAmount": 8800,
  "remainingWeeks": 4,
  "status": "partially_refunded"
}
```

---

## Stripe実装

### Setup Intent（Day 10）

```typescript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createSetupIntent(customerId: string) {
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
  });
  return setupIntent.client_secret;
}
```

### 一括課金（Day 21）

```typescript
export async function chargeOneTime(
  customerId: string,
  paymentMethodId: string,
  amount: number
) {
  // デフォルト支払い方法を設定
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  // PaymentIntent作成＆確定（一括払い）
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: 'jpy',
    customer: customerId,
    payment_method: paymentMethodId,
    confirm: true,
    description: 'VowArc 有料期間（9週間）',
  });

  return paymentIntent;
}
```

### 返金処理

```typescript
export async function processRefund(
  paymentIntentId: string,
  refundAmount: number
) {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: refundAmount,
  });

  return refund;
}

// 返金額計算
export function calculateRefundAmount(
  totalAmount: number,
  paidWeeks: number,
  usedWeeks: number
): number {
  const remainingWeeks = paidWeeks - usedWeeks;
  if (remainingWeeks <= 0) return 0;

  // Week 9-12は返金なし
  if (usedWeeks >= 6) return 0;

  // 日割り計算
  const weeklyRate = totalAmount / paidWeeks;
  return Math.floor(weeklyRate * remainingWeeks);
}
```

---

## UI設計

### Day 10 モーダル

```
┌─────────────────────────────┐
│  10日間、戻ってきました      │
├─────────────────────────────┤
│                              │
│  Day 21に継続を選んだ場合    │
│  に備え、決済情報を           │
│  お預かりします。             │
│                              │
│  この時点では課金されません   │
│  いつでも取り消せます         │
│                              │
│  [カード情報を入力]           │
│                              │
│  または                       │
│                              │
│  [後で登録]                   │
│                              │
└─────────────────────────────┘
```

### Day 21 決済確認

```
┌─────────────────────────────┐
│  課金の確認                  │
├─────────────────────────────┤
│                              │
│  プラン: VowArc 有料プラン   │
│  期間: Week 4-12 (9週間)     │
│                              │
│  ┌───────────────────────┐  │
│  │  一括払い: ¥19,800     │  │
│  └───────────────────────┘  │
│                              │
│  💳 **** **** **** 1234      │
│     [別のカードを使う]        │
│                              │
│  ─────────────────────────  │
│  解約時は残り期間に応じて     │
│  日割り返金いたします。        │
│  あなたの誓いへの投資です。    │
│                              │
│  [課金を確定する]             │
│                              │
└─────────────────────────────┘
```

---

## Todo

### Stripe設定
- [ ] Stripeアカウント設定
- [ ] 商品設定（一括払い用）
- [ ] Webhook設定

### データベース
- [ ] payment_methods テーブル作成
- [ ] payments テーブル作成
- [ ] cancellation_reviews テーブル作成

### Day 10 実装
- [ ] SetupIntent API
- [ ] 決済情報入力モーダル
- [ ] カード保存処理
- [ ] スキップ処理

### Day 21 実装
- [ ] 決済確認画面
- [ ] 一括課金API（PaymentIntent）
- [ ] 課金成功/失敗ハンドリング
- [ ] ユーザーフェーズ更新

### 解約・返金実装
- [ ] 解約画面
- [ ] 解約レビューフォーム
- [ ] 返金額計算ロジック
- [ ] 返金処理API

### Webhook
- [ ] payment_intent.succeeded
- [ ] charge.refunded

---

## 完了条件

1. Day 10に決済情報を任意で登録できる
2. Day 10でスキップした場合、Day 21で登録を求められる
3. Day 21で**9週間分を一括課金**できる
4. 課金成功後にcurrent_phaseがpaidに更新される
5. 有料期間中に解約できる
6. 解約時に**日割り返金**が計算・実行される
7. 解約時にレビューが記録される
8. Webhookで課金イベントが正しく処理される
