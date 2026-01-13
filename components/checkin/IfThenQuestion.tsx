/**
 * If-Then Question Component (Ticket 004)
 * 2-step flow for tracking If-Then execution
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '@/components/ui/Button';
import { colors, spacing, typography, fontSizes } from '@/constants/theme';

interface IfThenQuestionProps {
  onAnswer: (triggered: boolean | null) => void;
}

export function IfThenQuestion({ onAnswer }: IfThenQuestionProps) {
  const [step, setStep] = useState<'obstacle' | 'execution'>('obstacle');
  const [encounteredObstacle, setEncounteredObstacle] = useState<boolean | null>(null);

  const handleObstacleAnswer = (encountered: boolean) => {
    setEncounteredObstacle(encountered);

    if (encountered) {
      // Proceed to step 2: Ask about If-Then execution
      setStep('execution');
    } else {
      // No obstacle encountered, so If-Then was not triggered
      onAnswer(null);
    }
  };

  const handleExecutionAnswer = (executed: boolean) => {
    // User encountered obstacle and answered about execution
    onAnswer(executed);
  };

  if (step === 'obstacle') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>最後にひとつだけ</Text>

        <Text style={styles.question}>
          今日、予定していた障害{'\n'}
          （誘惑、時間不足等）に{'\n'}
          遭遇しましたか？
        </Text>

        <View style={styles.buttons}>
          <Button
            title="はい"
            onPress={() => handleObstacleAnswer(true)}
            variant="primary"
            style={styles.button}
          />
          <Button
            title="いいえ"
            onPress={() => handleObstacleAnswer(false)}
            variant="secondary"
            style={styles.button}
          />
        </View>
      </View>
    );
  }

  // Step 2: Execution question (only shown if obstacle encountered)
  return (
    <View style={styles.container}>
      <Text style={styles.title}>最後にひとつだけ</Text>

      <Text style={styles.question}>
        事前に決めていたIf-Thenを{'\n'}
        実行できましたか？
      </Text>

      <Text style={styles.hint}>
        ※ 実行できなかった場合でも{'\n'}
        記録として残ります
      </Text>

      <View style={styles.buttons}>
        <Button
          title="実行できた"
          onPress={() => handleExecutionAnswer(true)}
          variant="primary"
          style={styles.button}
        />
        <Button
          title="実行できなかった"
          onPress={() => handleExecutionAnswer(false)}
          variant="secondary"
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginVertical: spacing.md,
    alignItems: 'center',
  },
  title: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  question: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
    lineHeight: fontSizes.md * 1.5,
  },
  hint: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
    lineHeight: fontSizes.sm * 1.5,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  button: {
    flex: 1,
  },
});
