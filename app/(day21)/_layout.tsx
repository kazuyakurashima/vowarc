/**
 * Day 21 Layout (Ticket 007)
 * Stack navigation for the Day 21 ritual flow
 */

import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function Day21Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
        animationDuration: 1800, // 1.8s for ritual transitions
      }}
    >
      <Stack.Screen name="intro" />
      <Stack.Screen name="report" />
      <Stack.Screen name="vow-update" />
      <Stack.Screen name="tough-love" />
      <Stack.Screen name="re-sign" />
      <Stack.Screen name="choice" />
      <Stack.Screen name="payment-confirm" />
      <Stack.Screen name="payment-success" />
      <Stack.Screen name="exit-summary" />
      <Stack.Screen name="exit-review" />
      <Stack.Screen name="exit-complete" />
    </Stack>
  );
}
