/**
 * Payment Success Screen (Ticket 008)
 * Displayed after successful purchase
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography, fontSizes } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

export default function PaymentSuccessScreen() {
  const params = useLocalSearchParams<{
    expiresAt?: string;
  }>();

  const expiresAt = params.expiresAt ? new Date(params.expiresAt) : null;

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleStart = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>✓</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>購入完了</Text>
        <Text style={styles.subtitle}>
          9週間のコーチングが始まります
        </Text>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>VowArc 9週間コーチング</Text>

          {expiresAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>有効期限</Text>
              <Text style={styles.infoValue}>{formatDate(expiresAt)}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.noteRow}>
            <Text style={styles.noteIcon}>💡</Text>
            <Text style={styles.noteText}>
              この期間、すべての機能をご利用いただけます。
              {'\n'}期間終了後は自動的にアクセスが終了します。
            </Text>
          </View>
        </View>

        {/* Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.messageTitle}>新しい旅の始まり</Text>
          <Text style={styles.messageText}>
            21日間で見つけた「自分」と、{'\n'}
            これから9週間を共に歩みます。{'\n\n'}
            AIコーチは、あなたの証人として、{'\n'}
            変化を見守り続けます。
          </Text>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleStart}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>コーチングを始める</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  icon: {
    fontSize: 40,
    color: colors.success,
  },
  title: {
    fontFamily: 'NotoSerifJP-Light',
    fontSize: fontSizes.xxl,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    width: '100%',
    marginBottom: spacing.xl,
  },
  infoTitle: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  infoValue: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.textSecondary + '20',
    marginVertical: spacing.md,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  noteIcon: {
    fontSize: fontSizes.md,
  },
  noteText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: fontSizes.xs * 1.6,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  messageTitle: {
    fontFamily: 'NotoSerifJP-Light',
    fontSize: fontSizes.lg,
    color: colors.day21Accent,
    marginBottom: spacing.md,
  },
  messageText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fontSizes.md * 1.6,
  },
  button: {
    backgroundColor: colors.day21Accent,
    borderRadius: 12,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxxl,
  },
  buttonText: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.md,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
