# 008: 課金システム（9週間パッケージ）

## 概要

Day 21の継続選択時に**9週間コーチングパッケージ**を一括購入する。自動更新なし、解約不要、期間終了で自動的にアクセス終了。ユーザーにとって最も安心・安全な設計。

## Phase

**Phase A: MVP**

## 優先度

高

## 依存関係

- 前提: 007 Day21 Judgment Gate
- 後続: なし（MVP完結）

---

## ⚠️ プラットフォーム制約と設計判断

### Apple IAP の重要な制約

**Auto-Renewable Subscription はサーバーから解約できない**

```
❌ サーバーからできること:
   - revokeEntitlements → アクセス権剥奪のみ
   - 課金自体は停止できない

⚠️ 問題点:
   - 9週間後もユーザーが手動解約しなければ課金継続
   - 「知らないうちに課金された」クレームリスク
   - ダークパターンと誤解される可能性
```

### 安心・安全な設計選択

**Non-Renewing Subscription（非更新サブスクリプション）を採用**

```
✅ ユーザーメリット:
   - 一度購入したら追加課金なし
   - 解約手続き不要（自動更新なし）
   - 「忘れて課金され続ける」リスクゼロ
   - 明確な期間（9週間）で自動終了
   - 卒業後に再チャレンジ可能

✅ 運営メリット:
   - サブスク解約忘れのクレーム対応不要
   - App Store審査で時間制限アクセスとして認識される
   - シンプルな実装（RENEWAL等のイベント不要）
   - 再購入による継続収益が可能

❌ Non-Consumableを使わない理由:
   - 永久所有が前提 → 9週間終了でリジェクトリスク
   - 再購入不可 → 卒業後の再チャレンジ不可
```

### リリース戦略

```
Phase 1: iOS先行リリース
├── TestFlight ベータテスト
├── App Store 公開
└── RevenueCat + Non-Renewing Subscription

Phase 2: Android展開（テスター15人達成後）
├── Google Play Console 設定
├── 同じRevenueCat設定を利用
└── 追加コード変更は最小限
```

---

## 機能要件

### 1. 買い切りモデル

```
Day 0              Day 21                    Week 12
  │                  │                         │
  ▼                  ▼                         ▼
[開始]           [9週間パッケージ購入]      [自動終了]
最小入力          ¥19,800（一括）           卒業 or 延長選択
                 解約手続き不要
```

### 2. Day 21 パッケージ購入

**画面分離（重要）:**
```
[儀式完了] → [継続を選択] → [購入確認画面] → [IAP購入]
              ↓
         [停止を選択] → [Exit Ritual]
```

**購入確認画面の表示項目:**
- 料金（¥19,800、一括払い）
- 期間（9週間のアクセス権）
- **解約手続き不要**であること
- 「9週間パッケージを購入」ボタン → Apple/Google支払いシート表示
- キャンセルオプション

### 3. 期間終了

**自動的にアクセス終了:**
- サーバー側で購入日から63日（9週間）を計算
- 期限到達でアクセス権自動終了
- 追加課金なし（買い切りなので）
- ユーザーに「卒業おめでとう」通知

**途中離脱の場合:**
- 購入後にアプリを使わなくなっても追加課金なし
- 返金はApple/Googleサポート経由（標準ポリシー）

### 4. 卒業後の選択肢（Week 12終了時）

```
[9週間完了] → [卒業画面]
                  ├── [卒業する] → Exit Ritual（成功版）
                  └── [再チャレンジ] → 同じパッケージを再購入可能
```

> **Non-Renewing Subscriptionの利点:**
> 期限切れ後に同じ商品を再購入できるため、
> 「卒業後に再チャレンジしたい」ユーザーに対応可能。

---

## 課金モデル

### 料金設定（MVP）

| 項目 | 期間 | 価格 |
|-----|------|------|
| トライアル | Day 1-21（3週間） | 無料 |
| 有料期間 | Week 4-12（9週間） | **¥19,800（一括払い）** |

### IAP商品タイプ

**Non-Renewing Subscription（非更新サブスクリプション）**
- 一度購入で9週間のアクセス権
- 自動更新なし、解約手続き不要
- サーバー側で有効期限を管理
- 期限切れで自動的にアクセス終了
- **期限切れ後に再購入可能**（再チャレンジ対応）

```
Product ID: vowark_coaching_9weeks
Price: ¥19,800
Duration: 9 weeks (63 days) - server managed
Type: Non-Renewing Subscription
```

> **Non-Renewing vs Auto-Renewable の違い:**
> - Auto-Renewable: ユーザーが解約しない限り自動更新（解約忘れリスク）
> - Non-Renewing: 自動更新なし、期限切れ後に手動で再購入（安心）

### 有効期限管理ロジック

```typescript
// サーバー側で期限を管理
// purchased_at + 63 days = expires_at

// アクセス権チェック（毎リクエスト or ログイン時）
const isActive = (purchase: Purchase) => {
  const expiresAt = new Date(purchase.purchased_at);
  expiresAt.setDate(expiresAt.getDate() + 63);
  return new Date() < expiresAt;
};

// Cron Job（毎日実行）- 期限切れ通知
SELECT user_id, purchase_id
FROM purchases
WHERE status = 'active'
  AND expires_at <= NOW();

// 期限切れユーザーにステータス更新 + 卒業通知
```

### 返金ポリシー

| 状況 | 対応 |
|------|------|
| 購入後すぐに不満 | Apple/Googleサポートへ返金申請 |
| 途中で使わなくなった | 追加課金なし（買い切りなので安心） |
| 9週間完走 | 返金不可（正常利用完了） |

> **ユーザーメリット:**
> - 一度払えば追加課金の心配なし
> - 解約を忘れて課金される心配なし
> - 合わなくても「損した」のは一度だけ

---

## 技術選定

### 決済プロバイダ

**RevenueCat（必須）**
- App Store / Google Play課金の統合
- React Native SDK完備（react-native-purchases）
- 日本円対応
- Webhook連携でSupabaseと同期

**Stripeは使用しない理由:**
- iOSアプリでのデジタルコンテンツ販売には使用不可（Apple規約違反）
- 物理商品やウェブサービスのみ対応

---

## データモデル

### purchases テーブル

```sql
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,

  -- RevenueCat identifiers
  revenuecat_app_user_id VARCHAR(255) NOT NULL,
  revenuecat_transaction_id VARCHAR(255) UNIQUE,

  -- Product info
  product_id VARCHAR(100) NOT NULL, -- 'vowark_coaching_9weeks'
  store VARCHAR(20) NOT NULL, -- 'app_store' | 'play_store'

  -- Status
  status VARCHAR(50) NOT NULL, -- 'active' | 'expired' | 'refunded'

  -- Pricing
  price_paid INTEGER NOT NULL, -- 19800 (円)
  currency VARCHAR(3) DEFAULT 'jpy',

  -- Dates
  purchased_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL, -- purchased_at + 63 days
  refunded_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_purchases_status ON purchases(status);
CREATE INDEX idx_purchases_expires ON purchases(expires_at)
  WHERE status = 'active';

-- 有効な購入があるかチェックするビュー
CREATE VIEW active_purchases AS
SELECT * FROM purchases
WHERE status = 'active' AND expires_at > NOW();
```

### webhook_events テーブル（冪等性管理）

```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id VARCHAR(255) NOT NULL,        -- RevenueCat event ID
  event_type VARCHAR(100) NOT NULL,      -- 'INITIAL_PURCHASE', 'REFUND', etc.
  transaction_id VARCHAR(255),           -- 関連するtransaction_id
  status VARCHAR(20) NOT NULL DEFAULT 'processing', -- 'processing' | 'completed' | 'failed'
  error_message TEXT,                    -- 失敗時のエラーメッセージ
  processed_at TIMESTAMP,                -- 処理完了時刻（NULL = 未完了）
  started_at TIMESTAMP DEFAULT NOW(),    -- 処理開始時刻（タイムアウト判定用）
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(event_id, event_type)  -- 同じイベントタイプの重複を防ぐ
);

CREATE INDEX idx_webhook_events_lookup ON webhook_events(event_id, event_type);
CREATE INDEX idx_webhook_events_failed ON webhook_events(status) WHERE status = 'failed';
CREATE INDEX idx_webhook_events_stale ON webhook_events(status, started_at)
  WHERE status = 'processing';  -- stale processing検出用
```

> **冪等性と再試行の重要性:**
> - REFUND イベントは元の購入と同じ transaction_id を持つ
> - transaction_id のみでの重複チェックでは REFUND が処理されない
> - event_id + event_type の組み合わせで正確な重複防止
> - **completed → 200 で早期リターン**（処理済み）
> - **processing（非stale） → 202 で早期リターン**（別リクエストが処理中）
> - **failed/stale processing → 再試行許可**（楽観的ロックで競合防止）
> - **processing が5分以上続く場合はタイムアウト（stale）扱い**
> - **新規INSERT時は `ignoreDuplicates: true`** でDO NOTHING on conflict
>   - INSERT成功 → 処理を実行
>   - INSERT失敗（競合） → 競合行を再取得して状態に応じた処理

### exit_reviews テーブル

```sql
CREATE TABLE exit_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  purchase_id UUID REFERENCES purchases(id),  -- 関連する購入（あれば）
  exit_type VARCHAR(50) NOT NULL,             -- 'graduation' | 'trial_stop' | 'refund'
  reason_category VARCHAR(100),
  free_text TEXT,
  expected_vs_reality TEXT,
  missing_support TEXT,
  learnings TEXT,                             -- 学び（Exit Ritual用）
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_exit_reviews_user ON exit_reviews(user_id);
```

> **テーブル名の統一:**
> - `cancellation_reviews` → `exit_reviews` に統一
> - Exit Ritual（卒業・停止）と返金レビューを同じテーブルで管理
> - `exit_type` で種別を区別

---

## RevenueCat設定

### 1. Dashboard設定

```
RevenueCat Dashboard
├── Project: VowArk
├── Apps:
│   ├── iOS: vowark-ios (App Store Connect連携)
│   └── Android: vowark-android (Google Play連携) ← Phase 2
├── Products:
│   └── vowark_coaching_9weeks (9週間パッケージ)
├── Entitlements:
│   └── pro_access (full coaching features)
└── Webhooks:
    └── https://your-domain.com/api/webhooks/revenuecat
```

### 2. App Store Connect設定（Phase 1）

```
App Store Connect
├── In-App Purchases
│   └── vowark_coaching_9weeks
│       ├── Type: Non-Renewing Subscription ← 専用タイプを使用
│       ├── Reference Name: VowArk 9週間コーチング
│       ├── Product ID: vowark_coaching_9weeks
│       ├── Duration: Server-managed (63 days)
│       └── Price: ¥19,800
└── Sandbox Testers
    └── テスト用アカウント設定
```

> **重要:** App Store Connectには「Non-Renewing Subscription」という
> **専用のIAPタイプ**が存在します。Non-Consumableではありません。
> - 期限切れ後に同じ商品を再購入可能
> - サーバー側で有効期限を管理
> - App Store Server Notificationsは送信されない（RevenueCat Webhook経由で処理）

### 3. Google Play Console設定（Phase 2）

```
Google Play Console
├── Monetization > In-app products
│   └── vowark_coaching_9weeks
│       ├── Type: One-time product (Consumable設定)
│       ├── Product ID: vowark_coaching_9weeks
│       ├── Duration: Server-managed (63 days)
│       └── Price: ¥19,800
└── License Testing
    └── テスト用Gmailアカウント設定
```

> **重要:** Google PlayにはNon-Renewing Subscriptionの直接対応がないため、
> **Consumable（消耗型）として設定**します。
> - 期限切れ時にRevenueCatが自動的に「consume」処理
> - これにより同じ商品の再購入が可能になる
> - RevenueCatがiOS/Androidの差異を吸収

---

## API設計

### POST /api/webhooks/revenuecat

RevenueCatからのWebhook受信（購入・返金イベント）

**Headers:**
```
Authorization: Bearer YOUR_REVENUECAT_WEBHOOK_SECRET
```

**Events（Non-Renewing Subscriptionで発生するもの）:**
- `INITIAL_PURCHASE` - 新規購入
- `NON_RENEWING_PURCHASE` - Non-Renewing Subscription購入
- `REFUND` - 返金

```typescript
// app/api/webhooks/revenuecat+api.ts

const PROCESSING_TIMEOUT_MS = 5 * 60 * 1000; // 5分

// stale processing を判定するヘルパー
function isStaleProcessing(startedAt: string | null): boolean {
  if (!startedAt) return true; // started_at がない場合は stale 扱い
  const started = new Date(startedAt).getTime();
  return Date.now() - started > PROCESSING_TIMEOUT_MS;
}

export async function POST(request: Request) {
  const signature = request.headers.get('Authorization');

  // Webhook署名検証
  if (!verifyWebhookSignature(signature)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const event = await request.json();
  const transactionId = event.original_transaction_id;
  const eventType = event.type;
  const eventId = event.id; // RevenueCat event ID

  // イベント単位の冪等性チェック（event_id + event_type）
  // ⚠️ .maybeSingle() を使用（該当なしでもエラーにならない）
  const { data: existingEvent, error: selectError } = await supabase
    .from('webhook_events')
    .select('id, status, started_at')
    .eq('event_id', eventId)
    .eq('event_type', eventType)
    .maybeSingle();

  if (selectError) {
    console.error('Failed to check existing event:', selectError);
    return new Response('Database error', { status: 500 });
  }

  // 処理完了済みのイベントはスキップ
  if (existingEvent?.status === 'completed') {
    return new Response('Event already processed', { status: 200 });
  }

  // processing 状態の場合：タイムアウト判定
  if (existingEvent?.status === 'processing') {
    if (!isStaleProcessing(existingEvent.started_at)) {
      // まだタイムアウトしていない → 別リクエストが処理中
      return new Response('Event is being processed', { status: 202 });
    }
    // タイムアウト → 監視用に failed_timeout をログし、再試行を許可
    console.warn(`Stale processing detected for event ${eventId}, marking as timed out`);

    // 可観測性向上: stale状態を failed_timeout として記録
    // started_at も条件に含めることで、別リクエストが処理を再開した場合の上書きを防ぐ
    await supabase
      .from('webhook_events')
      .update({
        status: 'failed',
        error_message: `Processing timed out after ${PROCESSING_TIMEOUT_MS / 1000}s`,
      })
      .eq('id', existingEvent.id)
      .eq('status', 'processing')
      .eq('started_at', existingEvent.started_at);  // 楽観的ロック: started_at も一致を確認
    // ↑ 更新結果は無視（他リクエストが先に更新していても問題ない）
  }

  // 処理中/失敗のイベントを記録または更新
  let webhookEventId: string;
  const now = new Date().toISOString();

  if (existingEvent) {
    // 既存の失敗/stale イベントを再試行（条件付き更新で競合を防ぐ）
    webhookEventId = existingEvent.id;
    const { data: updateResult, error: updateError } = await supabase
      .from('webhook_events')
      .update({
        status: 'processing',
        error_message: null,
        started_at: now,  // 開始時刻をリセット
      })
      .eq('id', webhookEventId)
      .eq('status', existingEvent.status)  // 楽観的ロック: 状態が変わっていないことを確認
      .select('id')
      .maybeSingle();

    if (updateError) {
      console.error('Failed to update event:', updateError);
      return new Response('Database error', { status: 500 });
    }

    // 更新できなかった = 別リクエストが先にロックを取得
    if (!updateResult) {
      return new Response('Event is being processed by another request', { status: 202 });
    }
  } else {
    // 新規イベントを記録（INSERT ON CONFLICT DO NOTHINGで競合を検出）
    // ignoreDuplicates: true を使用し、競合時は null が返される
    const { data: insertResult, error: insertError } = await supabase
      .from('webhook_events')
      .upsert(
        {
          event_id: eventId,
          event_type: eventType,
          transaction_id: transactionId,
          status: 'processing',
          started_at: now,
        },
        {
          onConflict: 'event_id,event_type',
          ignoreDuplicates: true,  // DO NOTHING on conflict
        }
      )
      .select('id')
      .maybeSingle();

    if (insertError) {
      console.error('Failed to record event:', insertError);
      return new Response('Database error', { status: 500 });
    }

    // 競合が発生した場合（別リクエストがSELECTとINSERTの間に挿入）
    if (!insertResult) {
      // 競合した行の状態を確認
      const { data: conflictedRow, error: conflictSelectError } = await supabase
        .from('webhook_events')
        .select('id, status, started_at')
        .eq('event_id', eventId)
        .eq('event_type', eventType)
        .maybeSingle();

      // DB/RLSエラーの場合は500を返す（409扱いにしない）
      if (conflictSelectError) {
        console.error('Failed to fetch conflicted row:', conflictSelectError);
        return new Response('Database error', { status: 500 });
      }

      if (!conflictedRow) {
        // 競合行が見つからない（削除された？）→ 再試行を促す
        return new Response('Conflict detected, please retry', { status: 409 });
      }

      if (conflictedRow.status === 'completed') {
        return new Response('Event already processed', { status: 200 });
      }

      if (conflictedRow.status === 'processing') {
        if (!isStaleProcessing(conflictedRow.started_at)) {
          // 別リクエストが処理中
          return new Response('Event is being processed', { status: 202 });
        }
        // stale → failed に更新して再試行を許可（再帰的にPOSTを呼ぶことで処理）
        await supabase
          .from('webhook_events')
          .update({
            status: 'failed',
            error_message: `Processing timed out after ${PROCESSING_TIMEOUT_MS / 1000}s (detected via insert conflict)`,
          })
          .eq('id', conflictedRow.id)
          .eq('status', 'processing');
        return new Response('Stale processing detected, please retry', { status: 409 });
      }

      // failed 状態 → 再試行を促す（次回リクエストで処理される）
      return new Response('Previous attempt failed, please retry', { status: 409 });
    }

    webhookEventId = insertResult.id;
  }

  try {
    switch (eventType) {
      case 'INITIAL_PURCHASE':
      case 'NON_RENEWING_PURCHASE':
        await handlePurchase(event);
        break;
      case 'REFUND':
        await handleRefund(event);
        break;
    }

    // 処理成功 → 完了マーク
    await supabase
      .from('webhook_events')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', webhookEventId);

    return new Response('OK', { status: 200 });
  } catch (error: any) {
    // 処理失敗 → 失敗マーク（再試行可能）
    await supabase
      .from('webhook_events')
      .update({
        status: 'failed',
        error_message: error.message || 'Unknown error',
      })
      .eq('id', webhookEventId);

    console.error('Webhook processing failed:', error);
    return new Response('Processing failed', { status: 500 });
  }
}

async function handlePurchase(event: any) {
  const purchasedAt = new Date(event.purchase_date);
  const expiresAt = new Date(purchasedAt);
  expiresAt.setDate(expiresAt.getDate() + 63); // 9週間後

  await supabase.from('purchases').insert({
    user_id: event.app_user_id, // Supabase user ID
    revenuecat_app_user_id: event.app_user_id,
    revenuecat_transaction_id: event.original_transaction_id,
    product_id: event.product_id,
    store: event.store,
    status: 'active',
    price_paid: 19800,
    purchased_at: purchasedAt.toISOString(),
    expires_at: expiresAt.toISOString(),
  });

  // ユーザーフェーズを paid に更新
  await supabase
    .from('users')
    .update({ current_phase: 'paid' })
    .eq('id', event.app_user_id);
}

async function handleRefund(event: any) {
  const transactionId = event.original_transaction_id;

  // 対象の購入を取得
  const { data: purchase } = await supabase
    .from('purchases')
    .select('*')
    .eq('revenuecat_transaction_id', transactionId)
    .single();

  if (!purchase) {
    console.error('Purchase not found for refund:', transactionId);
    return;
  }

  // 購入ステータスを refunded に更新
  await supabase
    .from('purchases')
    .update({
      status: 'refunded',
      refunded_at: new Date().toISOString(),
    })
    .eq('id', purchase.id);

  // ユーザーフェーズを trial に戻す
  await supabase
    .from('users')
    .update({ current_phase: 'trial' })
    .eq('id', purchase.user_id);

  // 返金レビューを記録（オプション：後でExit Ritual UIから入力）
  await supabase.from('exit_reviews').insert({
    user_id: purchase.user_id,
    purchase_id: purchase.id,
    exit_type: 'refund',
  });
}
```

### GET /api/purchase/status

現在の購入状態取得

**Response:**
```json
{
  "hasPurchase": true,
  "isActive": true,
  "purchasedAt": "2026-01-21T00:00:00Z",
  "expiresAt": "2026-03-25T00:00:00Z",
  "daysRemaining": 63,
  "productId": "vowark_coaching_9weeks"
}
```

### POST /api/purchase/check-expiry (Cron Job)

期限切れ購入のステータス更新と卒業通知

```typescript
// app/api/purchase/check-expiry+api.ts
// Cron: 毎日 00:00 UTC に実行

export async function POST(request: Request) {
  // Cron認証ヘッダー検証
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createServiceRoleClient();

  // 期限切れ購入を取得
  const { data: expiredPurchases } = await supabase
    .from('purchases')
    .select('*')
    .eq('status', 'active')
    .lte('expires_at', new Date().toISOString());

  for (const purchase of expiredPurchases || []) {
    // DB更新（ステータスをexpiredに）
    await supabase
      .from('purchases')
      .update({ status: 'expired' })
      .eq('id', purchase.id);

    // ユーザーフェーズを graduated に更新
    await supabase
      .from('users')
      .update({ current_phase: 'graduated' })
      .eq('id', purchase.user_id);

    // 卒業通知送信（プッシュ通知）
    await sendGraduationNotification(purchase.user_id);
  }

  return new Response(JSON.stringify({ processed: expiredPurchases?.length || 0 }), {
    status: 200,
  });
}
```

---

## クライアント実装

### RevenueCat SDK設定

```typescript
// lib/revenuecat/client.ts
import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

const API_KEYS = {
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY!,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY!,
};

export async function initializePurchases(userId: string) {
  const apiKey = Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android;

  Purchases.configure({
    apiKey,
    appUserID: userId, // Supabase user ID
  });
}

export async function purchase9WeekPackage(): Promise<boolean> {
  try {
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages.find(
      p => p.product.identifier === 'vowark_coaching_9weeks'
    );

    if (!pkg) {
      throw new Error('9-week package not found');
    }

    const { customerInfo } = await Purchases.purchasePackage(pkg);

    // 購入成功 - entitlementがアクティブか確認
    return customerInfo.entitlements.active['pro_access'] !== undefined;
  } catch (error: any) {
    if (error.userCancelled) {
      return false; // ユーザーキャンセル
    }
    throw error;
  }
}

export async function checkPurchaseStatus(): Promise<{
  hasPurchase: boolean;
  isActive: boolean;
}> {
  const customerInfo = await Purchases.getCustomerInfo();
  const entitlement = customerInfo.entitlements.active['pro_access'];

  return {
    hasPurchase: !!entitlement,
    isActive: !!entitlement,
  };
}

export async function restorePurchases(): Promise<boolean> {
  const customerInfo = await Purchases.restorePurchases();
  return customerInfo.entitlements.active['pro_access'] !== undefined;
}
```

### 購入フック

```typescript
// hooks/data/usePurchase.ts
import { useState, useEffect } from 'react';
import {
  checkPurchaseStatus,
  purchase9WeekPackage,
  restorePurchases
} from '@/lib/revenuecat/client';

interface PurchaseState {
  hasPurchase: boolean;
  isActive: boolean;
  purchasedAt: Date | null;
  expiresAt: Date | null;
  daysRemaining: number;
}

export function usePurchase() {
  const [state, setState] = useState<PurchaseState>({
    hasPurchase: false,
    isActive: false,
    purchasedAt: null,
    expiresAt: null,
    daysRemaining: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      // サーバーから詳細取得（これが信頼できるソース）
      const response = await fetch('/api/purchase/status');
      const serverStatus = await response.json();

      // RevenueCatからステータス取得（購入復元用）
      const rcStatus = await checkPurchaseStatus();

      // ⚠️ 重要: サーバーの isActive を優先
      // Non-Renewing Subscriptionはサーバー側で期限管理するため、
      // RevenueCatのentitlementより正確
      setState({
        hasPurchase: serverStatus.hasPurchase || rcStatus.hasPurchase,
        isActive: serverStatus.isActive,  // ← サーバーが信頼できるソース
        purchasedAt: serverStatus.purchasedAt
          ? new Date(serverStatus.purchasedAt)
          : null,
        expiresAt: serverStatus.expiresAt
          ? new Date(serverStatus.expiresAt)
          : null,
        daysRemaining: serverStatus.daysRemaining || 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const purchase = async () => {
    const success = await purchase9WeekPackage();
    if (success) {
      await loadStatus();
    }
    return success;
  };

  const restore = async () => {
    const success = await restorePurchases();
    if (success) {
      await loadStatus();
    }
    return success;
  };

  return {
    ...state,
    isLoading,
    purchase,
    restore,
    refresh: loadStatus,
  };
}
```

---

## UI設計

### Day 21 購入確認画面

```
┌─────────────────────────────┐
│  有料期間を始める            │
├─────────────────────────────┤
│                              │
│  9週間コーチングパッケージ    │
│                              │
│  ┌───────────────────────┐  │
│  │  ¥19,800（一括払い）    │  │
│  │  9週間のフルアクセス    │  │
│  └───────────────────────┘  │
│                              │
│  ✓ 解約手続き不要           │
│  ✓ 追加課金なし             │
│  ✓ 9週間後に自動終了        │
│                              │
│  ─────────────────────────  │
│  一度払えば、あとは           │
│  あなたの旅に集中するだけ。   │
│                              │
│  [9週間パッケージを購入]      │
│        ↓                     │
│  (Apple Pay / カード選択)    │
│                              │
│  [購入を復元]                │
│                              │
└─────────────────────────────┘
```

### 購入状態画面（設定内）

```
┌─────────────────────────────┐
│  購入状態                    │
├─────────────────────────────┤
│                              │
│  ステータス: アクティブ ●     │
│                              │
│  進捗: Week 4 / 12           │
│  ━━━━━━━━━━━━━━━━━ 33%      │
│                              │
│  購入額: ¥19,800             │
│  残り: 42日                  │
│  終了日: 2026年3月25日       │
│                              │
│  ─────────────────────────  │
│  ※ 解約手続きは不要です      │
│  ※ 追加課金はありません      │
│                              │
└─────────────────────────────┘
```

### 卒業画面（9週間完了時）

```
┌─────────────────────────────┐
│  🎉 おめでとうございます      │
├─────────────────────────────┤
│                              │
│  9週間の旅を完走しました。    │
│                              │
│  あなたが投資した時間と努力は │
│  確実にあなたの一部に         │
│  なっています。               │
│                              │
│  ─────────────────────────  │
│                              │
│  [卒業する]                  │
│  → Exit Ritual（成功版）へ    │
│                              │
│  [もう一度挑戦する]           │
│  → 同じパッケージを再購入     │
│                              │
└─────────────────────────────┘
```

---

## 実装フェーズ

### Phase 1: iOS先行（推奨実装順序）

1. **RevenueCat設定** (1h)
   - [ ] RevenueCatアカウント作成
   - [ ] iOS App設定
   - [ ] App Store Connect連携

2. **App Store Connect設定** (1h)
   - [ ] Non-Renewing Subscription商品作成（vowark_coaching_9weeks）
   - [ ] 価格設定（¥19,800）
   - [ ] Sandbox Tester設定

3. **データベース** (30min)
   - [ ] purchases テーブル作成
   - [ ] exit_reviews テーブル作成
   - [ ] RLS設定

4. **RevenueCat SDK実装** (2h)
   - [ ] react-native-purchases インストール
   - [ ] 初期化処理（App.tsx）
   - [ ] 9週間パッケージ購入フロー実装
   - [ ] 購入復元実装

5. **Webhook実装** (1.5h)
   - [ ] RevenueCat Webhook受信API
   - [ ] 購入処理（expires_at = purchased_at + 63日）
   - [ ] 返金処理
   - [ ] ユーザーフェーズ更新

6. **期限切れCron** (1h)
   - [ ] /api/purchase/check-expiry エンドポイント
   - [ ] 卒業通知送信
   - [ ] Vercel/Supabase Cron設定

7. **UI実装** (3h)
   - [ ] Day 21 購入確認画面
   - [ ] 購入状態画面（設定内）
   - [ ] 卒業画面
   - [ ] 購入復元ボタン

8. **テスト** (1.5h)
   - [ ] Sandbox環境でのテスト購入
   - [ ] Webhook受信テスト
   - [ ] 期限切れ処理テスト
   - [ ] 購入復元テスト

### Phase 2: Android展開（テスター15人達成後）

1. **Google Play Console設定** (1h)
   - [ ] アプリ登録
   - [ ] Managed product設定（同じProduct ID）
   - [ ] RevenueCat連携

2. **追加テスト** (1h)
   - [ ] Android購入フローテスト
   - [ ] クロスプラットフォーム動作確認

---

## 環境変数

```bash
# RevenueCat
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxx
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxxxx  # Phase 2
REVENUECAT_WEBHOOK_SECRET=whsec_xxxxxxxx

# App Store Connect (EAS Build用)
APP_STORE_CONNECT_API_KEY_ID=xxxxx
APP_STORE_CONNECT_ISSUER_ID=xxxxx
```

---

## Todo

### RevenueCat設定
- [ ] RevenueCatアカウント作成・プロジェクト設定
- [ ] App Store Connect連携
- [ ] Non-Renewing Subscription商品設定（vowark_coaching_9weeks）
- [ ] Entitlement設定（pro_access）
- [ ] Webhook URL設定

### App Store Connect
- [ ] Non-Renewing Subscription商品作成
- [ ] 価格設定（¥19,800）
- [ ] 審査用スクリーンショット準備
- [ ] Sandbox Tester設定

### データベース
- [ ] purchases テーブル作成
- [ ] exit_reviews テーブル作成
- [ ] RLS設定

### クライアント実装
- [ ] react-native-purchases インストール
- [ ] RevenueCat初期化（App.tsx）
- [ ] 9週間パッケージ購入フロー実装
- [ ] 購入復元実装
- [ ] usePurchase フック

### Webhook実装
- [ ] /api/webhooks/revenuecat エンドポイント
- [ ] 購入処理（expires_at計算）
- [ ] 返金処理
- [ ] ユーザーフェーズ更新ロジック

### 期限切れCron
- [ ] /api/purchase/check-expiry エンドポイント
- [ ] 卒業通知送信
- [ ] Cron設定（毎日実行）

### UI実装
- [ ] Day 21 購入確認画面
- [ ] 購入状態画面（設定内）
- [ ] 卒業画面（9週間完了時）
- [ ] 購入復元ボタン

### テスト
- [ ] Sandbox購入テスト
- [ ] Webhook受信テスト
- [ ] 期限切れ処理テスト
- [ ] 購入復元テスト

### Phase 2（Android）
- [ ] Google Play Console アプリ登録
- [ ] Managed product設定
- [ ] RevenueCat Android App追加
- [ ] Android購入テスト

---

## 完了条件

### Phase 1（iOS）
1. Day 21で**9週間パッケージを一括購入**できる
2. 購入成功後にcurrent_phaseがpaidに更新される
3. Webhookで購入イベントが正しく処理される
4. expires_atが購入日+63日で設定される
5. **9週間経過後にアクセスが自動終了**する
6. 期限切れ時に卒業通知が送信される
7. 購入復元が動作する
8. **追加課金なし（買い切り）**

### Phase 2（Android）
1. Google Play経由で同じ商品を購入できる
2. RevenueCat経由でステータスが同期される

---

## フェーズ遷移条件

```
trial → paid:
  購入成功時（Webhook: INITIAL_PURCHASE / NON_RENEWING_PURCHASE）

paid → graduated:
  expires_at到達時（Cron: check-expiry）

paid → trial:
  返金時（Webhook: REFUND）
```

---

## 既知の制限事項（MVP）

1. **返金処理**
   - アプリ内での直接返金は不可
   - Apple/Googleサポート経由のみ
   - Webhookで返金検知 → ステータス更新

2. **期限切れ検知のタイミング**
   - Cron Jobは毎日1回実行
   - 最大24時間の遅延が発生する可能性

3. **再チャレンジ（再購入）**
   - Non-Renewing Subscriptionなので期限切れ後に再購入可能
   - 新しいpurchaseレコードが作成される
   - 過去の購入履歴は保持される

---

## ユーザー安心ポイント

| 従来のサブスク | VowArkの買い切り |
|--------------|-----------------|
| 解約を忘れると課金継続 | **解約手続き不要** |
| 毎週/毎月の請求 | **一度だけの支払い** |
| 「いつの間にか課金」リスク | **追加課金ゼロ** |
| 解約手続きが面倒 | **何もしなくてOK** |

> **ユーザーへのメッセージ:**
> 「一度払えば、あとは旅に集中するだけ。解約を気にする必要はありません。」
