/**
 * Small Wins Dashboard Screen (Ticket 010)
 * Displays detailed process metrics and tier information
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography, fontSizes } from '@/constants/theme';
import { useSmallWins, formatPercent, formatFraction } from '@/hooks/data/useSmallWins';

// Progress Bar Component
function ProgressBar({ rate, label }: { rate: number; label: string }) {
  const percentage = Math.min(100, Math.round(rate * 100));

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressPercent}>{percentage}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
}

// Tier Badge Component
function TierBadge({ tier, label, message }: { tier: string; label: string; message: string }) {
  const getBadgeColor = () => {
    switch (tier) {
      case 'on_track':
        return colors.success;
      case 'at_risk':
        return colors.warning;
      case 'needs_reset':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const badgeColor = getBadgeColor();

  return (
    <View style={[styles.tierBadge, { borderColor: badgeColor }]}>
      <Text style={[styles.tierLabel, { color: badgeColor }]}>{label}</Text>
      <Text style={styles.tierMessage}>{message}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { summary, loading, error, refetch } = useSmallWins();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.loadingText}>メトリクスを計算中...</Text>
      </View>
    );
  }

  if (error || !summary) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>エラー</Text>
        <Text style={styles.errorMessage}>
          {error?.message || 'メトリクスの読み込みに失敗しました'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryButtonText}>再試行</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Small Wins</Text>
      </View>

      {/* Streak Highlight */}
      {summary.metrics.checkinStreak > 0 && (
        <View style={styles.streakCard}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakValue}>
            連続チェックイン: {summary.metrics.checkinStreak}日
          </Text>
        </View>
      )}

      {/* All-time Metrics */}
      <View style={styles.metricsCard}>
        <Text style={styles.sectionTitle}>全期間の実績</Text>

        <View style={styles.metricRow}>
          <Text style={styles.metricRowLabel}>
            チェックイン: {formatFraction(summary.metrics.checkinCount, summary.metrics.checkinTotal)}日
          </Text>
        </View>
        <ProgressBar rate={summary.metrics.checkinRate} label="継続率" />

        <View style={styles.metricRow}>
          <Text style={styles.metricRowLabel}>
            If-Then発動: {summary.metrics.ifThenCount}回
          </Text>
        </View>
        <ProgressBar rate={summary.metrics.ifThenRate} label="発動率" />

        <View style={styles.metricRow}>
          <Text style={styles.metricRowLabel}>
            Evidence: {summary.metrics.evidenceCount}件 / 期待{summary.metrics.evidenceExpected}件
          </Text>
        </View>
        <ProgressBar rate={summary.metrics.evidenceRate} label="提出率" />

        <View style={styles.metricRow}>
          <Text style={styles.metricRowLabel}>
            コミット完了: {formatFraction(summary.metrics.commitmentCompleted, summary.metrics.commitmentTotal)}
          </Text>
        </View>
        <ProgressBar rate={summary.metrics.commitmentRate} label="履行率" />
      </View>

      {/* Tier Display */}
      <View style={styles.tierCard}>
        <Text style={styles.sectionTitle}>行動継続ティア</Text>
        <TierBadge
          tier={summary.tier}
          label={summary.tierLabel}
          message={summary.tierMessage}
        />

        {/* Calculation Breakdown */}
        <View style={styles.calculationBox}>
          <Text style={styles.calculationTitle}>算出根拠:</Text>
          <Text style={styles.calculationItem}>
            ・チェックイン継続率: {formatFraction(summary.metrics.checkinCount, summary.metrics.checkinTotal)}日 ({formatPercent(summary.metrics.checkinRate)})
          </Text>
          <Text style={styles.calculationItem}>
            ・If-Then発動率: {summary.metrics.ifThenCount}回 ({formatPercent(summary.metrics.ifThenRate)})
          </Text>
          <Text style={styles.calculationItem}>
            ・Evidence提出率: {summary.metrics.evidenceCount}件 ({formatPercent(summary.metrics.evidenceRate)})
          </Text>
          <Text style={styles.calculationItem}>
            ・コミット履行率: {formatFraction(summary.metrics.commitmentCompleted, summary.metrics.commitmentTotal)}件 ({formatPercent(summary.metrics.commitmentRate)})
          </Text>
          <View style={styles.calculationDivider} />
          <Text style={styles.calculationResult}>
            平均: {formatPercent(summary.averageRate)} → {summary.tierLabel}
          </Text>
          <Text style={styles.calculationNote}>
            ※ このスコアは行動指標であり、成果を保証しません
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  errorTitle: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.xl,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  backButton: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.accent,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.xxl,
    color: colors.textPrimary,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: 12,
  },
  streakEmoji: {
    fontSize: 32,
    marginRight: spacing.sm,
  },
  streakValue: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
  },
  metricsCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: 12,
  },
  sectionTitle: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  metricRow: {
    marginTop: spacing.md,
  },
  metricRowLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  progressContainer: {
    marginBottom: spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  progressPercent: {
    fontFamily: typography.numeric.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.textSecondary + '20',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  tierCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: 12,
  },
  tierBadge: {
    borderWidth: 2,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  tierLabel: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.xl,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  tierMessage: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  calculationBox: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
  },
  calculationTitle: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  calculationItem: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    lineHeight: fontSizes.sm * typography.body.lineHeight,
  },
  calculationDivider: {
    height: 1,
    backgroundColor: colors.textSecondary + '30',
    marginVertical: spacing.sm,
  },
  calculationResult: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  calculationNote: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
