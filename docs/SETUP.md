# VowArc Setup Guide

## Ticket 001: Foundation Setup - Completed

This guide covers the foundation setup completed for VowArc MVP.

---

## What Has Been Implemented

### 1. Supabase Configuration

**Files Created:**
- `/lib/supabase.ts` - Supabase client configuration
- `/types/database.ts` - TypeScript types for database schema
- `/.env.example` - Environment variable template
- `/supabase/migrations/20260110_initial_schema.sql` - Database migration

**Database Schema:**
The following tables have been defined with Row Level Security (RLS):

- **users** - User profiles and phase tracking
- **vows** - User vows/commitments with versioning
- **meaning_statements** - User meaning statements with versioning
- **checkins** - Daily check-ins (morning, evening, voice)
- **commitments** - User commitments and their status

### 2. Design Tokens (Design System v0.1)

**Files Created:**
- `/constants/colors.ts` - Color palette (Quiet Luxury, low saturation)
- `/constants/typography.ts` - Typography tokens (Noto Serif JP, Noto Sans JP, Inter)
- `/constants/spacing.ts` - Spacing scale (Type-to-Space Ratio: 15:85)
- `/constants/transitions.ts` - Animation/transition timing
- `/constants/elevation.ts` - Elevation levels (brightness-based, no shadows)
- `/constants/haptics.ts` - Haptic feedback patterns
- `/constants/theme.ts` - Consolidated theme exports

**Design Philosophy:**
- **Color Ratio**: 90% background, 7% text, 3% accent
- **Quiet Luxury**: Low saturation (<8%), muted tones
- **Day21 Special**: Deep Gold (#C9A961) for Day21 ritual screens only
- **No Drop Shadows**: Use brightness differences for elevation

### 3. Fonts

**Files Created:**
- `/hooks/use-fonts.ts` - Font loading hook

**Fonts Installed:**
- Noto Serif JP Light (300) - Headings
- Noto Sans JP Regular (400) - Body text
- Noto Sans JP Medium (500) - Emphasized text
- Inter Regular/Medium/SemiBold - Numeric and English text

### 4. Common UI Components

**Files Created:**
- `/components/common/Button.tsx` - Primary, Secondary, Ghost variants
- `/components/common/Card.tsx` - Standard and Highlight variants
- `/components/common/TextInput.tsx` - Single-line and multiline inputs
- `/components/common/index.ts` - Component exports

**Component Features:**
- Design System v0.1 compliant
- Haptic feedback integration
- Day21 special styling support
- Accessibility considerations

### 5. Authentication

**Files Created:**
- `/hooks/use-auth.ts` - Authentication hook
- `/contexts/AuthContext.tsx` - Auth context provider

**Auth Features:**
- Email/password authentication
- Session management with AsyncStorage
- Auto-refresh tokens
- Sign up, sign in, sign out, password reset

---

## Setup Instructions

### Step 1: Install Dependencies

All required dependencies have been installed:

```bash
npm install
```

**Key Dependencies:**
- `@supabase/supabase-js` - Supabase client
- `@react-native-async-storage/async-storage` - Session storage
- `react-native-url-polyfill` - URL polyfill for React Native
- `@expo-google-fonts/noto-serif-jp` - Noto Serif JP font
- `@expo-google-fonts/noto-sans-jp` - Noto Sans JP font
- `@expo-google-fonts/inter` - Inter font

### Step 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   EXPO_PUBLIC_OPENAI_API_KEY=your-openai-api-key
   ```

### Step 4: Run Database Migration

In your Supabase project dashboard:

1. Go to SQL Editor
2. Copy the contents of `/supabase/migrations/20260110_initial_schema.sql`
3. Run the SQL script

This will create:
- All database tables with proper relationships
- Row Level Security (RLS) policies
- Indexes for optimized queries
- Trigger for automatic user creation on signup

### Step 5: Update App Layout with Auth Provider

Update `/app/_layout.tsx` to include the AuthProvider:

```tsx
import { AuthProvider } from '@/contexts/AuthContext';
import { useVowArcFonts } from '@/hooks/use-fonts';
import * as SplashScreen from 'expo-splash-screen';

export default function RootLayout() {
  const fontsLoaded = useVowArcFonts();

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <Stack>
        {/* Your screens */}
      </Stack>
    </AuthProvider>
  );
}
```

### Step 6: Test the Setup

Run the development server:

```bash
npx expo start
```

---

## Usage Examples

### Using Design Tokens

```tsx
import { colors, spacing, fontSizes } from '@/constants/theme';
import { Button, Card, TextInput } from '@/components/common';

// Using tokens directly
<View style={{
  backgroundColor: colors.background,
  padding: spacing.lg
}}>
  <Text style={{
    color: colors.textPrimary,
    fontSize: fontSizes.xl
  }}>
    Welcome
  </Text>
</View>

// Using components
<Card>
  <TextInput
    label="Your Vow"
    placeholder="Enter your commitment..."
    multiline
  />
  <Button
    title="Sign Vow"
    variant="primary"
    onPress={handleSignVow}
  />
</Card>
```

### Using Authentication

```tsx
import { useAuth } from '@/contexts/AuthContext';

function LoginScreen() {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await signIn(email, password);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <View>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button
        title="Sign In"
        onPress={handleLogin}
        loading={loading}
      />
    </View>
  );
}
```

### Using Haptic Feedback

```tsx
import { triggerHaptic } from '@/constants/haptics';

// Light tap feedback
await triggerHaptic('light');

// Medium feedback for buttons
await triggerHaptic('medium');

// Heavy feedback for vow signing
await triggerHaptic('vowImpact');
```

---

## Next Steps

Now that the foundation is complete, you can proceed with:

1. **Ticket 002** - Day0 Initiation Flow
2. **Ticket 003** - Home Screen Implementation
3. **Ticket 004** - Voice Check-in Feature
4. **Ticket 005** - AI Coach Basic Integration

---

## File Structure

```
VowArc/
├── app/                        # Expo Router screens
├── components/
│   └── common/                # Common UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── TextInput.tsx
│       └── index.ts
├── constants/                 # Design tokens
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   ├── transitions.ts
│   ├── elevation.ts
│   ├── haptics.ts
│   └── theme.ts
├── contexts/
│   └── AuthContext.tsx       # Auth provider
├── hooks/
│   ├── use-auth.ts          # Auth hook
│   └── use-fonts.ts         # Font loading
├── lib/
│   └── supabase.ts          # Supabase client
├── supabase/
│   └── migrations/          # Database migrations
├── types/
│   └── database.ts          # Database types
├── .env                     # Environment variables (gitignored)
├── .env.example            # Environment template
└── docs/
    └── SETUP.md            # This file
```

---

## Troubleshooting

### Fonts not loading

Make sure to:
1. Clear Expo cache: `npx expo start -c`
2. Check that fonts are properly imported in `_layout.tsx`
3. Use `useVowArcFonts()` hook before rendering

### Supabase connection issues

1. Verify `.env` file exists and has correct values
2. Check that environment variables start with `EXPO_PUBLIC_`
3. Restart the development server after changing `.env`

### Database RLS errors

1. Make sure you've run the migration script
2. Verify the trigger for user creation is active
3. Check RLS policies in Supabase dashboard

---

## Design System Reference

For full design specifications, see:
- `/design/design-system-v0.1.md` - Complete Design System documentation
- `/tickets/design-v0.1/TICKET-DS-001-design-tokens.md` - Token implementation details

---

## Contributing

When adding new features:
1. Use design tokens from `/constants/theme.ts`
2. Follow component patterns in `/components/common/`
3. Add proper TypeScript types
4. Include haptic feedback where appropriate
5. Test on both iOS and Android
