# 017: 高度なWitness Memory機能

## 概要

006 記憶システムと005 AIコーチの介入設定を拡張し、削除権管理、プレビュー機能、高度な例外処理を実装する。

## Phase

**Phase B: 拡張機能**

## 優先度

低

## 依存関係

- 前提: 006 記憶システム, 005 AIコーチ基本
- 後続: なし

---

## 機能要件

### 1. 介入設定の透明性

**介入設定UI:**
- 「突っ込んでほしい」領域
- 「触れてほしくない」領域

**透明性の担保（必須表示）:**
```
「AIは参照しませんが、記録は残ります。
法的要請時には開示される可能性があります。
安全上の理由（自傷示唆等）がある場合は例外的に介入します。」
```

**プレビュー機能（オプション）:**
- 設定をONにした場合のAI応答例を表示

### 2. 矛盾検出の例外処理

**原則:**
- 「触れないで」とした領域は矛盾検出を行わない

**例外（設定を超えて介入）:**
1. 安全上の理由（自傷他害の示唆）
2. 法令対応（違法行為の示唆）
3. 本人の明示的同意（「この領域も指摘してほしい」と変更した場合）

### 3. 削除権と証人性の両立

**原則:**
- Immutable Layerは削除不可

**例外削除の範囲:**
1. 法的要請（GDPR等の忘れられる権利）
2. 医療的危機/トラウマ関連記録（安全配慮）

**削除時の処理:**
- 完全削除（内容消去）
- トゥームストーン（削除痕跡）を保持:
  - 「〇月〇日にコミット記録あり（ユーザー要請により削除済み）」
  - メタデータのみ（内容・カテゴリは含まない）

**監査ログ:**
- 削除要請日時・理由カテゴリを内部記録
- ユーザーには非表示、法的監査時のみ参照

### 4. 記憶の検索・フィルタリング

- キーワード検索
- 日付範囲フィルター
- カテゴリフィルター
- 感情トーンフィルター

### 5. 記憶の関連付け

- 記憶間のリンク作成
- タグによるグルーピング
- 時系列での関連表示

---

## UI設計

### 介入設定画面

```
┌─────────────────────────────┐
│  記憶の介入設定              │
├─────────────────────────────┤
│                              │
│  突っ込んでほしい領域:       │
│  ☑ 逃げ癖の発現              │
│  ☑ 時間管理                  │
│  ☑ コミットメント            │
│  ☐ 人間関係                  │
│  ☐ 健康・睡眠                │
│                              │
│  ─────────────────────────  │
│                              │
│  触れてほしくない領域:       │
│  ☐ 家族のこと                │
│  ☐ 過去のトラウマ            │
│  ☐ 特定の出来事              │
│  [+ カスタム追加]            │
│                              │
│  ─────────────────────────  │
│  ⚠️ 重要な説明               │
│  AIは参照しませんが、        │
│  記録は残ります。            │
│  法的要請時には開示される    │
│  可能性があります。          │
│  安全上の理由がある場合は    │
│  例外的に介入します。        │
│                              │
│  [プレビューを見る]          │
│                              │
│           [保存する]          │
└─────────────────────────────┘
```

### 削除要請画面

```
┌─────────────────────────────┐
│  記憶の削除要請              │
├─────────────────────────────┤
│                              │
│  ⚠️ 削除について             │
│                              │
│  以下の理由でのみ            │
│  削除が可能です:             │
│  ・法的要請（GDPR等）        │
│  ・医療的/トラウマ関連       │
│                              │
│  削除理由:                   │
│  ○ 法的要請                  │
│  ○ 医療的/トラウマ関連       │
│                              │
│  ─────────────────────────  │
│  削除されるもの:             │
│  ・記憶の内容                │
│                              │
│  残るもの（トゥームストーン）:│
│  ・「〇月〇日に記録あり      │
│    （削除済み）」という痕跡  │
│                              │
│  [削除を要請する]            │
└─────────────────────────────┘
```

### 記憶検索画面

```
┌─────────────────────────────┐
│  記憶を検索                  │
├─────────────────────────────┤
│  [🔍 キーワード検索...    ]  │
│                              │
│  フィルター:                 │
│  日付: [開始] 〜 [終了]      │
│  カテゴリ: [▼ すべて]       │
│  トーン: [▼ すべて]         │
│                              │
│  ─────────────────────────  │
│                              │
│  検索結果: 15件              │
│  ┌───────────────────────┐  │
│  │ 📅 1/10 - コミット     │  │
│  │ "5時起床を誓った"      │  │
│  │ [詳細] [関連を見る]     │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ 📅 1/8 - 障害          │  │
│  │ "夜更かしが問題"       │  │
│  │ [詳細] [関連を見る]     │  │
│  └───────────────────────┘  │
│                              │
└─────────────────────────────┘
```

---

## データモデル

### memory_intervention_settings テーブル

```sql
CREATE TABLE memory_intervention_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL UNIQUE,
  intervene_areas JSONB DEFAULT '[]', -- 突っ込んでほしい領域
  no_touch_areas JSONB DEFAULT '[]', -- 触れてほしくない領域
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### deletion_requests テーブル

```sql
CREATE TABLE deletion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  memory_id UUID REFERENCES memories(id) NOT NULL,
  reason_category VARCHAR(50) NOT NULL, -- 'legal' | 'medical'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  requested_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  processed_by UUID -- 管理者ID（オプション）
);
```

### memory_links テーブル

```sql
CREATE TABLE memory_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  from_memory_id UUID REFERENCES memories(id) NOT NULL,
  to_memory_id UUID REFERENCES memories(id) NOT NULL,
  link_type VARCHAR(50), -- 'related' | 'caused' | 'resolved'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(from_memory_id, to_memory_id)
);
```

### audit_logs テーブル（内部用）

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  action VARCHAR(100) NOT NULL, -- 'memory_deleted' | 'setting_changed' | 'exception_intervention'
  target_id UUID,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 例外介入ロジック

### 安全上の理由での介入

```typescript
interface SafetyCheck {
  isSafe: boolean;
  reason?: 'self_harm' | 'harm_others' | 'illegal';
  severity?: 'low' | 'medium' | 'high';
}

async function checkSafety(content: string): Promise<SafetyCheck> {
  const prompt = `
以下の内容に安全上の懸念がないか確認してください:

${content}

以下をチェック:
- 自傷の示唆
- 他害の示唆
- 違法行為の示唆

JSON形式で返してください:
{
  "is_safe": boolean,
  "reason": "self_harm" | "harm_others" | "illegal" | null,
  "severity": "low" | "medium" | "high" | null
}
`;
  // AI分析
}

async function handleExceptionIntervention(
  userId: string,
  memoryId: string,
  safetyCheck: SafetyCheck
): Promise<void> {
  // 1. 監査ログに記録
  await logAudit(userId, 'exception_intervention', memoryId, {
    reason: safetyCheck.reason,
    severity: safetyCheck.severity,
  });

  // 2. 適切な対応（危機介入プロトコル）
  if (safetyCheck.severity === 'high') {
    await triggerCrisisProtocol(userId);
  }
}
```

---

## API設計

### GET /api/memories/search

記憶を検索

**Query Parameters:**
- `q`: キーワード
- `from`: 開始日
- `to`: 終了日
- `category`: カテゴリ
- `tone`: 感情トーン

### PUT /api/memories/intervention-settings

介入設定を更新

**Request:**
```json
{
  "intervene_areas": ["逃げ癖", "時間管理"],
  "no_touch_areas": ["家族のこと"]
}
```

### POST /api/memories/deletion-request

削除要請を作成

**Request:**
```json
{
  "memory_id": "uuid",
  "reason_category": "medical"
}
```

### POST /api/memories/link

記憶間リンクを作成

**Request:**
```json
{
  "from_memory_id": "uuid",
  "to_memory_id": "uuid",
  "link_type": "related"
}
```

---

## Todo

### 介入設定
- [ ] memory_intervention_settings テーブル作成
- [ ] 介入設定UI
- [ ] プレビュー機能
- [ ] AIへの設定反映

### 削除機能
- [ ] deletion_requests テーブル作成
- [ ] 削除要請UI
- [ ] トゥームストーン生成ロジック
- [ ] 管理者承認フロー（オプション）

### 例外介入
- [ ] 安全チェックロジック
- [ ] 例外介入の記録
- [ ] 危機介入プロトコル連携

### 検索・フィルタ
- [ ] 検索API
- [ ] 検索UI
- [ ] フィルタ機能

### 記憶の関連付け
- [ ] memory_links テーブル作成
- [ ] リンク作成UI
- [ ] 関連表示

### 監査ログ
- [ ] audit_logs テーブル作成
- [ ] ログ記録処理

---

## 完了条件

1. 介入設定が保存・反映される
2. 「触れないで」領域で矛盾検出が行われない
3. 例外条件で適切に介入される
4. 削除要請が処理され、トゥームストーンが残る
5. 記憶の検索・フィルタができる
6. 記憶間のリンクが作成できる
7. 監査ログが記録される
