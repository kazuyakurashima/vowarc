# TICKET-VOICE-006: Subtitles UI実装

## 概要

音声チェックイン画面のSubtitles（字幕）UIを実装する。STT結果をリアルタイムで表示する。

## 優先度

**中**

## 見積もり

1日

## 依存関係

- 前提: TICKET-VOICE-005, 004-voice-checkin
- 後続: TICKET-VOICE-007

---

## タスク

### 1. Subtitlesコンポーネント作成

**ファイル:** `components/voice/Subtitles.tsx`

**Props:**
```typescript
interface SubtitlesProps {
  text: string;        // 現在のSTT結果
  visible: boolean;    // 表示/非表示
}
```

### 2. スタイル仕様

| 属性 | 値 |
|---|---|
| 透過度 | 40% (opacity: 0.4) |
| 位置 | 画面中央やや下 |
| フォント | Noto Sans JP |
| フォントサイズ | 14px |
| 最大行数 | 3行 |
| テキスト色 | textPrimary (#2C2C2C) |

### 3. アニメーション

**新規テキスト:**
- フェードイン: 300ms

**テキスト更新:**
- 古いテキストは上にスクロール
- スクロールしながらフェードアウト

```typescript
const textAnimation = useAnimatedStyle(() => {
  return {
    opacity: withTiming(1, { duration: 300 }),
    transform: [
      {
        translateY: withTiming(0, { duration: 300 }),
      },
    ],
  };
});
```

### 4. 行数制限

- 3行を超える場合は古い行を削除
- 新しい行は下に追加
- スムーズなスクロール

### 5. 使用例

```typescript
// VoiceCheckin画面での使用
<View style={styles.container}>
  <Orb state={orbState} volume={volume} />
  {/* リアルタイムSTT使用時は録音中・処理中の両方で表示 */}
  <Subtitles
    text={sttResult}
    visible={orbState === 'recording' || orbState === 'processing'}
  />
</View>
```

**Note:** リアルタイムSTT（react-native-voice）使用時は録音中からSubtitlesを表示。Whisper API使用時は処理中のみ。

---

## レイアウト

```
┌─────────────────────────────────────────┐
│                                          │
│                                          │
│              ╭───────────╮               │
│              │    Orb    │               │
│              ╰───────────╯               │
│                                          │
│                                          │
│    ─────────────────────────────         │
│    「今日は朝起きるのが辛かったけど...」   │ ← Subtitles
│    「なんとか起きることができました」      │    40% opacity
│    ─────────────────────────────         │
│                                          │
└─────────────────────────────────────────┘
```

---

## 完了条件

- [ ] Subtitlesコンポーネントが実装されている
- [ ] 透過度40%で表示される
- [ ] 新規テキストがフェードインする
- [ ] 3行を超えると古い行が消える
- [ ] 画面中央やや下に配置される
- [ ] リアルタイムSTT時（録音中）も表示される

---

## 関連ドキュメント

- [design/screens/voice-checkin.md](../../design/screens/voice-checkin.md)
- [ux/ux-spec-v0.1.md](../../docs/ux/ux-spec-v0.1.md)
