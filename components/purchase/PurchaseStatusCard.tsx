/**
 * Purchase Status Card Component (Ticket 008)
 * Displays current purchase status and remaining time
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography, fontSizes } from '@/constants/theme';
import { usePurchase } from '@/hooks/use-purchase';

interface PurchaseStatusCardProps {
  onRestorePress?: () => void;
  compact?: boolean;
}

export function PurchaseStatusCard({
  onRestorePress,
  compact = false,
}: PurchaseStatusCardProps) {
  const { status, loading, error, restore } = usePurchase();

  if (loading) {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <ActivityIndicator color={colors.day21Accent} size="small" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.containerError, compact && styles.containerCompact]}>
        <Text style={styles.errorText}>購入状態の取得に失敗しました</Text>
      </View>
    );
  }

  // No purchase
  if (!status?.hasPurchase || !status?.isActive) {
    return (
      <View style={[styles.container, styles.containerInactive, compact && styles.containerCompact]}>
        <Text style={styles.statusLabel}>
          {status?.purchase?.status === 'expired' ? 'コーチング期間終了' : 'トライアル期間'}
        </Text>
        {onRestorePress && (
          <TouchableOpacity onPress={onRestorePress} style={styles.restoreButton}>
            <Text style={styles.restoreButtonText}>購入を復元</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Active purchase
  const { daysRemaining, weeksRemaining, expiresAt } = status.purchase!;
  const expiresDate = new Date(expiresAt);

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Status Header */}
      <View style={styles.header}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>アクティブ</Text>
        </View>
        <Text style={styles.productName}>9週間コーチング</Text>
      </View>

      {/* Remaining Time */}
      {!compact && (
        <View style={styles.remainingContainer}>
          <Text style={styles.remainingValue}>
            {daysRemaining}
            <Text style={styles.remainingUnit}>日</Text>
          </Text>
          <Text style={styles.remainingLabel}>
            残り（約{weeksRemaining}週間）
          </Text>
        </View>
      )}

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.max(0, Math.min(100, (daysRemaining / 63) * 100))}%` },
            ]}
          />
        </View>
        {compact && (
          <Text style={styles.compactDays}>{daysRemaining}日残り</Text>
        )}
      </View>

      {/* Expiry Date */}
      {!compact && (
        <Text style={styles.expiryText}>
          {expiresDate.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
          まで
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.day21Accent + '40',
  },
  containerCompact: {
    padding: spacing.md,
  },
  containerInactive: {
    borderColor: colors.textSecondary + '30',
  },
  containerError: {
    borderColor: colors.error + '30',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  statusBadgeText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.xs,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  productName: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  statusLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  remainingContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  remainingValue: {
    fontFamily: typography.heading.fontFamily,
    fontSize: 48,
    color: colors.day21Accent,
    fontWeight: '700',
  },
  remainingUnit: {
    fontSize: fontSizes.lg,
    fontWeight: '400',
  },
  remainingLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.textSecondary + '20',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.day21Accent,
    borderRadius: 3,
  },
  compactDays: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.xs,
    color: colors.day21Accent,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'right',
  },
  expiryText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  errorText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.error,
  },
  restoreButton: {
    marginTop: spacing.sm,
  },
  restoreButtonText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.xs,
    color: colors.day21Accent,
  },
});

export default PurchaseStatusCard;
