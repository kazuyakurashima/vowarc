# 006: 二層記憶システム（基本版）

## 概要

AIが過去のユーザー発言を参照するための記憶システムを構築する。
直近7日（Short-term）と要所（Milestones）の二層構造で管理。

## Phase

**Phase A: MVP**

## 優先度

中

## 依存関係

- 前提: 001 基盤構築
- 後続: 004 音声チェックイン, 005 AIコーチ, 007 Day21 Gate, 017 高度なWitness Memory

---

## 機能要件

### 1. 二層記憶構造

**Short-term（直近7日）:**
- 要約
- コミット発言
- 気分
- 障害
- Small Wins

**Milestones（要所）:**
- Vow（誓い）
- 価値観
- 逃げ癖（Anti-Pattern）
- 転機
- 成果物
- 重大な約束

### 2. Mutable / Immutable 分離

**Mutable Layer（ユーザー編集可）:**
- Meaning Statement の文言
- Vow の表現
- 感情的注釈・解釈
- 編集時は必ず履歴を生成

**Immutable Layer（改ざん不可）:**
- コミット発言（タイムスタンプ付き）
- チェックイン記録
- Evidence提出物
- Mutable Layerの編集履歴

### 3. ホワイトボックス記憶

- ユーザーがAIの記憶を閲覧可能
- 編集可能な項目の編集機能
- 編集履歴の表示

### 4. 削除権と証人性の両立（MVP最低限） ← 追加

**要件背景:**
- requirements.md で法的/医療的理由での削除が必須（MVP範囲）
- UIは不要、管理者向け機能として実装

**原則:**
- Immutable Layerは原則削除不可
- 例外削除の範囲（MVP）:
  1. **法的要請**（GDPR等の忘れられる権利）
  2. **医療的危機/トラウマ関連記録**（安全配慮）

**削除時の処理:**
- 完全削除（内容消去）
- Tombstone（削除痕跡）を保持:
  - 「〇月〇日に記録あり（削除済み）」
  - メタデータのみ（内容・カテゴリは含まない）

**実装方針（MVP）:**
- 管理者向けAPI（内部使用）として実装
- ユーザー向け削除要請UIは Phase B（017）
- 監査ログで削除要請の記録を保持

### 5. 記憶の要約生成

- 日次チェックインから要約を自動生成
- キーワード抽出
- 感情トーン分析

---

## データモデル

### memories テーブル

```sql
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'short_term' | 'milestone'
  category VARCHAR(50) NOT NULL, -- 'commitment' | 'mood' | 'obstacle' | 'win' | 'vow' | 'value' | 'anti_pattern' | 'turning_point' | 'achievement'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_mutable BOOLEAN DEFAULT false,
  source_id UUID, -- 元のcheckinやevidenceのID
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- short_termの場合は7日後
  is_active BOOLEAN DEFAULT true
);
```

### memory_versions テーブル（編集履歴）

```sql
CREATE TABLE memory_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  memory_id UUID REFERENCES memories(id) NOT NULL,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  edited_at TIMESTAMP DEFAULT NOW(),
  edited_by UUID REFERENCES users(id)
);
```

### tombstones テーブル（削除痕跡）

```sql
CREATE TABLE tombstones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_memory_id UUID NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  deletion_reason VARCHAR(50) NOT NULL, -- 'legal' | 'medical'
  deleted_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);
```

### deletion_requests テーブル（削除要請記録） ← 追加

```sql
CREATE TABLE deletion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  memory_id UUID REFERENCES memories(id),
  reason_category VARCHAR(50) NOT NULL, -- 'legal' | 'medical'
  reason_detail TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  requested_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  processed_by VARCHAR(100) -- 管理者識別子（email等）
);
```

### audit_logs テーブル（監査ログ・内部用） ← 追加

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL, -- 'memory_deleted' | 'deletion_requested' | 'deletion_approved' | 'deletion_rejected'
  target_type VARCHAR(50), -- 'memory' | 'user' | 'system'
  target_id UUID,
  details JSONB,
  performed_by VARCHAR(100), -- 管理者識別子 or 'system'
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API設計

### GET /api/memories

ユーザーの記憶を取得

**Query Parameters:**
- `type`: 'short_term' | 'milestone' | 'all'
- `limit`: 数（デフォルト: 50）

**Response:**
```json
{
  "short_term": [
    {
      "id": "uuid",
      "category": "commitment",
      "content": "明日は5時に起きる",
      "created_at": "2024-01-05T20:00:00Z",
      "source_type": "checkin"
    }
  ],
  "milestones": [
    {
      "id": "uuid",
      "category": "vow",
      "content": "私はこの3ヶ月で...",
      "version": 2,
      "created_at": "2024-01-01T10:00:00Z"
    }
  ]
}
```

### POST /api/memories

記憶を追加

**Request:**
```json
{
  "type": "milestone",
  "category": "anti_pattern",
  "content": "締め切りが近づくと逃げる傾向",
  "metadata": {
    "detected_from": "checkin_123"
  }
}
```

### PUT /api/memories/:id

編集可能な記憶を更新（バージョン履歴を生成）

**Request:**
```json
{
  "content": "更新された内容"
}
```

### GET /api/memories/:id/versions

編集履歴を取得

### POST /api/admin/memories/:id/delete（管理者用） ← 追加

**認証要件:** 管理者権限必須

記憶を例外的に削除し、Tombstoneを生成する

**Request:**
```json
{
  "reason_category": "legal",
  "reason_detail": "GDPR忘れられる権利の要請",
  "performed_by": "admin@example.com"
}
```

**処理フロー:**
1. 対象記憶の内容を完全削除（`content` を空にし、`is_active` を false）
2. Tombstoneレコード生成（日時のみ保持）
3. Audit Logに記録
4. Deletion Requestのステータスを 'approved' に更新

**Response:**
```json
{
  "success": true,
  "tombstone_id": "uuid",
  "audit_log_id": "uuid"
}
```

---

## 記憶抽出ロジック

### チェックインからの自動抽出

```typescript
interface MemoryExtraction {
  commitments: string[];      // 「〜する」「〜やる」等のコミット発言
  obstacles: string[];        // 「〜が難しい」「〜ができない」等の障害
  wins: string[];             // 達成報告、ポジティブな変化
  mood: number;               // 1-5の感情スコア
  summary: string;            // 全体要約
}

async function extractMemories(
  checkinContent: string,
  aiClient: OpenAI
): Promise<MemoryExtraction> {
  // AIを使って構造化抽出
  const prompt = `
以下のチェックイン内容から情報を抽出してください:

${checkinContent}

JSON形式で以下を返してください:
- commitments: コミットメント発言（「〜する」「〜やる」等）
- obstacles: 障害や困難（「〜が難しい」等）
- wins: 達成や成功体験
- mood: 感情スコア（1=非常に悪い〜5=非常に良い）
- summary: 50文字以内の要約
`;

  // API呼び出しとパース
}
```

### 7日経過後の処理

```typescript
// 日次バッチまたはcron
async function expireOldMemories() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  await supabase
    .from('memories')
    .update({ is_active: false })
    .eq('type', 'short_term')
    .lt('created_at', sevenDaysAgo.toISOString());
}
```

---

## UI: 記憶閲覧画面

### レイアウト

```
┌─────────────────────────────┐
│  あなたの記憶               │
│  [直近7日] [要所]           │ ← タブ切替
├─────────────────────────────┤
│                              │
│  📅 1月5日                   │
│  ├ コミット: 5時に起きる    │
│  ├ 気分: 😐 (3/5)           │
│  └ 障害: 夜更かし           │
│                              │
│  📅 1月4日                   │
│  ├ Win: 10分コード書けた!   │
│  └ 気分: 😊 (4/5)           │
│                              │
├─────────────────────────────┤
│  [編集] [介入設定]          │
└─────────────────────────────┘
```

---

## Todo

### データモデル
- [x] memories テーブル作成
- [x] memory_versions テーブル作成
- [x] tombstones テーブル作成
- [x] deletion_requests テーブル作成 ← 追加
- [x] audit_logs テーブル作成 ← 追加
- [x] RLS設定（管理者権限設定含む）

### 記憶抽出
- [x] チェックインからの自動抽出ロジック
- [x] 要約生成プロンプト作成
- [x] 感情スコア分析

### API実装
- [ ] GET /api/memories
- [ ] POST /api/memories
- [ ] PUT /api/memories/:id
- [ ] GET /api/memories/:id/versions
- [ ] POST /api/admin/memories/:id/delete（管理者用） ← 追加

### 削除権・監査（MVP最低限） ← 追加
- [ ] 管理者向け削除処理ロジック
- [ ] Tombstone生成処理
- [ ] Audit Log記録処理
- [ ] 削除要請ステータス管理

### 記憶管理
- [ ] 7日経過後の非アクティブ化処理
- [ ] Milestone昇格ロジック

### UI実装
- [ ] 記憶閲覧画面
- [ ] 編集モーダル
- [ ] 編集履歴表示

---

## 完了条件

1. チェックインから自動的に記憶が抽出される
2. 直近7日の記憶が取得できる
3. Milestone記憶が永続化される
4. 編集可能な記憶の編集と履歴保持ができる
5. AIコーチが記憶を参照できる
6. ユーザーが記憶を閲覧できる
7. **管理者が法的/医療的理由で記憶を削除できる** ← 追加
8. **削除時にTombstoneと監査ログが生成される** ← 追加

### データHooks（実装済み）
- [x] useMemories hook作成（Supabase SDK直接使用）
- [x] useMemoriesByType hook作成

### メモ
- API実装は直接Supabase SDKを使用する方針に変更（RLS-safe）
- POST /api/memories/extract のみサーバーサイドAPI（OpenAI呼び出しのため）
- 管理者向け削除機能はPhase Bで実装予定
