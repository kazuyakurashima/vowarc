import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MirrorFeedback } from '@/lib/supabase/types';
import { colors, spacing, typography, fontSizes } from '@/constants/theme';

interface MirrorFeedbackDisplayProps {
  feedback: MirrorFeedback;
}

export function MirrorFeedbackDisplay({ feedback }: MirrorFeedbackDisplayProps) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Mirror Feedback</Text>
      <Text style={styles.subtitle}>AIによる振り返りと仮説検証</Text>

      {/* 1. Observed Change */}
      <View style={styles.section}>
        <Text style={styles.label}>1. 変化の観察</Text>
        <Text style={styles.text}>{feedback.observed_change}</Text>
      </View>

      {/* 2. Hypothesis */}
      <View style={styles.section}>
        <Text style={styles.label}>2. 仮説</Text>
        <Text style={styles.text}>{feedback.hypothesis}</Text>
      </View>

      {/* 3. Next Experiment */}
      <View style={styles.section}>
        <Text style={styles.label}>3. 次の実験</Text>
        <Text style={styles.text}>{feedback.next_experiment}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  label: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  text: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    lineHeight: fontSizes.md * typography.body.lineHeight,
  },
});
