# TICKET-DS-003: 基本コンポーネント実装

## 概要

Design Systemに基づいた基本UIコンポーネント（Button, Card, TextInput）を実装する。

## 優先度

**高**

## 見積もり

2-3日

## 依存関係

- 前提: TICKET-DS-001, TICKET-DS-002
- 後続: TICKET-UX-021, 全画面実装

---

## タスク

### 1. Buttonコンポーネント

**ファイル:** `components/ui/Button.tsx`

**バリエーション:**

| Variant | 背景 | テキスト | 用途 |
|---|---|---|---|
| primary | accent | white | メインCTA |
| primary-day21 | day21Accent | white | Day21専用CTA |
| secondary | transparent | textPrimary | 代替アクション |
| ghost | transparent | textSecondary | 控えめなアクション |

**Props:**
```typescript
interface ButtonProps {
  variant: 'primary' | 'primary-day21' | 'secondary' | 'ghost';
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  haptic?: 'light' | 'medium' | 'heavy';
}
```

**スタイル仕様:**
- 角丸: 8px
- パディング: 16px 32px
- フォント: Noto Sans JP, 16px, Medium
- タップ時ハプティクス: variant依存

### 2. Cardコンポーネント

**ファイル:** `components/ui/Card.tsx`

**バリエーション:**

| Variant | 背景 | ボーダー | 用途 |
|---|---|---|---|
| standard | surface | なし | 通常カード |
| highlight | surface | day21Accent 2px | Day21強調 |

**Props:**
```typescript
interface CardProps {
  variant?: 'standard' | 'highlight';
  children: React.ReactNode;
  onPress?: () => void;
}
```

**スタイル仕様:**
- 角丸: 12px
- パディング: 24px
- シャドウ: なし（明度差のみ）

### 3. TextInputコンポーネント

**ファイル:** `components/ui/TextInput.tsx`

**バリエーション:**

| Variant | 行数 | 用途 |
|---|---|---|
| single | 1 | 短い入力 |
| multiline | 複数 | 長文入力 |

**Props:**
```typescript
interface TextInputProps {
  variant?: 'single' | 'multiline';
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  maxLength?: number;
  error?: string;
}
```

**スタイル仕様:**
- 背景: surface
- ボーダー: 1px textSecondary（フォーカス時: accent）
- 角丸: 8px
- パディング: 16px
- フォント: Noto Sans JP, 16px
- Multiline最小高さ: 120px

### 4. Loadingコンポーネント

**ファイル:** `components/ui/Loading.tsx`

**Props:**
```typescript
interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}
```

**スタイル仕様:**
- デフォルト色: accent
- サイズ: 24px / 40px / 56px

### 5. Typographyコンポーネント

**ファイル:** `components/ui/Typography.tsx`

**バリエーション:**

| Variant | フォント | サイズ | 用途 |
|---|---|---|---|
| heading1 | Noto Serif JP | 24px | 画面タイトル |
| heading2 | Noto Serif JP | 20px | セクション見出し |
| body | Noto Sans JP | 16px | 本文 |
| caption | Noto Sans JP | 14px | 補足テキスト |
| numeric | Inter | 16px | 数値 |

**Props:**
```typescript
interface TypographyProps {
  variant: 'heading1' | 'heading2' | 'body' | 'caption' | 'numeric';
  children: React.ReactNode;
  color?: string;
  align?: 'left' | 'center' | 'right';
}
```

### 6. 統合エクスポート

**ファイル:** `components/ui/index.ts`

```typescript
export { Button } from './Button';
export { Card } from './Card';
export { TextInput } from './TextInput';
export { Loading } from './Loading';
export { Typography } from './Typography';
```

---

## 完了条件

- [ ] 全コンポーネントが実装されている
- [ ] Design Tokenを使用している
- [ ] TypeScript型が正しく定義されている
- [ ] ハプティクスが動作する
- [ ] `components/ui`から一括importできる

---

## 関連ドキュメント

- [design-system-v0.1.md](../../design/design-system-v0.1.md)
