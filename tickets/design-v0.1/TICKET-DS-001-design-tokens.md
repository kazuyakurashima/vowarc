# TICKET-DS-001: Design Tokens実装

## 概要

Design System v0.1のDesign Tokensをコードベースに実装する。

## 優先度

**最高**（他のUI実装の前提）

## 見積もり

1-2日

## 依存関係

- 前提: なし
- 後続: TICKET-DS-002, TICKET-UX-021, 全UI実装タスク

---

## タスク

### 1. カラートークン実装

**ファイル:** `constants/colors.ts`

```typescript
export const colors = {
  // Base (90%)
  background: '#F7F3F0',  // Ecru
  surface: '#FAF8F5',     // Pearl

  // Text
  textPrimary: '#2C2C2C',   // Charcoal
  textSecondary: '#6B6B6B', // Slate

  // Accent (3%)
  accent: '#E07A5F',  // Warm Coral

  // Day21 Special (3%以内)
  day21Accent: '#C9A961',  // Deep Gold

  // Semantic
  success: '#7A9E7E',
  warning: '#D4A574',
  error: '#C17B7B',
} as const;
```

### 2. タイポグラフィトークン実装

**ファイル:** `constants/typography.ts`

```typescript
export const typography = {
  heading: {
    fontFamily: 'NotoSerifJP-Light',
    lineHeight: 2.0,
  },
  body: {
    fontFamily: 'NotoSansJP-Regular',
    lineHeight: 1.9,
  },
  numeric: {
    fontFamily: 'Inter',
    lineHeight: 1.5,
  },
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;
```

### 3. スペーシングトークン実装

**ファイル:** `constants/spacing.ts`

```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  paragraphGap: 24,
  sectionGap: 48,
} as const;
```

### 4. トランジショントークン実装

**ファイル:** `constants/transitions.ts`

```typescript
export const transitions = {
  standard: { duration: 300, easing: 'ease-in-out' },
  fadeIn: { duration: 600, easing: 'ease-out' },
  stagger: { duration: 400, delay: 100, easing: 'ease-out' },
  ritual: { duration: 1800, easing: 'ease-in-out' },
} as const;
```

### 5. Elevationトークン実装

**ファイル:** `constants/elevation.ts`

```typescript
export const elevation = {
  level0: '#F7F3F0',
  level1: '#FAF8F5',
  level2: '#FDFCFA',
} as const;
```

### 6. Hapticsトークン実装

**ファイル:** `constants/haptics.ts`

```typescript
export const haptics = {
  light: 'impactLight',
  medium: 'impactMedium',
  vowImpact: 'impactHeavy',
  reflectionPulse: { type: 'impactLight', interval: 1000 },
  // completionBreath は TICKET-VOICE-007 で実装
} as const;
```

**Note:** `completionBreath`（呼吸フィードバック）はTICKET-VOICE-007で実装します。

### 7. 統合エクスポート

**ファイル:** `constants/theme.ts`

```typescript
export * from './colors';
export * from './typography';
export * from './spacing';
export * from './transitions';
export * from './elevation';
export * from './haptics';
```

---

## 完了条件

- [ ] 全トークンファイルが作成されている
- [ ] TypeScript型が正しく定義されている
- [ ] `constants/theme.ts`から一括importできる
- [ ] 既存コードとの競合がない

---

## 関連ドキュメント

- [design-system-v0.1.md](../../design/design-system-v0.1.md)
- [001-foundation.md](../../docs/001-foundation.md)
