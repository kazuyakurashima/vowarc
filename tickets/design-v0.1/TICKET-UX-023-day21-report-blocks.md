# TICKET-UX-023: Day21レポート8ブロック実装

## 概要

Day21 Commitment Reportの必須表示8ブロックを実装する。

## 優先度

**高**

## 見積もり

3日

## 依存関係

- 前提: TICKET-UX-022, 007-day21-judgment-gate
- 後続: TICKET-PAY-003

---

## タスク

### 1. ProgressTrajectoryBlockコンポーネント

**ファイル:** `components/day21/ProgressTrajectoryBlock.tsx`

**表示内容:**
- ティアバッジ（On Track / At Risk / Needs Reset）
- 4つのメトリクス（プログレスバー形式）
- 総合スコア
- 算出根拠テキスト

**Props:**
```typescript
interface Props {
  tier: 'on_track' | 'at_risk' | 'needs_reset';
  metrics: {
    checkinRate: number;
    ifThenRate: number;
    evidenceRate: number;
    commitmentRate: number;
  };
}
```

### 2. ResilienceBlockコンポーネント

**ファイル:** `components/day21/ResilienceBlock.tsx`

**表示内容:**
- 踏みとどまり回数（大きな数字）
- カウント根拠リスト

### 3. EvidenceHighlightsBlockコンポーネント

**ファイル:** `components/day21/EvidenceHighlightsBlock.tsx`

**表示内容:**
- AIが選んだ3つのEvidence
- 日付、タイトル、解説
- 「すべてのEvidenceを見る」リンク

### 4. VowEvolutionBlockコンポーネント

**ファイル:** `components/day21/VowEvolutionBlock.tsx`

**表示内容:**
- v1（初期）の内容
- 矢印
- v2（現在）の内容
- 「編集する」ボタン

### 5. PotentialStatementBlockコンポーネント

**ファイル:** `components/day21/PotentialStatementBlock.tsx`

**表示内容:**
- AIが見ている可能性テキスト
- 根拠となるEvidence

### 6. ToughLovePreviewBlockコンポーネント

**ファイル:** `components/day21/ToughLovePreviewBlock.tsx`

**表示内容:**
- 今後指摘する可能性がある点
- 「次へ: 介入設定」ボタン

### 7. InterventionSettingsコンポーネント（別画面）

**ファイル:** `components/day21/InterventionSettings.tsx`

**表示内容:**
- チェックボックス（逃げ癖/時間言い訳/提出物/逸脱会話）
- スライダー（穏やか/標準/強め）
- 人格否定不可の説明

### 8. ReSignatureコンポーネント（別画面）

**ファイル:** `components/day21/ReSignature.tsx`

**表示内容:**
- 宣言文テンプレート
- 入力欄（今の自分/理想の自分）
- 署名パッド
- Deep Gold枠線

---

## API連携

```typescript
// GET /api/day21/report
interface Day21ReportResponse {
  metrics: ProgressMetrics;
  tier: Tier;
  resilienceCount: number;
  resilienceReasons: string[];
  evidenceHighlights: Evidence[];
  vowEvolution: { v1: string; v2: string };
  potentialStatement: string;
  potentialEvidence: Evidence[];
  toughLovePreview: string[];
}
```

---

## 完了条件

- [ ] 8ブロック全てが実装されている
- [ ] Progressive Disclosureで順次表示
- [ ] ティアバッジにDeep Gold適用（On Track時）
- [ ] 数値が大きく表示される
- [ ] 算出根拠が開示されている
- [ ] 誓い編集が可能
- [ ] 介入設定が保存される
- [ ] 署名パッドが動作する

---

## 関連ドキュメント

- [design/screens/day21-commitment-report.md](../../design/screens/day21-commitment-report.md)
- [007-day21-judgment-gate.md](../../docs/007-day21-judgment-gate.md)
