# Home Screen Specification

## 概要

ユーザーが毎日アクセスするホーム画面。北極星（Meaning Statement）、今日の最小コミット、Vowを表示し、チェックインへの導線を提供する。

**関連チケット:** 003-home-screen.md

---

## 1. 画面構成

### 1.1 レイアウト構造

```
┌─────────────────────────────────────────┐
│  Header: Day Progress + Phase Badge      │ ← 固定ヘッダー
├─────────────────────────────────────────┤
│                                          │
│  Meaning Statement Card                  │ ← 北極星（最重要）
│  「意志を、物語に変える」                  │
│                                          │
├─────────────────────────────────────────┤
│  Today's Commitments Section             │
│  ┌────────────────────────────────────┐ │
│  │ [ ] If 朝起きたら Then 10分書く     │ │
│  └────────────────────────────────────┘ │
│  [+ 追加]                                │
├─────────────────────────────────────────┤
│  Vow Card (collapsed)                    │
│  「私はこの3ヶ月で...」                   │
├─────────────────────────────────────────┤
│                                          │
│                                          │
│         [ 🎤 チェックイン ]               │ ← Primary CTA
│         [ テキストで記録 ]                │ ← Secondary
│                                          │
└─────────────────────────────────────────┘
```

### 1.2 コンポーネント階層

1. **Header** (固定)
   - Day Progress: `Day 15 / 84`
   - Phase Badge: `Trial` | `Week 4-8` | `Week 9-12`

2. **Meaning Statement Card** (メイン)
   - タップで編集履歴表示
   - フォント: Noto Serif JP Light, 20px
   - Line Height: 2.0

3. **Today's Commitments**
   - If-Then形式でリスト表示
   - チェックボックス（完了マーク）
   - 追加ボタン

4. **Vow Card** (折りたたみ)
   - タップで展開
   - 全文表示モーダル

5. **Quick Actions** (画面下部固定)
   - 音声チェックイン（Primary）
   - テキストチェックイン（Secondary/Ghost）

---

## 2. デザイン仕様

### 2.1 カラー適用

| 要素 | カラー | トークン |
|---|---|---|
| 背景 | #F7F3F0 | colors.background |
| カード背景 | #FAF8F5 | colors.surface |
| Meaning Statement | #2C2C2C | colors.textPrimary |
| Phase Badge | #6B6B6B | colors.textSecondary |
| チェックインボタン | #E07A5F | colors.accent |

### 2.2 タイポグラフィ

| 要素 | フォント | サイズ | Weight |
|---|---|---|---|
| Day Progress | Inter | 14px | Regular |
| Phase Badge | Noto Sans JP | 12px | Regular |
| Meaning Statement | Noto Serif JP | 20px | Light |
| コミット内容 | Noto Sans JP | 16px | Regular |
| Vow（折りたたみ） | Noto Sans JP | 14px | Regular |
| ボタンラベル | Noto Sans JP | 16px | Medium |

### 2.3 スペーシング

| 領域 | 値 | トークン |
|---|---|---|
| 画面パディング | 24px | spacing.lg |
| セクション間 | 32px | spacing.xl |
| カード内パディング | 24px | spacing.lg |
| コミット項目間 | 12px | spacing.md - 4 |

### 2.4 Type-to-Space Ratio

- 目標: 15:85（テキスト15%、余白85%）
- Meaning Statementセクションに十分な余白を確保
- カード間のスペースを広めに

---

## 3. インタラクション

### 3.1 画面ロード

1. 背景フェードイン（0ms）
2. Header表示（100ms delay）
3. Meaning Statement Card フェードイン（200ms delay）
4. Commitments Section フェードイン（300ms delay）
5. Vow Card フェードイン（400ms delay）
6. Quick Actions フェードイン（500ms delay）

**Transition設定:**
- duration: 600ms
- easing: ease-out
- stagger delay: 100ms

### 3.2 コミットメント完了

1. チェックボックスタップ
2. haptics.light
3. チェックマークアニメーション（200ms）
4. テキストに取り消し線（fade: 300ms）

### 3.3 チェックインボタン

**音声チェックイン（Primary）:**
- タップ時: haptics.medium
- 遷移: 004 音声チェックイン画面

**テキストチェックイン（Ghost）:**
- タップ時: haptics.light
- 遷移: テキストチェックインモーダル

### 3.4 Meaning Statement タップ

- 遷移: 編集履歴モーダル（v1 → v2 → ...）
- トランジション: standard (300ms)

---

## 4. 状態バリエーション

### 4.1 Day 1-3（オンボーディング未完了）

- **追加表示:** フォローアップCTAカード
  - 「まだ未完成の物語があります」
  - 「続きを語る」ボタン
- 配置: Meaning Statement直下

### 4.2 コミットメント未設定

- 「今日の最小コミット」セクション
  - プレースホルダー: 「最初のIf-Thenを設定しましょう」
  - [+ 追加]ボタン強調表示

### 4.3 全コミットメント完了

- チェックボックス全てにチェック
- subtle celebration なし（派手な演出禁止）
- 次の日の準備を促すテキスト（オプション）

---

## 5. エッジケース

### 5.1 長いMeaning Statement

- 最大3行表示
- 超過分は`...`で省略
- タップで全文表示

### 5.2 コミットメント多数（5個以上）

- 最大3個表示
- 「他 n 件を表示」リンク
- 展開時: スライドダウンアニメーション

### 5.3 ネットワークエラー

- キャッシュデータ表示
- 上部に控えめなエラーバー
- 「再読み込み」ボタン

---

## 6. アクセシビリティ

### 6.1 VoiceOver対応

- Meaning Statement: 「北極星: [内容]」
- Day Progress: 「現在 15日目、全84日中」
- チェックボックス: 「[コミット内容]、未完了」

### 6.2 ダイナミックタイプ

- 最小フォントサイズ: 14px
- 最大フォントサイズ: 24px（Meaning Statement）
- レイアウト崩れ防止のためmax-heightを設定

---

## 7. 実装メモ

### 7.1 データ取得

```typescript
interface HomeData {
  user: {
    dayNumber: number;
    currentPhase: 'trial' | 'paid';
    checkinStreak: number;
  };
  meaningStatement: {
    content: string;
    version: number;
  };
  vow: {
    content: string;
    version: number;
  };
  todayCommitments: Commitment[];
}
```

### 7.2 必要なコンポーネント

- `<DayProgressHeader />`
- `<MeaningStatementCard />`
- `<CommitmentList />`
- `<CommitmentItem />`
- `<VowCard />`
- `<QuickActionButtons />`

---

## 変更履歴

| バージョン | 日付 | 変更内容 |
|---|---|---|
| v0.1 | 2025-01-09 | 初版作成 |
