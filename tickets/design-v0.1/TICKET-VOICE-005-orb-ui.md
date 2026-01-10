# TICKET-VOICE-005: Orb UI実装

## 概要

音声チェックイン画面のOrb UIを実装する。アバターを使わない抽象的な表現で、音声入力体験を実現する。

## 優先度

**高**

## 見積もり

2-3日

## 依存関係

- 前提: TICKET-DS-001, TICKET-DS-002, 004-voice-checkin
- 後続: TICKET-VOICE-006, TICKET-VOICE-007

---

## タスク

### 1. Orbコンポーネント作成

**ファイル:** `components/voice/Orb.tsx`

**Props:**
```typescript
interface OrbProps {
  state: 'idle' | 'recording' | 'processing' | 'complete';
  volume?: number; // 0-1 for recording state
  size?: number;   // default 120
}
```

### 2. 待機状態（Idle）アニメーション

**呼吸するような脈動:**

```typescript
// react-native-reanimated
const breatheAnimation = useAnimatedStyle(() => {
  return {
    transform: [
      {
        scale: withRepeat(
          withTiming(1.05, { duration: 2000 }),
          -1,
          true
        ),
      },
    ],
    opacity: withRepeat(
      withTiming(1, { duration: 2000 }),
      -1,
      true
    ),
  };
});
```

**サイクル:** 4秒（scale 1 → 1.05 → 1）

### 3. 録音状態（Recording）アニメーション

**音量連動:**

```typescript
const recordingAnimation = useAnimatedStyle(() => {
  const scale = 1 + (volume.value * 0.15);
  return {
    transform: [{ scale }],
  };
});
```

**波紋エフェクト:**
- 音量閾値（0.5以上）で波紋発生
- 波紋は外側に広がりながらフェードアウト
- 最大3つの波紋を同時表示

### 4. 処理状態（Processing）アニメーション

**ゆっくり回転:**

```typescript
const processingAnimation = useAnimatedStyle(() => {
  return {
    transform: [
      {
        rotate: withRepeat(
          withTiming('360deg', { duration: 8000 }),
          -1,
          false
        ),
      },
    ],
  };
});
```

### 5. 完了状態（Complete）アニメーション

- 回転停止
- フェードアウト（1秒）

### 6. グラデーション実装

**radial-gradient:**
- 中心: accent (#E07A5F)
- 外周: background (#F7F3F0)

```typescript
import { RadialGradient } from 'react-native-svg';

<RadialGradient id="orbGradient">
  <Stop offset="0%" stopColor={colors.accent} />
  <Stop offset="100%" stopColor={colors.background} />
</RadialGradient>
```

### 7. 波紋コンポーネント

**ファイル:** `components/voice/Ripple.tsx`

- 円形、Orbより大きいサイズで発生
- 外側に広がりながら透明度が下がる
- 1秒で消失

### 8. 統合

**ファイル:** `components/voice/index.ts`

```typescript
export { Orb } from './Orb';
export { Ripple } from './Ripple';
```

---

## 視覚仕様

| 状態 | サイズ | アニメーション | 速度 |
|---|---|---|---|
| idle | 120x120px | scale: 1↔1.05, opacity: 0.8↔1 | 4秒サイクル |
| recording | 120x120px | scale: 1 + volume*0.15, 波紋 | リアルタイム |
| processing | 120x120px | rotate: 0→360° | 8秒/回転 |
| complete | 120x120px | 静止→フェードアウト | 1秒 |

---

## 完了条件

- [ ] Orbコンポーネントが4状態で動作
- [ ] 待機状態で呼吸アニメーション
- [ ] 録音状態で音量連動
- [ ] 処理状態でゆっくり回転
- [ ] 波紋エフェクトが動作
- [ ] グラデーションが正しく表示

---

## 関連ドキュメント

- [design/screens/voice-checkin.md](../../design/screens/voice-checkin.md)
- [004-voice-checkin.md](../../docs/004-voice-checkin.md)
- [ux/ux-spec-v0.1.md](../../docs/ux/ux-spec-v0.1.md)
