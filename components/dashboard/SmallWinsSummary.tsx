/**
 * Small Wins Summary Component (Ticket 010)
 * Displays a summary of process metrics for the home screen
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography, fontSizes } from '@/constants/theme';
import { useSmallWins, formatFraction } from '@/hooks/data/useSmallWins';

interface SmallWinsSummaryProps {
  onPress?: () => void;
}

export function SmallWinsSummary({ onPress }: SmallWinsSummaryProps) {
  const { summary, loading, error } = useSmallWins();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/(tabs)/dashboard');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.accent} size="small" />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </View>
    );
  }

  if (error || !summary) {
    // Check if it's a "trial not started" error - show a friendlier message
    const isTrialNotStarted = error?.message?.includes('trial not started') ||
                              error?.message?.includes('User not found');

    if (isTrialNotStarted) {
      return (
        <View style={styles.container}>
          <Text style={styles.infoText}>
            オンボーディングを完了するとメトリクスが表示されます
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          メトリクスの読み込みに失敗しました
        </Text>
      </View>
    );
  }

  // Note: Weekly breakdown is Phase B - currently showing total period metrics
  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.title}>進捗サマリー</Text>
        {summary.metrics.checkinStreak > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>
              {summary.metrics.checkinStreak}日連続
            </Text>
          </View>
        )}
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>
            {formatFraction(summary.metrics.checkinCount, summary.metrics.checkinTotal)}
          </Text>
          <Text style={styles.metricLabel}>チェックイン</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>
            {summary.metrics.ifThenCount}回
          </Text>
          <Text style={styles.metricLabel}>If-Then発動</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>
            {summary.metrics.evidenceCount}件
          </Text>
          <Text style={styles.metricLabel}>Evidence</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>詳細を見る →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  loadingText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  errorText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.error,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  infoText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  streakBadge: {
    backgroundColor: colors.accent + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  streakText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.xs,
    color: colors.accent,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontFamily: typography.numeric.fontFamily,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  metricLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.textSecondary + '20',
  },
  footer: {
    marginTop: spacing.md,
    alignItems: 'flex-end',
  },
  footerText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.accent,
  },
});
