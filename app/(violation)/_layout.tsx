/**
 * Violation Screens Layout (Ticket 016)
 * Handles contract violation protocol screens
 */

import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function ViolationLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="renegotiation" />
      <Stack.Screen name="termination" />
      <Stack.Screen name="termination-complete" />
    </Stack>
  );
}
