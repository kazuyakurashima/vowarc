# TICKET-UX-021: ホーム画面テーマ適用

## 概要

ホーム画面にQuiet Luxuryテーマを適用し、Design System v0.1に準拠したUIを実装する。

## 優先度

**高**

## 見積もり

2日

## 依存関係

- 前提: TICKET-DS-001, TICKET-DS-002, TICKET-DS-003, 003-home-screen
- 後続: TICKET-UX-022

---

## タスク

### 1. 背景・サーフェス適用

**対象ファイル:** `app/(tabs)/index.tsx`

- 背景色: Ecru (#F7F3F0)
- カード背景: Pearl (#FAF8F5)
- シャドウ削除（明度差のみ）

### 2. タイポグラフィ適用

| 要素 | フォント | サイズ |
|---|---|---|
| Day Progress | Inter | 14px |
| Phase Badge | Noto Sans JP | 12px |
| Meaning Statement | Noto Serif JP Light | 20px |
| コミット内容 | Noto Sans JP | 16px |
| Vow（折りたたみ） | Noto Sans JP | 14px |

### 3. スペーシング適用

- 画面パディング: 24px (spacing.lg)
- セクション間: 32px (spacing.xl)
- カード内パディング: 24px (spacing.lg)
- Type-to-Space Ratio: 15:85を意識

### 4. コンポーネント置き換え

- 既存ボタン → `<Button variant="primary" />`
- 既存カード → `<Card variant="standard" />`
- テキスト → `<Typography variant="..." />`

### 5. トランジション実装

**画面ロード時:**
1. 背景フェードイン（0ms）
2. Header（100ms delay）
3. Meaning Statement Card（200ms delay）
4. Commitments Section（300ms delay）
5. Vow Card（400ms delay）
6. Quick Actions（500ms delay）

**設定:**
- duration: 600ms
- easing: ease-out
- stagger delay: 100ms

### 6. ハプティクス実装

| アクション | フィードバック |
|---|---|
| コミットメント完了 | light |
| チェックインボタン | medium |
| カードタップ | light |

---

## UI仕様（参照）

```
┌─────────────────────────────────────────┐
│  [Day 15 / 84]  Phase: Trial            │ ← Inter / Noto Sans
├─────────────────────────────────────────┤
│                                          │
│  「意志を、物語に変える」                 │ ← Noto Serif JP Light
│                                          │
├─────────────────────────────────────────┤
│  今日の最小コミット                       │
│  ┌────────────────────────────────────┐ │
│  │ [ ] If 朝起きたら Then 10分書く     │ │ ← Card (surface)
│  └────────────────────────────────────┘ │
│  [+ 追加]                                │
├─────────────────────────────────────────┤
│  あなたの誓い                            │
│  「私はこの3ヶ月で...」                   │
├─────────────────────────────────────────┤
│                                          │
│         [ 🎤 チェックイン ]              │ ← Button primary
│         [ テキストで記録 ]               │ ← Button ghost
│                                          │
└─────────────────────────────────────────┘
背景: Ecru #F7F3F0
```

---

## 完了条件

- [ ] 背景がEcruになっている
- [ ] カードにシャドウがない（明度差のみ）
- [ ] 全フォントがDesign Token通り
- [ ] スペーシングがDesign Token通り
- [ ] フェードインアニメーションが動作
- [ ] ハプティクスが動作

---

## 関連ドキュメント

- [design/screens/home.md](../../design/screens/home.md)
- [003-home-screen.md](../../docs/003-home-screen.md)
