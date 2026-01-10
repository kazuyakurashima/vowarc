# TICKET-MEM-010: Evidence Links実装

## 概要

Mirror Feedback内にEvidence Links（記憶リンク）を表示し、AIが「観測している」ことを可視化する。

## 優先度

**高**（MVP必須）

## 見積もり

1-2日

## 依存関係

- 前提: 006-memory-system, 004-voice-checkin
- 後続: TICKET-MEM-011

---

## タスク

### 1. EvidenceLinkコンポーネント作成

**ファイル:** `components/memory/EvidenceLink.tsx`

**Props:**
```typescript
interface EvidenceLinkProps {
  date: string;        // "1/5"形式
  description: string; // "朝5時起床達成"
  onPress?: () => void;
}
```

**スタイル:**
- 左に日付（Inter, 12px, textSecondary）
- 右に説明（Noto Sans JP, 14px, textPrimary）
- タップ可能（→ 詳細モーダル）

### 2. EvidenceLinksListコンポーネント作成

**ファイル:** `components/memory/EvidenceLinksList.tsx`

**Props:**
```typescript
interface EvidenceLinksListProps {
  links: EvidenceLink[];
  maxDisplay?: number;  // default 3
}
```

**レイアウト:**
```
🔗 Evidence Links
├ 1/5: 朝5時起床達成
├ 1/8: スマホ制限開始
└ 1/12: 今日の発言「少し自信がついた」
```

### 3. Mirror Feedbackへの統合

**対象ファイル:** `components/checkin/MirrorFeedback.tsx`

Mirror Feedbackの4要素目として表示:
1. Observed Change
2. Hypothesis
3. Next Experiment
4. **Evidence Links** ← 追加

### 4. データ取得

**API連携:**
```typescript
interface MirrorFeedbackResponse {
  observedChange: string;
  hypothesis: string;
  nextExperiment: string;
  evidenceLinks: EvidenceLink[];  // ← 追加
}
```

### 5. 詳細モーダル

**タップ時の動作:**
- Evidenceの全文を表示
- 日付、カテゴリ、詳細内容
- 「閉じる」ボタン

---

## UI仕様

```
┌────────────────────────────────────┐
│ 🔗 Evidence Links                  │
│                                    │
│ ├ 📅 1/5   朝5時起床達成           │
│ ├ 📅 1/8   スマホ制限開始          │
│ └ 📅 1/12  「少し自信がついた」     │
│                                    │
└────────────────────────────────────┘
```

**スタイル:**
- 背景: surface (#FAF8F5)
- 角丸: 12px
- パディング: 16px
- フォント: Noto Sans JP, 14px

---

## 完了条件

- [ ] EvidenceLinkコンポーネントが実装されている
- [ ] Mirror Feedbackに統合されている
- [ ] 過去のEvidenceがリンク表示される
- [ ] タップで詳細モーダルが開く
- [ ] 最大3件まで表示（超過時は「もっと見る」）

---

## 関連ドキュメント

- [ux/ux-spec-v0.1.md](../../docs/ux/ux-spec-v0.1.md)
- [006-memory-system.md](../../docs/006-memory-system.md)
