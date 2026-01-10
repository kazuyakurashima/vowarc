import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Button, TextInput } from '@/components/ui';
import { colors, spacing, fontSizes, typography } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';

export default function IdealScreen() {
  const { answers, setAnswer: saveAnswer } = useOnboardingStore();
  const [localAnswer, setLocalAnswer] = useState(answers.ideal);
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    try {
      setLoading(true);
      saveAnswer('ideal', localAnswer);
      router.push('/(onboarding)/meaning-preview');
    } catch (error) {
      console.error('Error saving answer:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.question}>
        3ヶ月後、{'\n'}どんな自分になっていたいですか？
      </Text>

      <Text style={styles.hint}>
        理想の姿を言葉にしてください
      </Text>

      <TextInput
        value={localAnswer}
        onChangeText={setLocalAnswer}
        multiline
        numberOfLines={6}
        placeholder="ここに入力してください..."
        style={styles.input}
        containerStyle={styles.inputContainer}
      />

      <Button
        title="次へ"
        onPress={handleNext}
        loading={loading}
        disabled={!localAnswer.trim()}
        style={styles.button}
      />

      <Button
        title="戻る"
        variant="text"
        onPress={() => router.back()}
        style={styles.backButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  question: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.xxl,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: fontSizes.xxl * typography.heading.lineHeight,
  },
  hint: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  input: {
    height: 150,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  button: {
    marginTop: spacing.lg,
  },
  backButton: {
    marginTop: spacing.md,
  },
});
