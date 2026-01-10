# 013: Meaning Forge（意味編纂の完全版）

## 概要

Day 0で行う簡易版を超えた、本格的な「意味の鍛造（Meaning Forge）」機能を実装する。音声中心のガイドインタビューで、ユーザーの志を深く掘り下げる。

## Phase

**Phase B: 追加機能**

## 優先度

中

## 依存関係

- 前提: 002 Day0 Initiation
- 後続: なし

---

## 機能要件

### 1. Guided Narrative Interview（音声中心）

**テーマ（掘り下げ項目）:**
- 原体験
- 痛み
- 価値観
- 強み
- 恐れ
- 理想像
- 貢献の芽

**インタビュー形式:**
- 音声入力が基本
- テキスト入力もサポート
- 各テーマに対して深掘り質問

### 2. 生成物（必須アウトプット）

**Meaning Statement（北極星：1-2文）:**
- 毎日表示される指針
- AIが回答から生成、ユーザー編集可

**Vow（誓い：短文）:**
- 署名対象
- 更新履歴保持

**Anti-Pattern（逃げ癖/破綻パターン）:**
- 敵の言語化
- 例: 「締め切りが近づくと逃げる」「難しいと感じたら先延ばしにする」

**Contribution Bridge（貢献の方向：1文）:**
- 強制ではなく選択式
- 例: 「この経験を通じて、同じ悩みを持つ人を助けたい」

### 3. Visualization

- 価値観-恐れ-行動-成果の関係をノード化
- 010 Cognitive Mapへ統合

---

## インタビューフロー

### Phase 1: 原体験（Origin）

```
Q1: あなたの人生で、最も影響を受けた出来事は何ですか？
Q2: その経験から、何を学びましたか？
Q3: 今の自分にどう影響していますか？
```

### Phase 2: 痛み（Pain）

```
Q1: 今、最も苦しんでいることは何ですか？
Q2: その苦しみはいつ頃から感じていますか？
Q3: 解決しようとして、何を試しましたか？
```

### Phase 3: 価値観（Values）

```
Q1: 譲れないものは何ですか？
Q2: どんな時に「これでいい」と感じますか？
Q3: 他人に尊敬されたい点は何ですか？
```

### Phase 4: 強み（Strengths）

```
Q1: 周りの人から褒められることは何ですか？
Q2: 努力しなくてもできることは何ですか？
Q3: 困難を乗り越えた時、何が支えになりましたか？
```

### Phase 5: 恐れ（Fears）

```
Q1: 最も恐れていることは何ですか？
Q2: その恐れが現実になったらどうなりますか？
Q3: 恐れを感じた時、どんな行動を取りがちですか？
```

### Phase 6: 理想像（Ideal Self）

```
Q1: 3ヶ月後、どんな自分になっていたいですか？
Q2: その自分は、毎日何をしていますか？
Q3: その自分は、何を手に入れていますか？
```

### Phase 7: 貢献（Contribution）

```
Q1: あなたの経験を通じて、誰を助けたいですか？
Q2: どんな形で貢献したいですか？
Q3: （オプション）その先に何がありますか？
```

---

## AI生成プロンプト

### Meaning Statement生成

```
以下のインタビュー回答から、ユーザーの「北極星」となるMeaning Statementを1-2文で生成してください。

【回答】
{interview_answers}

【条件】
- 抽象的すぎず、具体的すぎない
- 毎日見ても心に響く言葉
- ユーザー自身の言葉を可能な限り活かす
```

### Anti-Pattern生成

```
以下のインタビュー回答から、ユーザーの「逃げ癖」「破綻パターン」を抽出してください。

【回答（特に恐れ・痛みの部分）】
{interview_answers}

【形式】
- 「〜すると、〜してしまう」という形式
- 2-3個程度
```

---

## データモデル

### meaning_forge_sessions テーブル

```sql
CREATE TABLE meaning_forge_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  status VARCHAR(50) DEFAULT 'in_progress', -- 'in_progress' | 'completed'
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

### meaning_forge_answers テーブル

```sql
CREATE TABLE meaning_forge_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES meaning_forge_sessions(id) NOT NULL,
  theme VARCHAR(50) NOT NULL, -- 'origin' | 'pain' | 'values' | 'strengths' | 'fears' | 'ideal' | 'contribution'
  question_index INTEGER NOT NULL,
  answer TEXT NOT NULL,
  audio_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### anti_patterns テーブル

```sql
CREATE TABLE anti_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  content TEXT NOT NULL,
  source_session_id UUID REFERENCES meaning_forge_sessions(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## UI設計

### インタビュー画面

```
┌─────────────────────────────┐
│  原体験を聴かせてください     │
│                              │
│  "あなたの人生で、最も       │
│   影響を受けた出来事は？"     │
│                              │
│      ╭────────────╮          │
│      │  ~~~〜〜~   │          │
│      │   (録音中)  │          │
│      ╰────────────╯          │
│                              │
│   [🎤] [⌨️ テキストで入力]    │
│                              │
│  ─────────────────────────  │
│  1/7 テーマ完了               │
└─────────────────────────────┘
```

### 生成物確認画面

```
┌─────────────────────────────┐
│  あなたの意味が見えてきた    │
├─────────────────────────────┤
│                              │
│  📍 北極星（Meaning）         │
│  "〇〇という痛みを乗り越え、  │
│   △△な人になる"             │
│  [編集]                      │
│                              │
│  ⚔️ 敵（Anti-Pattern）       │
│  ・締め切りが近づくと逃げる   │
│  ・難しいと感じたら先延ばし   │
│  [編集]                      │
│                              │
│  🌉 貢献（Contribution）      │
│  "同じ悩みを持つ人を助けたい" │
│  [編集]                      │
│                              │
│           [確定する]          │
└─────────────────────────────┘
```

---

## Todo

### インタビュー機能
- [ ] 各テーマの質問セット作成
- [ ] 音声録音・文字起こし連携
- [ ] テキスト入力フォールバック
- [ ] 進捗表示（7テーマ中n完了）

### AI生成
- [ ] Meaning Statement生成プロンプト
- [ ] Anti-Pattern抽出プロンプト
- [ ] Contribution Bridge生成プロンプト

### データ保存
- [ ] meaning_forge_sessions テーブル作成
- [ ] meaning_forge_answers テーブル作成
- [ ] anti_patterns テーブル作成

### UI実装
- [ ] インタビュー画面
- [ ] 生成物確認画面
- [ ] 編集モーダル

### 統合
- [ ] 生成物をmemories（Milestone）に保存
- [ ] 010 Cognitive Mapへの連携準備

---

## 完了条件

1. 7テーマのインタビューが完了できる
2. Meaning Statementが生成・編集できる
3. Anti-Patternが抽出・編集できる
4. Contribution Bridgeが生成・編集できる
5. 生成物がMilestone記憶として保存される
6. Day 0完了後に任意で実行できる
