# TICKET-DS-002: フォント導入

## 概要

Noto Serif JP (Light)、Noto Sans JP (Regular)、Interフォントをプロジェクトに導入する。

## 優先度

**高**（UIコンポーネント実装の前提）

## 見積もり

1日

## 依存関係

- 前提: TICKET-DS-001
- 後続: TICKET-DS-003, 全UIコンポーネント

---

## タスク

### 1. フォントファイル取得

**取得するフォント:**

| フォント | ウェイト | 用途 |
|---|---|---|
| Noto Serif JP | Light (300) | 見出し、Meaning Statement |
| Noto Sans JP | Regular (400) | 本文、UI要素 |
| Inter | Regular (400) | 数字、英字 |

**取得元:**
- Google Fonts: https://fonts.google.com/
- OTF/TTF形式をダウンロード

### 2. アセット配置

**ディレクトリ:** `assets/fonts/`

```
assets/
└── fonts/
    ├── NotoSerifJP-Light.otf
    ├── NotoSansJP-Regular.otf
    └── Inter-Regular.ttf
```

### 3. Expo設定

**ファイル:** `app.json` または `app.config.js`

```json
{
  "expo": {
    "plugins": [
      [
        "expo-font",
        {
          "fonts": [
            "./assets/fonts/NotoSerifJP-Light.otf",
            "./assets/fonts/NotoSansJP-Regular.otf",
            "./assets/fonts/Inter-Regular.ttf"
          ]
        }
      ]
    ]
  }
}
```

### 4. フォントローディング

**ファイル:** `hooks/useFonts.ts`

```typescript
import { useFonts as useExpoFonts } from 'expo-font';

export function useFonts() {
  const [fontsLoaded] = useExpoFonts({
    'NotoSerifJP-Light': require('../assets/fonts/NotoSerifJP-Light.otf'),
    'NotoSansJP-Regular': require('../assets/fonts/NotoSansJP-Regular.otf'),
    'Inter': require('../assets/fonts/Inter-Regular.ttf'),
  });

  return fontsLoaded;
}
```

### 5. ルートレイアウトでの読み込み

**ファイル:** `app/_layout.tsx`

```typescript
import { useFonts } from '@/hooks/useFonts';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const fontsLoaded = useFonts();

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  // ... rest of layout
}
```

### 6. 動作確認

- [ ] iOS Simulatorでフォント表示確認
- [ ] Android Emulatorでフォント表示確認
- [ ] 日本語文字（ひらがな、カタカナ、漢字）の表示確認

---

## 完了条件

- [ ] 3種類のフォントがassetsに配置されている
- [ ] アプリ起動時にフォントがロードされる
- [ ] 各フォントがスタイルで指定可能
- [ ] 日本語が正しく表示される

---

## 関連ドキュメント

- [design-system-v0.1.md](../../design/design-system-v0.1.md)
- [001-foundation.md](../../docs/001-foundation.md)
