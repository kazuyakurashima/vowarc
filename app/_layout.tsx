import { useEffect, useState, useCallback } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ui';
import { colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [isRechecking, setIsRechecking] = useState(false);

  const currentGroup = segments[0];

  // Check if user has completed onboarding with retry logic
  const checkOnboarding = useCallback(async (isRecheck = false, retryCount = 0) => {
    if (!user) {
      setOnboardingChecked(true);
      setOnboardingCompleted(null);
      return;
    }

    if (isRecheck && retryCount === 0) {
      setIsRechecking(true);
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('trial_start_date')
        .eq('id', user.id)
        .single();

      if (error) {
        // PGRST116 = no rows found - user record might not exist yet
        if (error.code === 'PGRST116' && retryCount < 2) {
          // Retry after a short delay (RLS or record creation might be delayed)
          await new Promise(resolve => setTimeout(resolve, 500));
          // Don't update state here - let the retry handle it
          return checkOnboarding(isRecheck, retryCount + 1);
        }
        // After retries or other errors, assume onboarding not completed
        setOnboardingCompleted(false);
        setOnboardingChecked(true);
        setIsRechecking(false);
      } else {
        setOnboardingCompleted(!!data?.trial_start_date);
        setOnboardingChecked(true);
        setIsRechecking(false);
      }
    } catch {
      setOnboardingCompleted(false);
      setOnboardingChecked(true);
      setIsRechecking(false);
    }
  }, [user]);

  // Initial check on mount or user change
  useEffect(() => {
    if (!loading) {
      checkOnboarding(false);
    }
  }, [user, loading, checkOnboarding]);

  // Re-check when navigating to tabs from onboarding (after contract acceptance)
  useEffect(() => {
    if (currentGroup === '(tabs)' && onboardingCompleted === false && !isRechecking) {
      // Might have just completed onboarding, re-check
      checkOnboarding(true);
    }
  }, [currentGroup, onboardingCompleted, isRechecking, checkOnboarding]);

  useEffect(() => {
    // Don't redirect while rechecking onboarding status
    if (loading || !onboardingChecked || isRechecking) return;

    const inAuthGroup = currentGroup === '(auth)';
    const inTabsGroup = currentGroup === '(tabs)';
    // Allow reset-password screen even when authenticated (recovery session)
    const isResetPasswordScreen = inAuthGroup && segments[1] === 'reset-password';

    if (!user && !inAuthGroup) {
      // Not authenticated, redirect to login
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup && !isResetPasswordScreen) {
      // Authenticated but in auth screens (except reset-password)
      if (onboardingCompleted) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(onboarding)');
      }
    } else if (user && inTabsGroup && onboardingCompleted === false) {
      // User is in tabs but hasn't completed onboarding, redirect to onboarding
      router.replace('/(onboarding)');
    }
  }, [user, loading, currentGroup, segments, onboardingChecked, onboardingCompleted, isRechecking, router]);

  if (loading || !onboardingChecked) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(day21)" />
      <Stack.Screen name="(violation)" />
      <Stack.Screen
        name="modal"
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Modal',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RootLayoutNav />
        <StatusBar style="dark" />
      </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
