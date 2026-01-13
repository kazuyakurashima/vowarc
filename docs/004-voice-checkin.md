# 004: 音声チェックイン機能

## 概要

フルスクリーンの音声チェックイン機能。ユーザーが音声で振り返りを行い、AIがリアルタイムで応答する没入体験を提供する。

## Phase

**Phase A: MVP**

## 優先度

高

## 依存関係

- 前提: 005 AIコーチ基本, 006 記憶システム
- 後続: なし（MVP完結）

---

## 機能要件

### 1. 音声録音

- マイクアクセス許可
- 録音開始/停止
- 録音時間表示
- 波形ビジュアライゼーション

### 2. Speech-to-Text

- リアルタイム文字起こし（デバイスSTTのみ対応）
- Whisper API（録音後） または デバイスSTT（リアルタイム）を使用
- 文字起こし結果の表示

> **Note**: リアルタイム文字起こしはデバイスSTT（react-native-voice）のみ対応。Whisper APIは録音完了後の処理。

### 3. AIコーチ応答

- 文字起こし結果をAIに送信
- Mirror Feedback形式で応答
  1. Observed Change（観測変化）
  2. Hypothesis（仮説）
  3. Next Experiment（次の実験）
  4. Evidence Links（根拠参照）

### 4. 音声体験

- 沈黙を許容（考える時間を尊重）
- AIの応答をテキスト表示
- Text-to-Speech（オプション）

### 5. If-Then発動記録（MVP必須） ← 追加

**要件背景:**
- 010 Small WinsでIf-Then発動率がDay21のティア算出に必要
- チェックイン時に「障害に遭遇したか？」「If-Thenを実行したか？」を記録

**実装方針:**
- **UI質問**: チェックイン最後に簡易質問を表示（明示入力）
- **AI自動判定**: 未回答時の補完（チェックイン内容から推定）

**質問フロー:**
1. 「今日、予定していた障害（誘惑、時間不足等）に遭遇しましたか？」
   - [ ] はい / [ ] いいえ
2. 「はい」の場合: 「事前に決めていたIf-Thenプランを実行できましたか？」
   - [ ] 実行できた / [ ] 実行できなかった

**記録:**
- `checkins.if_then_triggered = true` (If-Then実行できた場合)
- AI自動判定: チェックイン内容に「誘惑」「障害」「乗り越えた」等のキーワードがあれば補完

### 6. チェックイン完了

- 記録の保存（If-Then記録含む）
- ホームへ戻る

---

## UI/UX要件

### レイアウト構成

```
┌─────────────────────────────┐
│         [×]                 │  ← 閉じる
│                              │
│                              │
│      ╭────────────╮          │
│      │  ~~~〜〜~   │          │  ← 波形
│      │   (録音中)  │          │
│      ╰────────────╯          │
│                              │
│      "話してください..."      │
│                              │
│   [リアルタイム文字起こし]     │
│                              │
├─────────────────────────────┤
│                              │
│    [🔴 録音] [⏹ 停止]         │
│                              │
└─────────────────────────────┘
```

**Note:** 上記は初期ワイヤーフレーム。Design System v0.1では**Orb UI**を採用し、Orbタップで録音開始/停止を行います。詳細は[design/screens/voice-checkin.md](../design/screens/voice-checkin.md)および[ux/ux-spec-v0.1.md](ux/ux-spec-v0.1.md)を参照。

### AI応答画面

```
┌─────────────────────────────┐
│                              │
│  あなたの言葉:               │
│  "今日は朝起きれなかった..."  │
│                              │
├─────────────────────────────┤
│  AIからの応答:               │
│                              │
│  【観測した変化】             │
│  3日前は5時に起きると言って   │
│  いましたが、今日は起きれ     │
│  なかったとのこと。           │
│                              │
│  【仮説】                     │
│  夜更かしの習慣が影響して     │
│  いる可能性があります。        │
│                              │
│  【次の実験】                 │
│  If 23時になったら            │
│  Then スマホを寝室外に置く    │
│                              │
│  [コミットメントとして追加]    │
│                              │
└─────────────────────────────┘
```

### If-Then確認画面 ← 追加

```
┌─────────────────────────────┐
│  最後にひとつだけ            │
├─────────────────────────────┤
│                              │
│  今日、予定していた障害       │
│  （誘惑、時間不足等）に       │
│  遭遇しましたか？            │
│                              │
│  [はい]  [いいえ]           │
│                              │
│  ─────────────────────────  │
│  （「はい」選択時のみ表示）   │
│                              │
│  事前に決めていたIf-Thenを   │
│  実行できましたか？          │
│                              │
│  [実行できた] [実行できなかった]│
│                              │
│  ※ 実行できなかった場合でも │
│    記録として残ります        │
│                              │
│           [完了]             │
└─────────────────────────────┘
```

### デザイン原則

- フルスクリーン体験
- 目を閉じても操作できる最短導線
- 抽象的なビジュアル（波形）

### Voice-First UX デザイン仕様

**Orb Abstraction（抽象表現）**
- AIは「アバター」ではなく「Orb（球体/波形）」として表現
- 状態に応じた波形アニメーション:
  - 待機中: ゆっくり呼吸するような波形
  - 録音中: 脈動するOrb（音量に連動）
  - AI応答中: 流れるような波形
- 色温度: Ecru (#F7F3F0) 基調、低彩度

**Subtitles UI（字幕表示）**
- 位置: 画面中央やや下
- 透明度: **40%**（控えめだが読める）
- フォント: Noto Sans JP、本文より小さめ
- 目的: 音声が主、テキストは補助

**録音UI**
- 録音ボタン: 大きく目立つ配置（中央下部）
- 録音インジケーター: Orbの脈動で視覚化
- 沈黙許容: 無音でも急かさない、カウントダウン等なし

**ハプティック（触覚フィードバック）**
- 録音開始: medium（haptics.medium）
- 録音中: Reflection Pulse（60bpm、軽い連続振動）
- 送信タップ: medium
- チェックイン完了: Completion Breath（呼吸のような長めの振動、Medium→Light）
- 誓い署名完了: Vow Impact（heavy）

**カラー・余白**
- Type-to-Space Ratio: 15:85（テキスト15%、余白85%）
- 背景: Ecru #F7F3F0
- テキスト: Charcoal #2C2C2C
- アクセント: 最小限に使用

---

## 技術要件

### 音声録音

```typescript
import { Audio } from 'expo-av';

// 録音設定
const recordingOptions = {
  android: {
    extension: '.m4a',
    outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
    audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
  },
  ios: {
    extension: '.m4a',
    audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
    outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
  },
};
```

### Speech-to-Text

**オプション1: Whisper API**
```typescript
const transcribe = async (audioUri: string) => {
  const formData = new FormData();
  formData.append('file', {
    uri: audioUri,
    type: 'audio/m4a',
    name: 'recording.m4a',
  });
  formData.append('model', 'whisper-1');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  return response.json();
};
```

**オプション2: デバイスのSTT機能 (ローカル)**
- `react-native-voice` または `@react-native-voice/voice` を使用
- ネイティブデバイスのSTT機能（iOS Speech Framework / Android SpeechRecognizer）
- より高速・オフライン対応だが精度はデバイス依存
- **リアルタイム文字起こしに対応**（Whisper APIは録音完了後のみ）

> **Note**: リアルタイム文字起こしが必要な場合はデバイスSTT（オプション2）を使用。Whisper API（オプション1）は録音完了後の一括処理のみ。

---

## データ保存

### checkins テーブル

```sql
INSERT INTO checkins (
  user_id,
  date,
  type,
  transcript,
  audio_url,
  mood,
  if_then_triggered, -- ← 追加（010 Small Wins連携）
  created_at
) VALUES (
  $user_id,
  CURRENT_DATE,
  'voice',
  $transcript,
  $audio_storage_url,
  $mood,
  $if_then_triggered, -- 質問回答 or AI自動判定結果
  NOW()
);
```

### 音声ファイル

- Supabase Storageに保存
- ファイル名: `{user_id}/{date}_{timestamp}.m4a`

---

## Todo

### 音声機能
- [x] expo-av 導入
- [x] マイクパーミッション処理
- [x] 録音開始/停止機能
- [x] Orb ビジュアライゼーション（波形の代わりに抽象的Orb UI実装）

### Speech-to-Text
- [x] Whisper API 連携（JWT認証実装済み）
- [x] 文字起こし結果の表示（編集可能なTextInput実装）
- [x] エラーハンドリング（ネットワークエラー、認証エラー等対応）

### AI応答
- [ ] チェックインプロンプト作成
- [ ] Mirror Feedback形式の応答パース
- [ ] コミットメント追加機能

### UI実装
- [x] フルスクリーン録音画面（Orb + 録音ボタン）
- [x] 書き起こし結果の確認・編集画面
- [x] If-Then記録質問画面（2ステップ実装）
- [x] 画面遷移フロー（idle → recording → transcribing → review → if-then → saving）

### データ保存
- [x] チェックイン保存API（if_then_triggered含む、JWT認証実装済み）
- [x] 音声ファイルアップロード（Supabase Storage、base64-arraybuffer形式）
- [ ] チェックイン履歴取得
- [x] If-Then記録の保存処理（2ステップ質問フロー実装）

### セキュリティ
- [x] JWT認証（Bearer token）
- [x] サーバーサイドトークン検証（getServerClient使用）
- [x] SSRF防止（Supabaseドメイン検証）
- [x] フォルダ所有権検証（自分の音声ファイルのみ文字起こし可能）
- [x] localStorage問題修正（サーバーサイド実行時のno-op化）

---

## 完了条件

1. マイク許可を取得できる
2. 音声を録音できる
3. 録音内容が文字起こしされる
4. AIがMirror Feedback形式で応答する
5. **チェックイン完了後にIf-Then記録質問が表示される** ← 追加
6. **If-Then発動の有無がif_then_triggeredとして保存される** ← 追加
7. チェックイン記録がDBに保存される（if_then_triggered含む）
8. 音声ファイルがStorageに保存される
