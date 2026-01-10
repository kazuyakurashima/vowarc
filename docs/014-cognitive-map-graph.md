# 014: Cognitive Map（グラフ描画版）

## 概要

011 Cognitive Map（簡易版）を拡張し、ノードとエッジをグラフ描画で可視化する。価値観・強み・逃げ癖・転機・成果物の関係性を視覚的に表現する。

## Phase

**Phase B: 拡張機能**

## 優先度

中

## 依存関係

- 前提: 011 Cognitive Map（簡易版）
- 後続: なし

---

## 機能要件

### 1. ノードタイプ

| タイプ | 説明 | 色/形 |
|-------|------|-------|
| 価値観（Values） | 譲れないもの | 青/円 |
| 強み（Strengths） | できること | 緑/円 |
| 逃げ癖（Anti-Pattern） | 敵のパターン | 赤/菱形 |
| 転機（Turning Point） | 重要な変化 | 黄/星 |
| 成果物（Achievement） | 達成したこと | 金/四角 |
| 恐れ（Fears） | 避けたいこと | 紫/三角 |
| 誓い（Vow） | 中心の誓い | 白/大円 |

### 2. ノード間の関係

**関係タイプ:**
- `supports`: 支える関係（価値観→誓い）
- `threatens`: 脅かす関係（恐れ→誓い）
- `overcame`: 乗り越えた関係（成果物→逃げ癖）
- `enabled`: 可能にした関係（強み→成果物）
- `triggered`: 引き起こした関係（転機→変化）

### 3. インタラクション

- ノードをタップで詳細表示
- ピンチでズーム
- ドラッグで移動
- ノード追加（手動）
- 関係線の追加

### 4. 自動更新

- チェックインからの自動ノード生成
- Meaning Forgeからの連携
- Evidence提出時の成果物ノード追加

---

## UI設計

### マップ画面

```
┌─────────────────────────────┐
│  Cognitive Map      [+追加]  │
├─────────────────────────────┤
│                              │
│     ○価値観1                │
│        ╲                     │
│         ╲    ◇逃げ癖1       │
│          ╲  ╱                │
│           ◎                  │
│          誓い                │
│          ╱ ╲                 │
│    ○強み1   △恐れ1         │
│        ╲                     │
│         ★転機1              │
│            ╲                 │
│             ■成果物1        │
│                              │
├─────────────────────────────┤
│  [価値観] [強み] [逃げ癖]    │ ← フィルター
│  [転機] [成果物] [恐れ]      │
└─────────────────────────────┘
```

### ノード詳細モーダル

```
┌─────────────────────────────┐
│  価値観: 誠実さ              │
├─────────────────────────────┤
│                              │
│  "嘘をつかない、約束を守る"  │
│                              │
│  作成: 2024/01/01            │
│  元: Meaning Forge           │
│                              │
│  関係するノード:              │
│  → 誓い（supports）          │
│  → 成果物1（enabled）        │
│                              │
│  [編集] [削除] [関係を追加]   │
└─────────────────────────────┘
```

---

## データモデル

### map_nodes テーブル

```sql
CREATE TABLE map_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'value' | 'strength' | 'anti_pattern' | 'turning_point' | 'achievement' | 'fear' | 'vow'
  label VARCHAR(100) NOT NULL,
  description TEXT,
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  source_type VARCHAR(50), -- 'meaning_forge' | 'checkin' | 'evidence' | 'manual'
  source_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### map_edges テーブル

```sql
CREATE TABLE map_edges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  from_node_id UUID REFERENCES map_nodes(id) NOT NULL,
  to_node_id UUID REFERENCES map_nodes(id) NOT NULL,
  relation_type VARCHAR(50) NOT NULL, -- 'supports' | 'threatens' | 'overcame' | 'enabled' | 'triggered'
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 技術選定

### グラフ描画ライブラリ

**推奨: react-native-skia + カスタム実装**
- 高パフォーマンス
- 完全なカスタマイズ可能

**代替: react-native-graph**
- 簡易実装向け

**代替: D3.js (Web View)**
- 複雑なグラフ向け
- パフォーマンス注意

---

## 自動ノード生成ロジック

### チェックインからの抽出

```typescript
interface ExtractedNodes {
  achievements: string[];  // 「できた」「達成した」
  turningPoints: string[]; // 「気づいた」「変わった」
  antiPatterns: string[];  // 「また〜してしまった」
}

async function extractNodesFromCheckin(
  checkinContent: string,
  aiClient: OpenAI
): Promise<ExtractedNodes> {
  const prompt = `
以下のチェックイン内容から、マップに追加すべきノードを抽出してください:

${checkinContent}

JSON形式で以下を返してください:
- achievements: 達成や成功体験（「できた」「達成した」等）
- turningPoints: 気づきや変化（「気づいた」「変わった」等）
- antiPatterns: 逃げ癖の発現（「また〜してしまった」等）
`;
  // API呼び出し
}
```

### Evidenceからの自動追加

```typescript
// Evidence提出時
async function createAchievementNode(evidence: Evidence) {
  await supabase.from('map_nodes').insert({
    user_id: evidence.user_id,
    type: 'achievement',
    label: evidence.title,
    description: evidence.description,
    source_type: 'evidence',
    source_id: evidence.id,
  });
}
```

---

## API設計

### GET /api/map

マップデータを取得

**Response:**
```json
{
  "nodes": [
    {
      "id": "uuid",
      "type": "value",
      "label": "誠実さ",
      "description": "嘘をつかない",
      "position": { "x": 100, "y": 200 }
    }
  ],
  "edges": [
    {
      "id": "uuid",
      "from": "node_uuid_1",
      "to": "node_uuid_2",
      "relation": "supports"
    }
  ]
}
```

### POST /api/map/nodes

ノードを追加

### PUT /api/map/nodes/:id

ノードを更新（位置含む）

### POST /api/map/edges

関係を追加

---

## Todo

### データモデル
- [ ] map_nodes テーブル作成
- [ ] map_edges テーブル作成
- [ ] RLS設定

### グラフ描画
- [ ] ライブラリ選定・導入
- [ ] ノード描画コンポーネント
- [ ] エッジ描画コンポーネント
- [ ] ズーム・パン機能

### インタラクション
- [ ] ノードタップ→詳細表示
- [ ] ノードドラッグ→位置更新
- [ ] ノード追加モーダル
- [ ] 関係追加機能

### 自動生成
- [ ] チェックインからのノード抽出
- [ ] Evidenceからの成果物ノード生成
- [ ] Meaning Forgeからの連携

### API実装
- [ ] GET /api/map
- [ ] POST /api/map/nodes
- [ ] PUT /api/map/nodes/:id
- [ ] POST /api/map/edges

---

## 完了条件

1. マップ画面でノードが表示される
2. ノード間の関係線が表示される
3. ノードをタップで詳細が見れる
4. ノードを手動で追加できる
5. チェックインから自動でノードが生成される
6. フィルターでノードタイプを絞り込める
