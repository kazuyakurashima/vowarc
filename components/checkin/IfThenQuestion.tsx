import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '@/components/ui/Button';
import { colors, spacing, typography, fontSizes } from '@/constants/theme';

interface IfThenQuestionProps {
  onAnswer: (triggered: boolean) => void;
}

export function IfThenQuestion({ onAnswer }: IfThenQuestionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.question}>
        If-Then実行の振り返り
      </Text>
      <Text style={styles.subtitle}>
        今日、設定したIf-Thenルールを実行できましたか?
      </Text>

      <View style={styles.buttons}>
        <Button
          title="はい"
          onPress={() => onAnswer(true)}
          variant="primary"
          style={styles.button}
        />
        <Button
          title="いいえ"
          onPress={() => onAnswer(false)}
          variant="secondary"
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginVertical: spacing.md,
  },
  question: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flex: 1,
  },
});
