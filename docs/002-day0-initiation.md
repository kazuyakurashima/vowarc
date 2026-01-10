# 002: Day 0 Initiation（オンボーディング・心理的契約・Meaning Statement生成）

## 概要

ユーザーの参加初日（Day 0）のオンボーディングフローを実装する。
排除ではなく「自己物語の起動（Initiation）」を目的とし、心理的契約を結ぶ。
**Meaning Statement（北極星）とVow（誓い）の両方を生成する。**

## Phase

**Phase A: MVP**

## 優先度

高

## 依存関係

- 前提: 001 基盤構築
- 後続: 003 ホーム画面, 013 Meaning Forge完全版

---

## 機能要件

### 1. 最小入力（参加摩擦の最小化）

- メールアドレス入力（登録済みなら自動取得）
- **料金告知（透明性原則）**
  - 「21日間のトライアル後、継続する場合は9週間一括¥19,800です」
  - Day 0で事前に明示（中途請求しない）
- 最初の問い（Why）への回答
  - 「なぜ、今この3ヶ月を使おうと思ったのですか？」

### 2. 最初の問い（Guided Interview - MVP版）

**質問フロー（MVP版：3テーマ）:**

1. **Why**: 「この3ヶ月で何を変えたいですか？」
2. **Pain**: 「今、何に一番苦しんでいますか？」
3. **Ideal**: 「3ヶ月後、どんな自分になっていたいですか？」

**回答形式（テキスト/音声両対応）:** ← 更新

**要件背景:**
- requirements.md で「音声中心のGuided Narrative Interview」が必須
- MVPでは軽量な音声対応を先行実装（004完成を待たない）

**実装方針（MVP）:**
- **音声入力（デフォルト・推奨）**: 録音ボタン → 音声文字起こし → テキスト化
  - **録音**: Expo AV（音声ファイル取得・保存用）
  - **文字起こし**: OpenAI Whisper API または デバイスSTT（react-native-voice）
  - 004の高度な音声機能（リアルタイム、感情分析等）は不要
  - 画面表示時は自動的に録音待機状態（音声が主）
- **テキスト入力（代替手段）**: 音声が難しい場合のみキーボード入力も可能

> **Note**: 録音（音声ファイル取得）とSTT（文字起こし）は別レイヤー。audio_url保存が必要な場合はExpo AV録音が前提。

**UI:**
- 各質問は1画面ずつ、没入感を重視
- 画面表示時は自動的に録音待機状態（🎤 録音ボタンを大きく強調表示）
- 「⌨️ テキストで入力」ボタンは控えめに配置（代替手段として提供）
- 音声推奨の姿勢を明確にする

> **Note**: 完全版（7テーマ深掘り）は013 Meaning Forge完全版で実装

### 3. Meaning Statement（北極星）生成 ← 追加

- AIが回答から**Meaning Statement**を生成（1-2文）
- 毎日ホーム画面に表示される指針
- ユーザーが編集可能
- 保存時にバージョン1として記録

**生成例:**
```
「〇〇という痛みを乗り越え、△△な自分になる」
「□□を通じて、◇◇を実現する」
```

### 4. Vow（誓い）生成

- AIが回答から**Vow（誓い）**を生成（1-2文）
- Meaning Statementより具体的な行動宣言
- ユーザーが編集可能
- 保存時にバージョン1として記録

**生成例:**
```
「私は毎朝5時に起き、1時間コードを書く」
「私は週3回のジョギングを欠かさない」
```

### 5. Anti-Pattern（逃げ癖）の初期抽出 ← 追加

- AIがPainの回答から**逃げ癖パターン**を抽出
- 「〜すると、〜してしまう」形式
- 1-2個程度（MVP）
- Milestone記憶として保存

**抽出例:**
```
「締め切りが近づくと、逃げてしまう」
「難しいと感じると、先延ばしにしてしまう」
```

### 6. 心理的契約（Initiation）

**宣言文:**
```
「私はこの3ヶ月で、[今の自分]を卒業し、[理想の自分]になる」
```
- [今の自分] と [理想の自分] はユーザーが入力
- チェックボックス + 署名（指でサイン）

**相互契約の表示:**
```
あなたは本気の枠に入りました。
運営も本気で伴走し、必要なら返金してでも誠実に終えます。
```

### 7. トライアル開始

- trial_start_date を記録
- current_phase を "trial" に更新
- ホーム画面へ遷移

### 8. Day1-3 フォローアップ（7テーマ完成） ← 追加

**要件背景:**
- requirements.md では7テーマ必須（原体験/痛み/価値観/強み/恐れ/理想像/貢献の芽）
- Day0で全実施は摩擦が大きいため、Day1-3で段階的に完成させる

**追加テーマ（4-5個）:**
1. **Origin（原体験）**: 「人生で最も影響を受けた出来事は？」
2. **Values（価値観）**: 「あなたが大切にしている価値観は？」
3. **Strengths（強み）**: 「自分の強みは何だと思いますか？」
4. **Fear（恐れ）**: 「最も避けたいことは？」
5. **Contribution（貢献の芽）**: （オプション）「将来、誰にどう貢献したいですか？」

**実施タイミング:**
- Day1: Origin + Values（2テーマ）
- Day2: Strengths + Fear（2テーマ）
- Day3: Contribution（オプション）+ Meaning Statement v2更新

**UI/UX:**
- ホーム画面に「まだ未完成の物語があります」等のCTA表示
- 各日1-2テーマずつ、Day0と同様のインタビューUI（**音声中心、テキスト代替可**）
- 完了後にMeaning Statement/Vowをv2として更新（AIが7テーマ全体から再生成）

**データ保存:**
- onboarding_answers テーブルに追加質問を保存（question_key: 'origin', 'values', 'strengths', 'fear', 'contribution'）
- 7テーマ完了後、Meaning Statement/Vow をバージョン2として更新

> **Note**: 深掘り版（長時間インタビュー、Visualization等）は013 Meaning Forge完全版で実装

---

## UI/UX要件

### デザイン原則

- 摩擦を儀式に変える
- 抽象的UI（波形/余白）で思考に沈潜させる
- アバターなし、テキストと余白中心

### Initiation デザイン仕様

**Quiet Luxury（静かな高級感）**
- 背景: Ecru #F7F3F0（温かみのある白）
- Type-to-Space Ratio: 15:85（テキスト15%、余白85%）
- 低彩度（<8%）、目に優しく落ち着いた印象

**タイポグラフィ**
- 見出し/質問文: Noto Serif JP (Light) — 品格と静けさ
- 本文/入力: Noto Sans JP (Regular)
- Line Height: 1.9〜2.1（日本語「間」を活かす）

**トランジション**
- 画面遷移: フェードイン 600ms（ゆっくりとした出現）
- Progressive Disclosure: 1画面1質問、没入感を重視
- 署名完了時: subtle celebration（派手ではない）

**Voice Recording UI（音声入力時）**
- 録音待機: Orbが呼吸するような波形アニメーション
- 録音中: Orbが脈動（音量に連動）
- 沈黙許容: 無音でも急かさない設計

**ハプティック**
- 質問遷移時: 軽いタップフィードバック
- 署名完了時: **Vow Impact**（強い単発フィードバック）

**禁止事項**
- 派手なアニメーション（バウンス、シェイク等）
- ゲーミフィケーション的演出
- 急かすような表示

### 画面構成

```
(onboarding)/
├── index.tsx           # 開始画面「始めましょう」
├── why.tsx             # 最初の問い（Why）
├── pain.tsx            # 痛みの言語化
├── ideal.tsx           # 理想の言語化
├── meaning-preview.tsx # Meaning Statement生成・編集 ← 追加
├── vow-preview.tsx     # Vow生成・編集
├── contract.tsx        # 心理的契約・署名
├── complete.tsx        # 完了・ホームへ
└── (follow-up)/        # Day1-3 フォローアップ ← 追加
    ├── origin.tsx      # 原体験
    ├── values.tsx      # 価値観
    ├── strengths.tsx   # 強み
    ├── fear.tsx        # 恐れ
    ├── contribution.tsx # 貢献の芽（オプション）
    └── meaning-v2.tsx  # Meaning Statement v2更新
```

### アニメーション

- 画面遷移: フェードイン（ゆっくり）
- テキスト表示: タイピングエフェクト（オプション）
- 署名完了時: subtle celebration

---

## AI生成プロンプト

### Meaning Statement生成

```
以下のユーザー回答から、「北極星（Meaning Statement）」を1-2文で生成してください。

【回答】
Why: {why_answer}
Pain: {pain_answer}
Ideal: {ideal_answer}

【条件】
- 毎日見て心に響く言葉
- 抽象的すぎず、具体的すぎない
- ユーザー自身の言葉を可能な限り活かす
- 「〜を通じて、〜になる」のような形式

【出力形式】
1-2文のMeaning Statement
```

### Vow生成

```
以下のユーザー回答から、「誓い（Vow）」を1-2文で生成してください。

【回答】
Why: {why_answer}
Pain: {pain_answer}
Ideal: {ideal_answer}

【条件】
- 具体的な行動宣言
- 測定可能な要素を含む
- ユーザーが署名したくなる言葉

【出力形式】
1-2文のVow
```

### Anti-Pattern抽出

```
以下のユーザー回答から、「逃げ癖パターン」を抽出してください。

【回答（特にPain）】
Pain: {pain_answer}

【条件】
- 「〜すると、〜してしまう」形式
- 1-2個程度
- 敵として言語化できるパターン

【出力形式】
JSON配列: ["パターン1", "パターン2"]
```

---

## データ保存

### meaning_statements テーブル

```sql
INSERT INTO meaning_statements (user_id, content, version, is_current)
VALUES ($user_id, $generated_meaning_statement, 1, true);
```

### vows テーブル

```sql
INSERT INTO vows (user_id, content, version, is_current)
VALUES ($user_id, $generated_vow, 1, true);
```

### memories テーブル（Anti-Pattern）

```sql
INSERT INTO memories (user_id, type, category, content, is_mutable)
VALUES ($user_id, 'milestone', 'anti_pattern', $extracted_pattern, true);
```

### users テーブル更新

```sql
UPDATE users
SET current_phase = 'trial',
    trial_start_date = NOW()
WHERE id = $user_id;
```

### onboarding_answers テーブル

```sql
CREATE TABLE onboarding_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  question_key VARCHAR(50) NOT NULL, -- 'why' | 'pain' | 'ideal' | 'origin' | 'values' | 'strengths' | 'fear' | 'contribution'
  answer TEXT NOT NULL,
  input_type VARCHAR(20) DEFAULT 'text', -- 'text' | 'voice' (音声対応)
  audio_url VARCHAR(255), -- 音声ファイルURL（オプション、音声入力時のみ）
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Todo

### 画面実装（Day0）
- [x] (onboarding)/index.tsx - 開始画面
- [x] (onboarding)/why.tsx - Why質問
- [x] (onboarding)/pain.tsx - Pain質問
- [x] (onboarding)/ideal.tsx - Ideal質問
- [x] (onboarding)/meaning-preview.tsx - Meaning Statement生成・編集
- [ ] (onboarding)/vow-preview.tsx - Vow生成・編集（meaning-previewに統合済み）
- [x] (onboarding)/contract.tsx - 心理的契約
- [ ] (onboarding)/complete.tsx - 完了画面（不要、contractから直接(tabs)へ）

### 画面実装（Day1-3 フォローアップ）
- [ ] (onboarding)/(follow-up)/origin.tsx - 原体験
- [ ] (onboarding)/(follow-up)/values.tsx - 価値観
- [ ] (onboarding)/(follow-up)/strengths.tsx - 強み
- [ ] (onboarding)/(follow-up)/fear.tsx - 恐れ
- [ ] (onboarding)/(follow-up)/contribution.tsx - 貢献の芽（オプション）
- [ ] (onboarding)/(follow-up)/meaning-v2.tsx - Meaning Statement v2更新
- [ ] ホーム画面にフォローアップCTA表示

### AI連携
- [x] Meaning Statement生成プロンプト作成
- [x] Vow生成プロンプト作成
- [x] Anti-Pattern抽出プロンプト作成
- [x] ChatGPT API呼び出し実装
- [ ] エラー時のフォールバック
- [ ] 7テーマ完成後のMeaning/Vow v2生成プロンプト ← 追加

### 音声入力（MVP簡易版） ← 追加
- [ ] 録音コンポーネント（Expo AV - 音声ファイル取得用）
- [ ] STT連携（OpenAI Whisper API または react-native-voice）
- [ ] 音声ファイルアップロード処理（Supabase Storage）
- [ ] テキスト/音声入力切り替えUI

### データ保存
- [x] onboarding_answers テーブル作成（input_type/audio_url追加）
- [ ] 回答保存API実装（音声対応）
- [ ] Meaning Statement保存API実装
- [ ] Vow保存API実装
- [ ] Anti-Pattern保存API実装（memories）
- [ ] ユーザーフェーズ更新API実装

### UI/UX
- [ ] フェード遷移アニメーション
- [ ] 署名コンポーネント（指でサイン）
- [ ] 契約表示デザイン
- [ ] 編集可能なテキスト表示
- [ ] 音声録音ボタン・インジケーター ← 追加

---

## 完了条件

### Day0
1. ユーザーが3つの質問（Why/Pain/Ideal）に**音声（またはテキスト代替）**で回答できる
2. **デフォルトで録音待機状態**、テキスト入力への切替も可能
3. AIが**Meaning Statement**を生成し、ユーザーが編集できる
4. AIが**Vow**を生成し、ユーザーが編集できる
5. AIが**Anti-Pattern**を抽出し、記憶に保存される
6. 心理的契約に署名できる
7. 完了後にホーム画面へ遷移する
8. trial_start_date と current_phase が正しく記録される
9. Meaning Statement/Vow/Anti-Patternがバージョン1として保存される

### Day1-3（7テーマ完成）
10. ホーム画面にフォローアップCTAが表示される
11. Day1-3で残り4テーマ（Origin/Values/Strengths/Fear）＋オプションでContributionに**音声中心**で回答できる
12. 7テーマ完了後、Meaning Statement/Vowがバージョン2として更新される
13. 音声入力した回答の音声ファイルが保存される（オプション）
