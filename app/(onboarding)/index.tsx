import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui';
import { colors, spacing, fontSizes, typography } from '@/constants/theme';

export default function OnboardingIndexScreen() {
  const handleStart = () => {
    router.push('/(onboarding)/why');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>始めましょう</Text>

        <Text style={styles.description}>
          これから3ヶ月間、{'\n'}
          あなたの物語を共に紡ぎます
        </Text>

        <Text style={styles.note}>
          最初に、いくつかの質問をさせてください。{'\n'}
          あなた自身の言葉で答えることが大切です。
        </Text>

        <Button
          title="はじめる"
          onPress={handleStart}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.xxxl,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: fontSizes.xxxl * typography.heading.lineHeight,
  },
  description: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: fontSizes.lg * typography.body.lineHeight,
  },
  note: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: fontSizes.md * typography.body.lineHeight,
  },
  button: {
    marginTop: spacing.xl,
  },
});
