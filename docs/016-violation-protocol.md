# 016: 契約違反プロトコル（MVP版）

## 概要

コミット不履行、無断離脱、虚偽報告などの契約違反に対するプロトコルを実装する。**MVP範囲: 違反検出 + Warning + Renegotiation + Termination Offer基盤（データ構造・検出ロジック・文言テンプレート）を実装**。Termination Offer自動UIは手動通知で代替、有料期（Week 4以降）で自動化判断。

**要件背景:**
- requirements.md で契約違反プロトコルがMVP必須として指定
- Trial期間（Day 0-21）では段階的対応が完遂しにくいため、MVPでは「仕組みの存在」を担保し、実運用はWeek 4以降に寄せる

## Phase

**Phase A: MVP**

## 優先度

中（requirements.md で必須）

## 依存関係

- 前提: 005 AIコーチ基本, 010 Small Wins基本
- 後続: なし（Termination UI拡張は運用判断で Phase B 対応可）

---

## 機能要件

### 1. 契約違反の定義（MVP）

| 違反タイプ | 定義 | 検出方法 |
|-----------|------|---------|
| コミット不履行 | 週の最小コミット未達 | コミット完了率の計算 |
| 無断離脱 | チェックイン未実施が連続3日以上 | チェックイン履歴の確認 |
| 虚偽報告 | 提出物偽装/明確な矛盾の反復 | AI検出 + 手動確認 |

### 2. 段階的対応プロセス（MVP版）

```
[違反検出] → [Warning] → [Renegotiation] → (Termination Offer)
  ↓              ↓              ↓                    ↓
自動検出      理由探索      目標再合意          ※手動対応/Phase B
             コミット最小化   再署名
             If-Then再設計
```

**MVP範囲:**
- **違反検出（自動）**: バッチまたはリアルタイム検出
- **Warning（必須）**: 初回違反時の自動モーダル表示
- **Renegotiation（必須）**: 2週連続違反時の再契約フロー

**MVP範囲外（手動対応 or Phase B）:**
- **Termination Offer**: 3週連続違反は手動判断、または有料期（Week 4以降）で自動化

### 3. Warning（警告）

**トリガー:**
- 初回の違反検出時

**対応内容:**
1. 理由探索: 「何があったのか教えてください」
2. コミット最小化: 「今週のコミットを減らしましょうか」
3. If-Then再設計: 「障害を乗り越える新しい計画を立てましょう」

**UI:**
- 穏やかなトーンのモーダル
- 選択肢を提示

### 4. Renegotiation（再交渉）

**トリガー:**
- Warning後も改善が見られない
- 2週連続で違反

**対応内容:**
1. 目標の妥当性再確認: 「目標を見直しましょう」
2. 継続意思確認: 「本当に続けたいですか？」
3. 再署名: 心理的契約の更新

**UI:**
- より真剣なトーンの画面
- 目標編集機能
- 再署名フォーム

### 5. Termination Offer（契約終了提案）← MVP範囲（仕組み担保、発動は手動）

**要件背景:**
- requirements.md でTermination Offer（契約終了＋全額返金）がMVP必須
- ただしTrial期間（Day 0-21）では3週連続違反が発生しにくい
- 案B: 仕組みとしてはMVPで担保、実発動は手動運用

**トリガー:**
- Renegotiation後も改善なし
- 3週連続で違反

**対応内容:**
- コーチ側から契約終了＋全額返金を提案

**MVP実装範囲:**
1. **データ構造**: termination_recordsテーブル（必須）
2. **検出ロジック**: 3週連続違反の自動検出（必須）
3. **文言テンプレート**: Termination Copy（5要素）を文書化（必須）
4. **発動UI**: 簡易版（または手動通知）
   - 自動モーダルは未実装
   - 管理者向けダッシュボードまたは手動メール通知で代替
   - Week 4以降の有料期で実運用・自動化判断

---

## Termination Copy要件（MVP必須・手動対応時も適用）

ユーザーに「見捨てられた」体験を残さないための必須構造:

### 1. 可能性への信頼（Belief）

```
「あなたの可能性を信じています。」
```

### 2. 誠実さの理由（Integrity Reason）

```
「ぬるま湯の関係を続けることは、あなたの誓いに対して不誠実になりうると考えています。」
```
- 人格ではなく「関係の設計」に向けた言葉

### 3. 選択肢の提示（Agency）

```
以下から選んでください:
1. 一時停止（クールダウン）
2. 目標の再設計
3. 契約終了＋返金
```

### 4. 成果の回収（Closure）

```
「ここまでの3週間で積み上げた証拠と変化:
 - チェックイン: 12日
 - If-Then発動: 8回
 - 重要な気づき: 〇〇

 ここまでのあなたは無駄ではありません。」
```

### 5. 安全の確保（Safety）

```
「必要であれば、専門的なサポートをご案内します。」
（危機兆候時は別プロトコル）
```

---

## データモデル

### violation_logs テーブル

```sql
CREATE TABLE violation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'commitment_miss' | 'absence' | 'false_report'
  severity INTEGER DEFAULT 1, -- 1=Warning, 2=Renegotiation, 3=Termination
  detected_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  resolution VARCHAR(50), -- 'warning_accepted' | 'renegotiated' | 'terminated' | 'continued'
  notes TEXT
);
```

### termination_records テーブル（MVP必須）

```sql
CREATE TABLE termination_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  reason VARCHAR(100) NOT NULL,
  initiated_by VARCHAR(20) NOT NULL, -- 'system' | 'user' | 'coach' | 'manual'
  final_choice VARCHAR(50) NOT NULL, -- 'pause' | 'redesign' | 'terminate'
  refund_amount INTEGER,
  evidence_summary JSONB,
  notification_method VARCHAR(50), -- 'auto_ui' | 'manual_email' | 'dashboard' (MVP: 手動通知の記録)
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 違反検出ロジック

### コミット不履行検出

```typescript
async function detectCommitmentViolation(userId: string): Promise<boolean> {
  const weekStart = getWeekStart();
  const commitments = await getCommitments(userId, weekStart);

  const completedCount = commitments.filter(c => c.status === 'completed').length;
  const totalCount = commitments.length;

  // 50%未満で違反
  return totalCount > 0 && (completedCount / totalCount) < 0.5;
}
```

### 無断離脱検出

```typescript
async function detectAbsence(userId: string): Promise<boolean> {
  const recentCheckins = await getRecentCheckins(userId, 3);
  const today = new Date();
  const threeDaysAgo = subDays(today, 3);

  // 直近3日間にチェックインがない
  return !recentCheckins.some(c =>
    new Date(c.date) >= threeDaysAgo
  );
}
```

### 虚偽報告検出（AI支援）

> **⚠️ MVP実装状況**: この機能はMVPでは未実装です。
> `false_report` 違反タイプはスキーマに定義されていますが、自動検出は行われません。
> MVPでは、管理者/コーチが手動で `violation_logs` に INSERT して対応します。
> AI分析による自動検出は将来バージョンで実装予定です。

```typescript
// FUTURE FEATURE - Not implemented in MVP
async function detectFalseReport(
  userId: string,
  recentStatements: string[]
): Promise<{detected: boolean; evidence: string}> {
  const prompt = `
以下のユーザー発言に、明確な矛盾や虚偽の可能性がないか分析してください:

${recentStatements.join('\n')}

矛盾がある場合は、具体的な箇所を指摘してください。
`;

  // AI分析の結果を返す
}
```

---

## UI設計

### Warning モーダル

```
┌─────────────────────────────┐
│  ちょっと立ち止まりましょう  │
├─────────────────────────────┤
│                              │
│  今週のコミット達成率が       │
│  低くなっています。          │
│                              │
│  何かあったのでしょうか？     │
│                              │
│  [話を聞かせてください]       │
│                              │
│  ─────────────────────────  │
│  一緒に計画を見直しましょう:  │
│  [コミットを減らす]           │
│  [障害を再設計する]           │
│  [このまま続ける]             │
│                              │
└─────────────────────────────┘
```

### Renegotiation 画面

```
┌─────────────────────────────┐
│  目標を見直しましょう        │
├─────────────────────────────┤
│                              │
│  現在の状況を見ると、         │
│  当初の計画が難しくなって     │
│  いるようです。              │
│                              │
│  📝 目標の編集               │
│  [________________]          │
│                              │
│  📅 期限の見直し             │
│  [▼ 選択]                   │
│                              │
│  💪 継続しますか？            │
│  [はい、続けます]             │
│  [一度休憩したい]             │
│  [終了を考えたい]             │
│                              │
│  再署名:                     │
│  ┌───────────────────────┐  │
│  │ (署名欄)              │  │
│  └───────────────────────┘  │
│                              │
└─────────────────────────────┘
```

### Termination Offer 画面

```
┌─────────────────────────────┐
│  正直にお話しします          │
├─────────────────────────────┤
│                              │
│  あなたの可能性を             │
│  信じています。               │
│                              │
│  ただ、ぬるま湯の関係を       │
│  続けることは、あなたの       │
│  誓いに対して不誠実に         │
│  なりうると考えています。     │
│                              │
│  ─────────────────────────  │
│  これまでの成果:              │
│  ├ チェックイン: 25日        │
│  ├ If-Then発動: 15回         │
│  └ 重要な気づき: 3つ         │
│                              │
│  ここまでのあなたは           │
│  無駄ではありません。         │
│                              │
│  ─────────────────────────  │
│  選択してください:            │
│  [一時停止（クールダウン）]    │
│  [目標を再設計する]           │
│  [契約終了＋全額返金]         │
│                              │
└─────────────────────────────┘
```

---

## Todo（MVP範囲）

### 違反検出（必須）
- [ ] コミット不履行検出ロジック
- [ ] 無断離脱検出ロジック
- [ ] 虚偽報告検出（AI支援・簡易版）
- [ ] 定期チェックバッチ（日次）

### データモデル（必須）
- [ ] violation_logs テーブル作成
- [ ] termination_records テーブル作成 ← MVP必須に変更

### Warning実装（必須）
- [ ] Warningモーダル
- [ ] 理由入力フォーム
- [ ] コミット最小化フロー
- [ ] If-Then再設計フロー

### Renegotiation実装（必須）
- [ ] Renegotiation画面
- [ ] 目標編集機能
- [ ] 再署名機能
- [ ] 継続意思確認

### Termination Offer実装（MVP: 仕組み担保、発動手動） ← 追加
- [ ] 3週連続違反の自動検出ロジック
- [ ] Termination Copy文言テンプレート（5要素）を文書/DB保存
- [ ] 成果サマリー生成ロジック（evidence_summary）
- [ ] 管理者向けTermination通知（ダッシュボード or メール）
- [ ] 手動Termination記録機能（termination_recordsへ記録）
- ~~自動Termination Offer画面~~ → Phase B（手動通知で代替）

### ログ・通知（必須）
- [ ] 違反ログの記録
- [ ] 3週連続違反時の管理者アラート

---

## 完了条件（MVP範囲）

### Warning → Renegotiation（必須）
1. 3種類の違反が自動検出される
2. **Warning → Renegotiation**の段階的対応ができる
3. Warning/Renegotiationで適切なUI/コピーが表示される
4. ユーザーが選択肢を選べる（Warning/Renegotiation）
5. 違反ログが記録される
6. Renegotiation時に目標編集と再署名ができる

### Termination Offer（仕組み担保、発動手動）
7. **3週連続違反を自動検出できる**
8. **termination_recordsテーブルが存在する**
9. **Termination Copy（5要素）が文書化・テンプレート化されている**
10. **成果サマリー（evidence_summary）を自動生成できる**
11. **管理者が手動でTermination記録を作成できる**
12. **3週連続違反時に管理者へ通知される**

**Phase B（自動化）:**
- Termination Offer自動UI（MVP: 管理者ダッシュボード/メール通知で代替）
