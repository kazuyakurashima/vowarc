# TICKET-UX-022: Day21儀式画面テーマ適用

## 概要

Day21 Judgment Gate画面群にRitual Transitionsと特別カラー（Deep Gold）を適用する。

## 優先度

**高**

## 見積もり

2-3日

## 依存関係

- 前提: TICKET-DS-001, TICKET-DS-003, 007-day21-judgment-gate
- 後続: TICKET-PAY-003

---

## タスク

### 1. Ritual Transitions実装

**対象画面:**
- intro.tsx
- report.tsx
- vow-update.tsx
- tough-love.tsx
- re-sign.tsx
- choice.tsx

**トランジション設定:**
- duration: 1800ms (1.8s)
- easing: ease-in-out
- Progressive Disclosure対応

### 2. Deep Goldアクセント適用

**使用箇所:**

| 画面 | 要素 | カラー |
|---|---|---|
| report.tsx | On Trackティアバッジ | #C9A961 |
| vow-update.tsx | 誓い編集枠線 | #C9A961 |
| re-sign.tsx | 署名エリア枠線 | #C9A961 |
| choice.tsx | 「継続する」ボタン | #C9A961 |

**使用量:** Color Ratio 3%以内

### 3. Zazen Screen実装

**対象画面:** intro.tsx, re-sign.tsx

**特徴:**
- 意図的な「間」を設ける
- テキストのみ、ミニマル
- ゆっくりとしたフェードイン（3秒）
- 呼吸を促すような余白

**intro.tsx:**
```
21日間。

ここまで来た事実を、
まず承認させてください。
```

### 4. Progressive Disclosure

**report.tsx:**
1. Block 1 (Progress Trajectory): 0ms
2. Block 2 (Resilience): 400ms delay
3. Block 3 (Evidence): 800ms delay
4. Block 4-6: スクロールで表示

### 5. Haptics実装

| タイミング | フィードバック |
|---|---|
| レポート閲覧中 | Reflection Pulse (60bpm) |
| ティア表示時 | medium |
| 署名完了時 | Vow Impact (heavy) |
| 選択ボタン押下 | light |

### 6. タイポグラフィ

| 要素 | フォント | サイズ |
|---|---|---|
| セクション見出し | Noto Serif JP Light | 20px |
| 数値（大） | Inter | 48px |
| 本文 | Noto Sans JP | 16px |
| 署名テキスト | Noto Serif JP Light | 18px |

---

## 禁止事項

- 紙吹雪、スター等のゲーミフィケーション
- カウントダウン（急かし）
- 派手なバウンスアニメーション
- 高彩度カラー（Deep Gold以外）

---

## 完了条件

- [ ] 全画面でRitual Transitions (1.8s) が動作
- [ ] Deep Goldが指定箇所に適用されている
- [ ] intro.tsx / re-sign.tsxでZazen Screenが機能
- [ ] Progressive Disclosureが動作
- [ ] Reflection Pulseが動作
- [ ] 署名完了時にVow Impactが発火

---

## 関連ドキュメント

- [design/screens/day21-commitment-report.md](../../design/screens/day21-commitment-report.md)
- [007-day21-judgment-gate.md](../../docs/007-day21-judgment-gate.md)
