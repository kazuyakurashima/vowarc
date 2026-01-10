# VowArk Quick Start Guide

## Foundation Setup Complete ✅

Ticket 001 has been successfully implemented. Follow these steps to get started.

---

## 5-Minute Setup

### 1. Install Dependencies (Already Done)
```bash
npm install
```

### 2. Set Up Supabase
1. Go to [supabase.com](https://supabase.com) and create a project
2. Copy your project URL and anon key
3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your credentials:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_OPENAI_API_KEY=your-openai-key-here
```

### 3. Run Database Migration
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `/supabase/migrations/20260110_initial_schema.sql`
3. Paste and run the SQL
4. Verify tables created: users, vows, meaning_statements, checkins, commitments

### 4. Start Development Server
```bash
npx expo start
```

---

## What's Available Now

### Design Tokens
```tsx
import { colors, spacing, fontSizes } from '@/constants/theme';

// Use in styles
backgroundColor: colors.background,
padding: spacing.lg,
fontSize: fontSizes.base,
```

### Components
```tsx
import { Button, Card, TextInput } from '@/components/common';

<Card>
  <TextInput
    label="Your Vow"
    placeholder="Enter your commitment..."
  />
  <Button
    title="Submit"
    variant="primary"
    onPress={handleSubmit}
  />
</Card>
```

### Authentication
```tsx
import { useAuth } from '@/contexts/AuthContext';

const { user, signIn, signUp, signOut } = useAuth();
```

### Haptics
```tsx
import { triggerHaptic } from '@/constants/haptics';

await triggerHaptic('vowImpact'); // Heavy feedback for vow signing
```

---

## Design System Colors

| Token | Hex | Usage |
|-------|-----|-------|
| background | #F7F3F0 | Main background (90%) |
| surface | #FAF8F5 | Cards, surfaces (90%) |
| textPrimary | #2C2C2C | Primary text (7%) |
| textSecondary | #6B6B6B | Secondary text (7%) |
| accent | #E07A5F | Buttons, highlights (3%) |
| day21Accent | #C9A961 | Day21 ritual only (3%) |

---

## Typography

| Font | Usage | Line Height |
|------|-------|-------------|
| Noto Serif JP Light | Headings | 2.0 |
| Noto Sans JP Regular | Body text | 1.9 |
| Inter | Numbers, English | 1.5 |

---

## Next Steps

1. Update `/app/_layout.tsx` with AuthProvider and font loading
2. Implement Ticket 002: Day0 Initiation Flow
3. Build the onboarding experience
4. Connect AI coach integration

---

## Troubleshooting

### Fonts not loading?
```bash
npx expo start -c  # Clear cache
```

### Supabase errors?
- Check `.env` file exists
- Verify environment variables start with `EXPO_PUBLIC_`
- Confirm migration ran successfully in Supabase dashboard

### TypeScript errors?
- Existing route type errors are non-blocking
- Foundation components are fully typed

---

## Documentation

- **Full Setup**: `/docs/SETUP.md`
- **Implementation Summary**: `/IMPLEMENTATION_SUMMARY.md`
- **Completion Report**: `/TICKET-001-COMPLETED.md`
- **Design System**: `/design/design-system-v0.1.md`

---

## Support

Implemented by Claude Sonnet 4.5
Date: 2026-01-10

Ready to build VowArk MVP! 🚀
