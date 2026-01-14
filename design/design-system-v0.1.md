# VowArc Design System v0.1

## 概要

VowArcは「3ヶ月で自己変革を達成する」コミットメント型AIコーチングアプリ。
本ドキュメントはDesign DNA、Tokens、Components、Copy Guidelinesを定義する。

---

## 1. Design DNA

### 1.1 プロダクトトーン

| 軸 | 位置 | 説明 |
|---|---|---|
| 温かさ / 厳しさ | 中央〜やや厳しめ | Tough Loveを体現。甘やかさず、見放さない |
| 静寂 / 活発 | 静寂寄り | Quiet Luxury。派手な演出を避ける |
| 抽象 / 具体 | 抽象寄り | 波形・グラデーション等の抽象的ビジュアル |
| 品格 / 親しみ | 品格寄り | 高級感のある落ち着いたUI |

### 1.2 Emotion Priority（感情優先順位）

1. **敬意（Respect）**: ユーザーの意志と時間を尊重
2. **信頼（Trust）**: 透明性とIntegrityを通じた信頼構築
3. **静けさ（Serenity）**: 思考に沈潜できる静かな空間
4. **厳かさ（Solemnity）**: 特に儀式（Day0, Day21）での荘厳さ

### 1.3 避けるべき印象（Anti-Impressions）

| 印象 | 理由 | 代わりに |
|---|---|---|
| ゲーミフィケーション | 紙吹雪、バッジ連発は安っぽく、コミットメントを軽く見せる | subtle celebration, 控えめな承認 |
| 急かし | カウントダウン、プレッシャーUIは不信感を生む | ユーザーペースの尊重 |
| 過度な親しみ | キャラクター的なフレンドリーさは威厳を損なう | 品格ある距離感 |
| 高彩度 | 派手な色使いはQuiet Luxuryに反する | 低彩度（<8%） |

### 1.4 参照プロダクト

**Primary Reference:**
- **Pi (Inflection AI)**: 余白、静かなUI、音声中心

**Secondary Reference:**
- **Cotomo**: 日本語音声UI
- **Paradot**: 記憶・関係性構築

**Anti-Reference（避けるべき）:**
- Character.AI, Replika, Chai: アバター中心、ゲーミフィケーション的

---

## 2. Design Tokens

### 2.1 Color Palette

```typescript
const colors = {
  // Base (Color Ratio 90%)
  background: '#F7F3F0',  // Ecru - 3000K温かみのある白
  surface: '#FAF8F5',     // Pearl - サーフェス用

  // Text
  textPrimary: '#2C2C2C',   // Charcoal
  textSecondary: '#6B6B6B', // Slate

  // Accent (Color Ratio 3%)
  accent: '#E07A5F',  // Warm Coral - 控えめに使用

  // Day21 Special Accent (Color Ratio 3%以内 - 儀式専用)
  day21Accent: '#C9A961',  // Deep Gold - Day21画面のみ使用

  // Semantic
  success: '#7A9E7E',
  warning: '#D4A574',
  error: '#C17B7B',
} as const;
```

**Color Ratio:**
- 90%: background / surface（Ecru / Pearl）
- 7%: textPrimary / textSecondary（Charcoal / Slate）
- 3%: accent（Warm Coral / Deep Gold）

**Deep Gold (#C9A961) 使用ルール:**
- Day21 Judgment Gate画面でのみ使用
- 使用箇所: 誓い再署名の枠線、重要な見出し、CTA
- 他の画面では使用禁止

### 2.2 Typography

```typescript
const typography = {
  // 見出し: Noto Serif JP Light
  heading: {
    fontFamily: 'NotoSerifJP-Light',
    lineHeight: 2.0,  // 日本語「間」
  },
  // 本文: Noto Sans JP Regular
  body: {
    fontFamily: 'NotoSansJP-Regular',
    lineHeight: 1.9,
  },
  // 数字/英字: Inter
  numeric: {
    fontFamily: 'Inter',
    lineHeight: 1.5,
  },
} as const;

const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;
```

**日本語「間」を活かすタイポグラフィ:**
- Line Height: 1.9〜2.1
- 段落間: Line Heightの1.5倍以上
- Letter Spacing: 0.02em（見出し）

### 2.3 Spacing

```typescript
const spacing = {
  // Type-to-Space Ratio: 15:85 を意識
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,

  // 段落間
  paragraphGap: 24,  // lineHeightの1.5倍以上

  // セクション間
  sectionGap: 48,
} as const;
```

### 2.4 Transitions

```typescript
const transitions = {
  // 通常の画面遷移
  standard: {
    duration: 300,
    easing: 'ease-in-out',
  },
  // フェードイン
  fadeIn: {
    duration: 600,
    easing: 'ease-out',
  },
  // カード順次表示
  stagger: {
    duration: 400,
    delay: 100,
    easing: 'ease-out',
  },
  // 儀式的遷移（Day0, Day21等）
  ritual: {
    duration: 1800,  // 1.8s
    easing: 'ease-in-out',
  },
} as const;
```

### 2.5 Elevation（影ではなく明度差）

```typescript
const elevation = {
  level0: '#F7F3F0',  // background
  level1: '#FAF8F5',  // surface (cards)
  level2: '#FDFCFA',  // より明るいサーフェス
} as const;
```

**原則:**
- ドロップシャドウは使用しない
- 明度差で奥行きを表現

### 2.6 Haptics

```typescript
const haptics = {
  // 通常タップ
  light: 'impactLight',

  // ボタン押下
  medium: 'impactMedium',

  // 誓い署名/完了時
  vowImpact: 'impactHeavy',

  // 内省促進（60bpm = 1000ms間隔）
  reflectionPulse: {
    type: 'impactLight',
    interval: 1000,
  },

  // 完了時の呼吸（吸って→吐いて）
  completionBreath: {
    inhale: 1500,
    exhale: 2000,
  },
} as const;
```

---

## 3. Components

### 3.1 Button

**Primary Button:**
- 背景: accent（Warm Coral / Deep Gold for Day21）
- テキスト: white
- 角丸: 8px
- パディング: 16px 32px
- フォント: Noto Sans JP, 16px, Medium
- タップ時: haptics.medium

**Secondary Button:**
- 背景: transparent
- ボーダー: 1px textSecondary
- テキスト: textPrimary
- タップ時: haptics.light

**Ghost Button:**
- 背景: transparent
- テキスト: textSecondary
- 下線: 1px
- 使用箇所: 代替アクション（「テキストで入力」等）

### 3.2 Card

**Standard Card:**
- 背景: surface（Pearl）
- 角丸: 12px
- パディング: 24px
- シャドウ: なし（明度差で表現）
- ボーダー: なし or 1px rgba(0,0,0,0.03)

**Highlight Card (Day21):**
- 背景: surface
- ボーダー: 2px day21Accent（Deep Gold）
- 使用箇所: Day21画面のメトリクス表示等

### 3.3 TextInput

**Standard Input:**
- 背景: surface
- ボーダー: 1px textSecondary（フォーカス時: accent）
- 角丸: 8px
- パディング: 16px
- フォント: Noto Sans JP, 16px

**Multiline Input:**
- 最小高さ: 120px
- 行間: 1.9

### 3.4 Orb（音声UI専用）

**待機状態:**
- サイズ: 120x120px
- グラデーション: radial, accent → background
- アニメーション: 呼吸するような脈動（4秒サイクル）

**録音中:**
- 脈動が音量に連動
- 周囲に波紋エフェクト

**処理中:**
- ゆっくりとした回転
- Subtitles: 40%透過度で下部に表示

### 3.5 Progress Indicator

**Day Progress:**
- 形式: テキスト「Day 15 / 84」
- フォント: Inter, 14px
- 色: textSecondary

**Phase Badge:**
- 形式: Pill shape
- 背景: surface
- テキスト: 「Trial」「Week 4-8」等
- フォント: Noto Sans JP, 12px

### 3.6 Signature Pad

**署名エリア:**
- 背景: surface
- ボーダー: 1px dashed textSecondary
- サイズ: 100% width, 150px height
- 角丸: 8px
- 署名完了時: haptics.vowImpact

---

## 4. Copy Guidelines

### 4.1 Integrity（誠実性）

**原則:**
- 嘘をつかない、誇張しない
- 効果の保証はしない
- ユーザーの努力を前提とする

**良い例:**
```
「この3ヶ月間、私たちはあなたの変化を見守り続けます」
```

**悪い例:**
```
「たった3ヶ月で人生が劇的に変わります！」
```

### 4.2 Tough Love（厳しさと愛）

**原則:**
- 甘やかさない、見放さない
- 観測した事実を伝える
- 逃げ癖を指摘するが、人格否定はしない

**良い例:**
```
「今週、約束した3回のチェックインのうち1回しか完了していません。
何が障害になっていますか？」
```

**悪い例:**
```
「大丈夫、無理しないでくださいね！」（甘やかし）
「あなたはいつも言い訳ばかりですね」（人格否定）
```

### 4.3 Transparency（透明性）

**原則:**
- 課金は開始時に告知、中途請求しない
- AIの判断根拠を開示する
- 解約・返金ポリシーを明確に

**良い例:**
```
「行動継続スコア算出根拠:
- チェックイン継続率: 90%
- If-Then発動率: 67%
- Evidence提出率: 83%
- コミット履行率: 82%」
```

### 4.4 Boundary（境界線）

**原則:**
- コーチングに集中、雑談に応じない
- 逸脱時は穏やかに軌道修正
- 変化の話題に戻す

**良い例:**
```
「興味深いお話ですね。ただ、今日の目標について確認させてください。
今朝のコミットメント、進捗はいかがですか？」
```

---

## 5. 禁止事項まとめ

### 5.1 視覚的禁止事項

- 紙吹雪、スター、バッジの連発
- 派手なバウンス、シェイクアニメーション
- 高彩度カラー（彩度8%以上）
- ドロップシャドウ
- アバター、キャラクター画像
- カウントダウンタイマー（急かし）

### 5.2 コピー禁止事項

- 効果の保証
- 過度な褒め言葉
- 人格否定
- 雑談への応答
- 感嘆符の多用

### 5.3 インタラクション禁止事項

- 自動再生動画
- 強制的なモーダル
- 許可なしの通知連発
- A/Bテストによるダークパターン

---

## 6. 実装優先順位

1. **Phase 1: Foundation**
   - Design Tokens実装
   - フォント導入（Noto Serif JP / Noto Sans JP / Inter）
   - 基本コンポーネント（Button, Card, Input）

2. **Phase 2: Screens**
   - ホーム画面テーマ適用
   - 音声チェックイン Orb UI
   - Day21儀式画面

3. **Phase 3: Polish**
   - Haptics実装
   - Transitions調整
   - Accessibility対応

---

## 変更履歴

| バージョン | 日付 | 変更内容 |
|---|---|---|
| v0.1 | 2025-01-09 | 初版作成 |
