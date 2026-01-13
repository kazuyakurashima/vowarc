/**
 * Day 21 Report Screen (Ticket 007)
 * Displays the Commitment Report with all metrics and highlights
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography, fontSizes } from '@/constants/theme';
import { useDay21Report } from '@/hooks/data/useDay21Report';
import * as Haptics from 'expo-haptics';

// Progress Bar Component
function ProgressBar({ rate, label, value }: { rate: number; label: string; value: string }) {
  const percentage = Math.min(100, Math.round(rate * 100));

  return (
    <View style={styles.progressItem}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{value}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
}

// Tier Badge Component
function TierBadge({ tier, label }: { tier: string; label: string }) {
  const getColor = () => {
    switch (tier) {
      case 'on_track': return colors.success;
      case 'at_risk': return colors.warning;
      case 'needs_reset': return colors.error;
      default: return colors.textSecondary;
    }
  };

  return (
    <View style={[styles.tierBadge, { borderColor: getColor() }]}>
      <Text style={[styles.tierLabel, { color: getColor() }]}>{label}</Text>
    </View>
  );
}

export default function Day21ReportScreen() {
  const { report, loading, error, refetch } = useDay21Report();

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(day21)/vow-update');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.day21Accent} size="large" />
        <Text style={styles.loadingText}>レポートを生成中...</Text>
      </View>
    );
  }

  if (error || !report) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>エラー</Text>
        <Text style={styles.errorMessage}>
          {error?.message || 'レポートの読み込みに失敗しました'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryButtonText}>再試行</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>21日間を振り返る</Text>
        </View>

        {/* Tier Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>あなたの行動継続</Text>
          <TierBadge tier={report.tier} label={report.tierLabel} />
          <Text style={styles.tierMessage}>{report.tierMessage}</Text>
        </View>

        {/* Metrics Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>行動メトリクス</Text>
          <ProgressBar
            rate={report.metrics.checkinRate}
            label="チェックイン"
            value={`${report.metrics.checkinCount}/${report.metrics.checkinTotal}日`}
          />
          <ProgressBar
            rate={report.metrics.ifThenRate}
            label="If-Then発動"
            value={`${report.metrics.ifThenCount}回`}
          />
          <ProgressBar
            rate={report.metrics.evidenceRate}
            label="Evidence提出"
            value={`${report.metrics.evidenceCount}件`}
          />
          <ProgressBar
            rate={report.metrics.commitmentRate}
            label="コミット履行"
            value={`${report.metrics.commitmentCompleted}/${report.metrics.commitmentTotal}件`}
          />
          <View style={styles.averageContainer}>
            <Text style={styles.averageLabel}>平均</Text>
            <Text style={styles.averageValue}>{Math.round(report.averageRate * 100)}%</Text>
          </View>
        </View>

        {/* Resilience Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>踏みとどまり回数</Text>
          <Text style={styles.resilienceCount}>{report.resilienceCount}回</Text>
          <View style={styles.resilienceBreakdown}>
            <Text style={styles.breakdownItem}>
              If-Then実行: {report.resilienceBreakdown.ifThenExecutions}回
            </Text>
            <Text style={styles.breakdownItem}>
              復帰: {report.resilienceBreakdown.comebacks}回
            </Text>
            <Text style={styles.breakdownItem}>
              粘り: {report.resilienceBreakdown.persistenceInCheckins}回
            </Text>
          </View>
        </View>

        {/* Evidence Highlights */}
        {report.evidenceHighlights.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>証拠のハイライト</Text>
            {report.evidenceHighlights.map((highlight, index) => (
              <View key={highlight.id} style={styles.highlightItem}>
                <Text style={styles.highlightDate}>{highlight.date}</Text>
                <Text style={styles.highlightTitle}>{highlight.title}</Text>
                <Text style={styles.highlightReason}>{highlight.reason}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Vow Evolution */}
        {report.vowEvolution.v1 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>志の進化</Text>
            <View style={styles.vowEvolution}>
              <Text style={styles.vowVersionLabel}>v1（開始時）</Text>
              <Text style={styles.vowContent}>{report.vowEvolution.v1.content}</Text>
              {report.vowEvolution.v2 && report.vowEvolution.hasEvolved && (
                <>
                  <Text style={styles.vowArrow}>↓</Text>
                  <Text style={styles.vowVersionLabel}>v2（現在）</Text>
                  <Text style={styles.vowContent}>{report.vowEvolution.v2.content}</Text>
                </>
              )}
            </View>
          </View>
        )}

        {/* Potential Statement */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>AIが見ている可能性</Text>
          <Text style={styles.potentialStatement}>{report.potentialStatement}</Text>
        </View>

        {/* Spacing for button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomButton}>
        <TouchableOpacity style={styles.button} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.buttonText}>次へ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
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
    backgroundColor: colors.day21Accent,
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
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: 'NotoSerifJP-Light',
    fontSize: fontSizes.xxl,
    color: colors.textPrimary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  tierBadge: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  tierLabel: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.lg,
    fontWeight: '700',
  },
  tierMessage: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  progressItem: {
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  progressValue: {
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
    backgroundColor: colors.day21Accent,
    borderRadius: 4,
  },
  averageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.textSecondary + '20',
  },
  averageLabel: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  averageValue: {
    fontFamily: typography.numeric.fontFamily,
    fontSize: fontSizes.md,
    color: colors.day21Accent,
    fontWeight: '700',
  },
  resilienceCount: {
    fontFamily: typography.numeric.fontFamily,
    fontSize: fontSizes.xxxl,
    color: colors.day21Accent,
    marginBottom: spacing.md,
  },
  resilienceBreakdown: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
  },
  breakdownItem: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  highlightItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.textSecondary + '20',
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
  },
  highlightDate: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  highlightTitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  highlightReason: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  vowEvolution: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
  },
  vowVersionLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  vowContent: {
    fontFamily: 'NotoSerifJP-Light',
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    lineHeight: fontSizes.md * 1.8,
  },
  vowArrow: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.lg,
    color: colors.day21Accent,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  potentialStatement: {
    fontFamily: 'NotoSerifJP-Light',
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    lineHeight: fontSizes.md * 1.9,
  },
  bottomButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.textSecondary + '10',
  },
  button: {
    backgroundColor: colors.day21Accent,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
