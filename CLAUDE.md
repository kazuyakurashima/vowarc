# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install              # Install dependencies
npx expo start           # Start dev server (opens menu for iOS/Android/web)
npm run ios              # Start iOS simulator
npm run android          # Start Android emulator
npm run web              # Start web browser
npm run lint             # Run ESLint
npm run reset-project    # Move starter code to app-example, create blank app/
```

## Architecture

**Expo Router (file-based routing)** - Routes are defined by files in `app/`:
- `app/_layout.tsx` - Root Stack navigator with ThemeProvider
- `app/(tabs)/` - Tab group with bottom navigation (Home, Explore)
- `app/modal.tsx` - Modal screen presented via Stack

**Theming** - Light/dark mode support:
- `constants/theme.ts` - Color palette (`Colors.light`, `Colors.dark`) and platform fonts
- `hooks/use-theme-color.ts` - Returns appropriate color for current theme
- `components/themed-*.tsx` - Theme-aware Text and View components

**Platform-specific files** - Use file suffixes for platform code:
- `.ios.tsx` - iOS-only (e.g., `icon-symbol.ios.tsx` uses native SF Symbols)
- `.web.ts` - Web-only (e.g., `use-color-scheme.web.ts`)
- Base file without suffix is the fallback

**Path alias**: `@/*` resolves to project root (configured in `tsconfig.json`)

## Key Patterns

- Icons: `IconSymbol` component maps SF Symbol names to MaterialIcons for cross-platform consistency. Add new icons to the `MAPPING` object in `components/ui/icon-symbol.tsx`
- Tab buttons include haptic feedback via `HapticTab` component
- Typed routes enabled via `experiments.typedRoutes` in `app.json`
- React Compiler enabled via `experiments.reactCompiler`
