import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui';
import { colors, spacing, fontSizes, typography } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { buildApiUrl } from '@/lib/api-config';
import { supabase } from '@/lib/supabase';

export default function MeaningPreviewScreen() {
  const { answers, inputTypes, generatedMeaning, generatedVow, setGeneratedMeaning, setGeneratedVow } = useOnboardingStore();
  const [meaningStatement, setMeaningStatement] = useState(generatedMeaning);
  const [vow, setVow] = useState(generatedVow);
  const [loading, setLoading] = useState(!generatedMeaning || !generatedVow);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!generatedMeaning || !generatedVow) {
      generateStatements();
    }
  }, []);

  const generateStatements = async () => {
    try {
      setLoading(true);
      setError('');

      // Get JWT token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error('認証トークンがありません');
      }

      // Call unified API for generating Meaning Statement and Vow
      const response = await fetch(buildApiUrl('/api/onboarding/generate-meaning'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          why: answers.why,
          pain: answers.pain,
          ideal: answers.ideal,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '生成に失敗しました');
      }

      const data = await response.json();
      const { meaningStatement: newMeaning, vow: newVow } = data;

      setMeaningStatement(newMeaning);
      setVow(newVow);
      setGeneratedMeaning(newMeaning);
      setGeneratedVow(newVow);
    } catch (err) {
      console.error('Error generating statements:', err);
      setError('生成に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    try {
      setLoading(true);
      setError('');

      // Get JWT token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error('認証トークンがありません');
      }

      // Save all onboarding data via API
      const response = await fetch(buildApiUrl('/api/onboarding/save-onboarding'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          answers: {
            why: answers.why,
            pain: answers.pain,
            ideal: answers.ideal,
          },
          inputTypes: {
            why: inputTypes.why,
            pain: inputTypes.pain,
            ideal: inputTypes.ideal,
          },
          meaningStatement,
          vow,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '保存に失敗しました');
      }

      // Navigate to contract screen
      router.push('/(onboarding)/contract');
    } catch (error) {
      console.error('Error saving statements:', error);
      setError('保存に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    generateStatements();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          あなたの言葉から{'\n'}北極星を生成しています...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="再試行" onPress={generateStatements} style={styles.button} />
        <Button title="戻る" variant="text" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>あなたの北極星</Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Meaning Statement</Text>
        <Text style={styles.meaningText}>{meaningStatement}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>誓い（Vow）</Text>
        <Text style={styles.vowText}>{vow}</Text>
      </View>

      <Text style={styles.note}>
        これらはあなたの言葉から生成されました。{'\n'}
        この先3ヶ月、この北極星があなたを導きます。
      </Text>

      <Button
        title="この内容で進む"
        onPress={handleNext}
        style={styles.button}
      />

      <Button
        title="もう一度生成する"
        variant="outline"
        onPress={handleRegenerate}
        style={styles.regenerateButton}
      />

      <Button
        title="戻って修正する"
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: fontSizes.md * typography.body.lineHeight,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.xxxl,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: fontSizes.xxxl * typography.heading.lineHeight,
  },
  section: {
    marginBottom: spacing.xxl,
    padding: spacing.lg,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
  },
  sectionLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  meaningText: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    lineHeight: fontSizes.lg * typography.heading.lineHeight,
  },
  vowText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    lineHeight: fontSizes.md * typography.body.lineHeight,
    fontStyle: 'italic',
  },
  note: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: fontSizes.sm * typography.body.lineHeight,
  },
  button: {
    marginTop: spacing.lg,
  },
  regenerateButton: {
    marginTop: spacing.md,
  },
  backButton: {
    marginTop: spacing.sm,
  },
});
