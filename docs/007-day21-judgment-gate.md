# 007: Day 21 Judgment Gate（継続判断儀式）

## 概要

Day 21の継続判断儀式を実装する。決済ではなく、心理的契約を更新する「門（Gate）」として設計。Commitment Reportの表示、誓いの更新、Tough Love合意、継続/停止の選択を行う。

## Phase

**Phase A: MVP**

## 優先度

高

## 依存関係

- 前提: 003 ホーム画面, 005 AIコーチ, 006 記憶システム, 009 Evidence Journal, 010 Small Wins
- 後続: 008 課金システム, 012 Exit Ritual（基本版）

---

## 機能要件

### 1. 体験の基本構造（儀式設計）

1. **静かな導入（Ritual Intro）**
   - 「ここまで来た事実」をまず承認

2. **鏡の提示（The Mirror）**
   - 3週間の証拠と変化を可視化

3. **誓いの結晶化（Vow Crystallization）**
   - 志/誓いを"今の言葉"に更新

4. **厳しさへの合意（Consent to Tough Love）**
   - 有料期の介入強度を合意

5. **継続/停止の選択（Choice）**
   - 継続 = 課金確認画面へ
   - 停止 = Exit Ritual へ

### 2. Commitment Report（必須表示項目）

**Evidences（積み上げた証拠）:**
- Evidence Journal提出物一覧
- AIが選ぶハイライト3つ

**踏みとどまり回数（Resilience Count）:**
- 諦めそうになった時、踏みとどまった回数
- 算出根拠を明示

**志の結晶化:**
- v1（初期）→ v2（現在）の差分表示
- ユーザー編集可

**AIが見ている可能性（Potential Statement）:**
- 観測変化・証拠から導く根拠付き

**行動継続スコア（Progress Trajectory）:**
- ティア表示（On Track / At Risk / Needs Reset）
- 算出根拠の完全開示
  - チェックイン継続率
  - If-Then発動率
  - Evidence提出率
  - コミット履行率

**Tough Loveの予兆:**
- 今後の課題の突きつけ
- 「有料期間では厳しく指摘していいですか？」の合意問い

### 3. 誓い更新

- 3行の志を編集/確定
- バージョン履歴に保存

### 4. 介入合意（Tough Love Consent）

**介入領域（チェックボックス）:**
- 逃げ癖
- 時間言い訳
- 提出物
- 逸脱会話

**介入強度（スライダー）:**
- 穏やか / 標準 / 強め
- 人格否定は不可（説明表示）

### 5. 心理的契約の再署名

```
「私はこの3ヶ月で、[今の自分]を卒業し、[理想の自分]になる」
```
- 署名（指でサイン）

### 6. 継続/停止の選択

**継続の場合:**
- 決済確認画面へ遷移
- 課金額表示
- 「課金を確定する」ボタン

**停止の場合:**
- Exit Ritual（学び回収）へ遷移
- 誠実に関係を閉じる

---

## UI/UX要件

### 儀式デザイン仕様

**Ritual Transitions（儀式的トランジション）**
- 画面遷移: **1.8s Ease-in-out**（通常画面より長く、儀式感を演出）
- Progressive Disclosure: 情報は段階的に表示、一度に多くを見せない
- フェードイン: ゆっくりとした出現で思考に沈潜させる

**Zazen Screen（坐禅スクリーン）**
- intro.tsx / re-sign.tsx で意図的な「間」を設ける
- 呼吸を促すような空白と静けさ
- 「読ませる」より「感じさせる」設計

**ハプティック（触覚フィードバック）**
- **Reflection Pulse**: 60bpm（心拍に近いリズム）でReport閲覧中に静かな振動
- **Vow Impact**: 誓い署名時の強い単発フィードバック
- 選択ボタン押下時: 控えめなフィードバック

**カラー・タイポグラフィ**
- 背景: Ecru #F7F3F0
- サーフェス: Pearl #FAF8F5
- **特別アクセント: Deep Gold #C9A961**（Day21儀式画面専用、厳かさを演出）
  - 使用箇所: 誓い再署名の枠線、重要な見出し、CTA
  - 使用量: 最小限（Color Ratio 3%内）
- 見出し: Noto Serif JP (Light) — 品格と静けさ
- 本文: Noto Sans JP (Regular)
- Line Height: 1.9〜2.1（日本語「間」を活かす）
- Type-to-Space Ratio: 15:85

**禁止事項**
- 派手なアニメーション（バウンス、シェイク等）
- ゲーミフィケーション的演出（紙吹雪、スター等）
- 急かすような表示（カウントダウン等）

### 画面フロー

```
(day21)/
├── intro.tsx           # 静かな導入
├── report.tsx          # Commitment Report
├── vow-update.tsx      # 誓い更新
├── tough-love.tsx      # 介入合意
├── re-sign.tsx         # 心理的契約再署名
├── choice.tsx          # 継続/停止選択
├── payment-confirm.tsx # 決済確認（継続時）
└── exit.tsx            # Exit Ritual（停止時）
```

### レイアウト例（Report画面）

```
┌─────────────────────────────┐
│  21日間を振り返る           │
├─────────────────────────────┤
│                              │
│  📊 あなたの行動継続         │
│  ┌───────────────────────┐  │
│  │  On Track             │  │
│  │  ────────────────────  │  │
│  │  チェックイン: 19/21   │  │
│  │  If-Then発動: 8/12     │  │
│  │  Evidence: 5/6         │  │
│  │  コミット履行: 14/17   │  │
│  └───────────────────────┘  │
│                              │
│  💪 踏みとどまり回数: 4回    │
│                              │
│  ✨ 証拠のハイライト         │
│  ├ 1月5日: 朝5時起床達成    │
│  ├ 1月10日: コード100行     │
│  └ 1月15日: 誘惑に勝った    │
│                              │
│  📝 志の進化                 │
│  v1: ぼんやりした目標        │
│  ↓                           │
│  v2: 3行に結晶化             │
│                              │
│           [次へ]             │
└─────────────────────────────┘
```

---

## データ計算

### 行動継続ティア判定

```typescript
interface ProgressMetrics {
  checkinRate: number;      // チェックイン継続率
  ifThenRate: number;       // If-Then発動率
  evidenceRate: number;     // Evidence提出率
  commitmentRate: number;   // コミット履行率
}

function calculateTier(metrics: ProgressMetrics): 'on_track' | 'at_risk' | 'needs_reset' {
  const avg = (
    metrics.checkinRate +
    metrics.ifThenRate +
    metrics.evidenceRate +
    metrics.commitmentRate
  ) / 4;

  if (avg >= 0.7) return 'on_track';
  if (avg >= 0.4) return 'at_risk';
  return 'needs_reset';
}
```

### 踏みとどまり回数

```typescript
function calculateResilienceCount(userId: string): number {
  // 以下をカウント:
  // 1. チェックインで「諦めそう」「やめたい」等の後に戻ってきた回数
  // 2. If-Then発動回数
  // 3. 離脱後復帰（2日以上空いて戻った）回数
}
```

---

## API設計

### GET /api/day21/report

Day 21レポートデータを取得

**Response:**
```json
{
  "metrics": {
    "checkin_rate": 0.9,
    "if_then_rate": 0.67,
    "evidence_rate": 0.83,
    "commitment_rate": 0.82
  },
  "tier": "on_track",
  "resilience_count": 4,
  "evidence_highlights": [...],
  "vow_evolution": {
    "v1": "...",
    "v2": "..."
  },
  "potential_statement": "...",
  "tough_love_preview": "..."
}
```

### POST /api/day21/complete

Day 21の選択を記録

**Request:**
```json
{
  "choice": "continue",
  "updated_vow": "更新された誓い",
  "tough_love_settings": {
    "areas": ["逃げ癖", "時間言い訳"],
    "intensity": "standard"
  }
}
```

---

## Todo

### レポート生成
- [x] 各種メトリクス計算ロジック（Ticket 010 Small Wins を再利用）
- [x] ティア判定ロジック（Ticket 010 Small Wins を再利用）
- [x] 踏みとどまり回数計算（If-Then + 復帰 + 粘り）
- [x] AIによるPotential Statement生成
- [x] Tough Love予兆テキスト生成

### 画面実装
- [x] intro.tsx - 静かな導入
- [x] report.tsx - Commitment Report
- [x] vow-update.tsx - 誓い更新
- [x] tough-love.tsx - 介入合意
- [x] re-sign.tsx - 再署名
- [x] choice.tsx - 継続/停止選択

### UI/UX
- [x] メトリクス表示コンポーネント（ProgressBar）
- [x] ティア表示カード（TierBadge）
- [x] 誓い編集フォーム
- [x] 介入設定チェックボックス
- [x] 署名コンポーネント（PanResponder）

### API実装
- [x] GET /api/day21/report
- [x] POST /api/day21/complete
- [x] 誓い更新API連携（complete API内で処理）

**実装完了: 2026-01-13**

---

## 実装ファイル一覧

### サービス
- `lib/day21/report.ts` - レポート生成ロジック、踏みとどまり計算、AI生成

### API
- `app/api/day21/report+api.ts` - GET /api/day21/report
- `app/api/day21/complete+api.ts` - POST /api/day21/complete

### フック
- `hooks/data/useDay21Report.ts` - Day21レポートデータフック

### 画面
- `app/(day21)/_layout.tsx` - Day21フロー用レイアウト
- `app/(day21)/intro.tsx` - 静かな導入
- `app/(day21)/report.tsx` - Commitment Report
- `app/(day21)/vow-update.tsx` - 誓い更新
- `app/(day21)/tough-love.tsx` - 介入合意
- `app/(day21)/re-sign.tsx` - 再署名
- `app/(day21)/choice.tsx` - 継続/停止選択

---

## 既知の制限事項（MVP）

### Day21自動遷移
- **現行**: 手動で `/day21/intro` に遷移する必要あり
- **Phase B対応**: ホーム画面でDay >= 21を検知して自動遷移

### 決済連携
- **現行**: 継続選択後、Alertで仮の成功表示のみ
- **Phase B対応**: Ticket 008（課金システム）で実装

### Exit Ritual
- **現行**: 停止選択後、Alertで簡易メッセージのみ
- **Phase B対応**: Ticket 012（Exit Ritual）で詳細実装

### Day21未到達時のハンドリング
- **現行**: API は 400 を返し、UIはエラー表示のみ
- **Phase B対応**: ホーム画面で Day < 21 を検知し、Day21フローへの遷移を防ぐ

### 環境変数
- `EXPO_PUBLIC_OPENAI_API_KEY` が必須（他のAIサービスと統一）

---

## 完了条件

1. Day 21に自動的に儀式画面が表示される
2. 行動継続ティアと算出根拠が表示される
3. 踏みとどまり回数が表示される
4. 誓いを更新できる
5. Tough Love設定ができる
6. 継続/停止を選択できる
7. 継続時は決済確認画面へ遷移
8. 停止時はExit Ritual（MVP: 簡易版）へ遷移
