# TICKET-VOICE-007: 音声UI Haptics実装

## 概要

音声チェックイン画面のハプティクス（触覚フィードバック）を実装する。

## 優先度

**中**

## 見積もり

0.5日

## 依存関係

- 前提: TICKET-DS-001, TICKET-VOICE-005
- 後続: なし

---

## タスク

### 1. Hapticsユーティリティ作成

**ファイル:** `utils/haptics.ts`

```typescript
import * as Haptics from 'expo-haptics';

export const triggerHaptic = (type: 'light' | 'medium' | 'heavy') => {
  switch (type) {
    case 'light':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case 'medium':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'heavy':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      break;
  }
};

export const triggerReflectionPulse = () => {
  // 60bpm = 1000ms間隔
  const interval = setInterval(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, 1000);

  return () => clearInterval(interval);
};

export const triggerVowImpact = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
};

export const triggerCompletionBreath = async () => {
  // 呼吸のような長めの振動（吸って→吐いて）
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  await new Promise(resolve => setTimeout(resolve, 200));
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};
```

### 2. 音声チェックインへの適用

| タイミング | フィードバック | 関数 |
|---|---|---|
| 録音開始 | medium | `triggerHaptic('medium')` |
| 録音中 | 60bpm pulse | `triggerReflectionPulse()` |
| 送信タップ | medium | `triggerHaptic('medium')` |
| チェックイン完了 | completionBreath | `triggerCompletionBreath()` |
| 誓い署名完了 | vowImpact | `triggerVowImpact()` |

### 3. useHapticsフック

**ファイル:** `hooks/useHaptics.ts`

```typescript
import { useCallback, useEffect, useRef } from 'react';
import { triggerHaptic, triggerReflectionPulse, triggerVowImpact, triggerCompletionBreath } from '@/utils/haptics';

export function useHaptics() {
  const pulseCleanup = useRef<(() => void) | null>(null);

  const startReflectionPulse = useCallback(() => {
    pulseCleanup.current = triggerReflectionPulse();
  }, []);

  const stopReflectionPulse = useCallback(() => {
    if (pulseCleanup.current) {
      pulseCleanup.current();
      pulseCleanup.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopReflectionPulse();
    };
  }, []);

  return {
    light: () => triggerHaptic('light'),
    medium: () => triggerHaptic('medium'),
    heavy: () => triggerHaptic('heavy'),
    vowImpact: triggerVowImpact,
    completionBreath: triggerCompletionBreath,
    startReflectionPulse,
    stopReflectionPulse,
  };
}
```

### 4. 使用例

```typescript
// VoiceCheckin画面での使用
const { medium, startReflectionPulse, stopReflectionPulse, vowImpact } = useHaptics();

const handleStartRecording = () => {
  medium();
  startReflectionPulse();
  // ... recording logic
};

const handleStopRecording = () => {
  stopReflectionPulse();
  medium();
  // ... stop logic
};

const handleComplete = () => {
  completionBreath(); // チェックイン完了時
  // ... complete logic
};
```

---

## Haptics仕様

| 種類 | 強度 | タイミング |
|---|---|---|
| Reflection Pulse | Light | 録音中、60bpm（1秒間隔） |
| Action Feedback | Medium | 録音開始/停止、送信 |
| Completion Breath | Medium→Light | チェックイン完了（呼吸のような長めの振動） |
| Vow Impact | Heavy | 誓い署名完了 |

---

## 完了条件

- [ ] Hapticsユーティリティが実装されている
- [ ] useHapticsフックが使用可能
- [ ] 録音開始時にmediumフィードバック
- [ ] 録音中に60bpm pulseが動作
- [ ] チェックイン完了時にcompletionBreathが動作
- [ ] 誓い署名完了時にvowImpactが動作

---

## 関連ドキュメント

- [design-system-v0.1.md](../../design/design-system-v0.1.md)
- [design/screens/voice-checkin.md](../../design/screens/voice-checkin.md)
