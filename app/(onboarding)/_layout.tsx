import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="why" />
      <Stack.Screen name="pain" />
      <Stack.Screen name="ideal" />
      <Stack.Screen name="meaning-preview" />
      <Stack.Screen name="contract" />
    </Stack>
  );
}
