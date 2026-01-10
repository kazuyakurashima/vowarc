# Design System v0.1 実装チケット

## 概要

Design System v0.1の実装に必要なチケット一覧。
1-3日の粒度で分割されており、依存関係順に実装する。

---

## チケット一覧

### Design System (DS)

| ID | タイトル | 見積もり | 依存 | 状態 |
|---|---|---|---|---|
| TICKET-DS-001 | Design Tokens実装 | 1-2日 | - | 未着手 |
| TICKET-DS-002 | フォント導入 | 1日 | DS-001 | 未着手 |
| TICKET-DS-003 | 基本コンポーネント実装 | 2-3日 | DS-001, DS-002 | 未着手 |

### UX/画面 (UX)

| ID | タイトル | 見積もり | 依存 | 状態 |
|---|---|---|---|---|
| TICKET-UX-021 | ホーム画面テーマ適用 | 2日 | DS-001〜003 | 未着手 |
| TICKET-UX-022 | Day21儀式画面テーマ適用 | 2-3日 | DS-001〜003 | 未着手 |
| TICKET-UX-023 | Day21レポート8ブロック実装 | 3日 | UX-022 | 未着手 |

### 音声UI (VOICE)

| ID | タイトル | 見積もり | 依存 | 状態 |
|---|---|---|---|---|
| TICKET-VOICE-005 | Orb UI実装 | 2-3日 | DS-001, DS-002 | 未着手 |
| TICKET-VOICE-006 | Subtitles UI実装 | 1日 | VOICE-005 | 未着手 |
| TICKET-VOICE-007 | 音声UI Haptics実装 | 0.5日 | DS-001, VOICE-005 | 未着手 |

### 記憶可視化 (MEM)

| ID | タイトル | 見積もり | 依存 | 状態 |
|---|---|---|---|---|
| TICKET-MEM-010 | Evidence Links実装 | 1-2日 | 006-memory | 未着手 |

### 課金 (PAY)

| ID | タイトル | 見積もり | 依存 | 状態 |
|---|---|---|---|---|
| TICKET-PAY-003 | 決済確認画面（透明性重視） | 1-2日 | UX-022, 008-payment | 未着手 |

---

## 推奨実装順序

```
Phase 1: Foundation (3-5日)
├── TICKET-DS-001: Design Tokens
├── TICKET-DS-002: フォント導入
└── TICKET-DS-003: 基本コンポーネント

Phase 2: Core Screens (5-7日)
├── TICKET-UX-021: ホーム画面
├── TICKET-VOICE-005: Orb UI
├── TICKET-VOICE-006: Subtitles
└── TICKET-VOICE-007: Haptics

Phase 3: Day21 & Memory (5-7日)
├── TICKET-UX-022: Day21儀式テーマ
├── TICKET-UX-023: Day21レポートブロック
├── TICKET-MEM-010: Evidence Links
└── TICKET-PAY-003: 決済確認画面
```

---

## 関連ドキュメント

- [design-system-v0.1.md](../../design/design-system-v0.1.md) - Design System本体
- [home.md](../../design/screens/home.md) - ホーム画面スペック
- [voice-checkin.md](../../design/screens/voice-checkin.md) - 音声チェックインスペック
- [day21-commitment-report.md](../../design/screens/day21-commitment-report.md) - Day21スペック
- [ux/ux-spec-v0.1.md](../../docs/ux/ux-spec-v0.1.md) - UX Spec v0.1

---

## 変更履歴

| 日付 | 変更内容 |
|---|---|
| 2025-01-09 | 初版作成 |
