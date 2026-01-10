# 001: 基盤構築

## 概要

アプリケーションの基盤となる認証、データベース設計、API設定、共通コンポーネントを構築する。

## Phase

**Phase A: MVP**

## 優先度

最高（他の全チケットの前提）

## 依存関係

- 前提: なし
- 後続: 002, 003, 004, 005, 006, 007, 008（全MVP機能）

---

## 機能要件

### 1. 認証システム

- メールアドレス認証（Day 0 の最小入力要件）
- セッション管理
- ログイン/ログアウト機能

### 2. データベース設計

**ユーザーテーブル**
```
users
- id: UUID (PK)
- email: string (unique)
- created_at: timestamp
- current_phase: enum (day0, trial, paid, completed, terminated)
- trial_start_date: timestamp
- paid_start_date: timestamp (nullable)
```

**Vowテーブル（誓い）**
```
vows
- id: UUID (PK)
- user_id: UUID (FK)
- content: text
- version: integer
- created_at: timestamp
- is_current: boolean
```

**Meaning Statementテーブル**
```
meaning_statements
- id: UUID (PK)
- user_id: UUID (FK)
- content: text
- version: integer
- created_at: timestamp
- is_current: boolean
```

**チェックインテーブル**
```
checkins
- id: UUID (PK)
- user_id: UUID (FK)
- date: date
- type: enum (morning, evening, voice)
- transcript: text (nullable)
- audio_url: string (nullable)
- mood: integer (1-5)
- created_at: timestamp
```

**コミットメントテーブル**
```
commitments
- id: UUID (PK)
- user_id: UUID (FK)
- content: text
- type: enum (daily, weekly, milestone)
- status: enum (pending, completed, failed)
- due_date: date
- completed_at: timestamp (nullable)
- created_at: timestamp
```

### 3. API設定

- ChatGPT API接続設定
- 環境変数管理（API keys）
- エラーハンドリング共通処理

### 4. 共通コンポーネント

- テーマ設定（Quiet Luxury/抽象的UI）
- 共通ボタン、入力フィールド
- ローディング状態
- エラー表示

### 5. Design Tokens（デザイントークン）

**カラーパレット**
```typescript
const colors = {
  // Base (90%)
  background: '#F7F3F0',  // Ecru - 3000K温かみのある白
  surface: '#FAF8F5',     // Pearl - サーフェス用

  // Text
  textPrimary: '#2C2C2C',   // Charcoal
  textSecondary: '#6B6B6B', // Slate

  // Accent (3%)
  accent: '#E07A5F',  // Warm Coral - 控えめに使用

  // Special Accent (Day21儀式専用)
  day21Accent: '#C9A961',  // Deep Gold - Day21画面のみ使用

  // Semantic
  success: '#7A9E7E',
  warning: '#D4A574',
  error: '#C17B7B',
};
```

**タイポグラフィ**
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
};
```

**スペーシング**
```typescript
const spacing = {
  // Type-to-Space Ratio: 15:85 を意識
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,

  // 段落間
  paragraphGap: 24,  // lineHeightの1.5倍以上
};
```

**トランジション**
```typescript
const transitions = {
  // 通常の画面遷移
  standard: {
    duration: 300,
    easing: 'ease-in-out',
  },
  // 儀式的遷移（Day21等）
  ritual: {
    duration: 1800,  // 1.8s
    easing: 'ease-in-out',
  },
  // フェードイン
  fadeIn: {
    duration: 600,
    easing: 'ease-out',
  },
};
```

**Elevation（影ではなく明度差）**
```typescript
const elevation = {
  level0: colors.background,
  level1: colors.surface,
  level2: '#FDFCFA',  // より明るいサーフェス
};
```

### 5. ナビゲーション構造

```
app/
├── (auth)/
│   ├── login.tsx
│   └── register.tsx
├── (onboarding)/
│   ├── index.tsx      # Day 0開始
│   ├── why.tsx        # 最初の問い
│   └── contract.tsx   # 心理的契約
├── (tabs)/
│   ├── index.tsx      # ホーム
│   ├── checkin.tsx    # チェックイン
│   ├── map.tsx        # Cognitive Map
│   └── profile.tsx    # プロフィール
└── _layout.tsx
```

---

## 技術選定

| 項目 | 選定技術 |
|-----|---------|
| フロントエンド | React Native (Expo) |
| 認証 | Supabase Auth |
| データベース | Supabase PostgreSQL |
| ストレージ | Supabase Storage |
| AI API | OpenAI ChatGPT API |
| 状態管理 | Zustand or Context |
| スタイリング | NativeWind or StyleSheet |

---

## Todo

### 環境構築
- [x] Supabase プロジェクト作成
- [x] 環境変数設定（.env）
- [x] Supabase クライアント設定

### 認証
- [x] Supabase Auth 導入
- [x] ログイン画面実装
- [x] 登録画面実装
- [x] 認証状態管理hook作成

### データベース
- [x] users テーブル作成
- [x] vows テーブル作成
- [x] meaning_statements テーブル作成
- [x] checkins テーブル作成
- [x] commitments テーブル作成
- [x] RLS (Row Level Security) 設定

### API設定
- [x] OpenAI API クライアント設定
- [x] API呼び出し共通関数作成
- [ ] エラーハンドリング実装

### 共通コンポーネント
- [x] テーマ定義（colors, typography, spacing）
- [x] Design Tokens実装（カラー/タイポ/スペーシング/トランジション）
- [x] Noto Serif JP / Noto Sans JP / Inter フォント導入
- [x] Button コンポーネント
- [x] TextInput コンポーネント
- [x] Loading コンポーネント
- [x] ErrorBoundary 実装

### ナビゲーション
- [x] (auth) グループ作成
- [x] (onboarding) グループ作成
- [x] (tabs) グループ作成
- [ ] 認証状態によるルーティング制御

---

## 完了条件

1. ユーザーが登録・ログインできる
2. 全テーブルがSupabaseに作成されている
3. ChatGPT APIへの接続テストが成功する
4. 共通コンポーネントが利用可能
5. ナビゲーション構造が動作する
