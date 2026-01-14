/**
 * Day 21 Payment Confirmation Screen (Ticket 008 / TICKET-PAY-003)
 * Purchase confirmation for 9-week coaching package
 * Non-Renewing Subscription - One-time payment with no auto-renewal
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography, fontSizes } from '@/constants/theme';
import { usePurchase } from '@/hooks/use-purchase';
import { completeDay21, ToughLoveIntensity } from '@/hooks/data/useDay21Report';
import * as Haptics from 'expo-haptics';

export default function PaymentConfirmScreen() {
  const params = useLocalSearchParams<{
    updatedVow?: string;
    toughLoveAreas?: string;
    toughLoveIntensity?: string;
    signed?: string;
  }>();

  const { purchase, loading: purchaseLoading, error: purchaseError, package: pkg } = usePurchase();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      setIsProcessing(true);

      // Execute purchase
      const success = await purchase();

      if (!success) {
        // User cancelled
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }

      // Complete Day21 with continue choice
      const toughLoveAreas = params.toughLoveAreas?.split(',').filter(Boolean) || [];
      const intensity = (params.toughLoveIntensity as ToughLoveIntensity) || 'standard';

      await completeDay21({
        choice: 'continue',
        updatedVow: params.updatedVow,
        toughLoveSettings: {
          areas: toughLoveAreas,
          intensity,
        },
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate to success screen
      router.replace({
        pathname: '/(day21)/payment-success',
        params: {
          expiresAt: new Date(Date.now() + 63 * 24 * 60 * 60 * 1000).toISOString(),
        },
      });
    } catch (error: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      if (error.message === 'PURCHASE_CANCELLED') {
        // User cancelled, do nothing
        return;
      }

      Alert.alert(
        '購入エラー',
        '購入処理に失敗しました。もう一度お試しください。',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Navigate to restore flow (for users who already purchased)
    Alert.alert(
      '購入を復元',
      '以前に購入したことがある場合、復元できます。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '復元する',
          onPress: async () => {
            // TODO: Implement restore flow
            Alert.alert('復元機能', '復元機能は準備中です。');
          },
        },
      ]
    );
  };

  const handleBack = () => {
    router.back();
  };

  if (isProcessing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.day21Accent} size="large" />
        <Text style={styles.loadingText}>購入処理中...</Text>
        <Text style={styles.loadingSubtext}>
          App Storeの画面が表示されます
        </Text>
      </View>
    );
  }

  // Price from package or fallback
  const price = pkg?.product?.priceString || '¥19,800';
  const duration = '9週間（63日間）';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>最終確認</Text>
          <Text style={styles.subtitle}>
            9週間の本格コーチングを始めます
          </Text>
        </View>

        {/* Product Card */}
        <View style={styles.productCard}>
          <View style={styles.productHeader}>
            <Text style={styles.productTitle}>VowArk 9週間コーチング</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>買い切り</Text>
            </View>
          </View>

          <View style={styles.productDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>期間</Text>
              <Text style={styles.detailValue}>{duration}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>価格</Text>
              <Text style={styles.detailValuePrice}>{price}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Key Points */}
          <View style={styles.pointsContainer}>
            <View style={styles.pointRow}>
              <Text style={styles.pointIcon}>✓</Text>
              <Text style={styles.pointText}>自動更新なし・解約手続き不要</Text>
            </View>
            <View style={styles.pointRow}>
              <Text style={styles.pointIcon}>✓</Text>
              <Text style={styles.pointText}>63日後に自動終了</Text>
            </View>
            <View style={styles.pointRow}>
              <Text style={styles.pointIcon}>✓</Text>
              <Text style={styles.pointText}>追加料金は一切発生しません</Text>
            </View>
          </View>
        </View>

        {/* Safety Note */}
        <View style={styles.safetyNote}>
          <Text style={styles.safetyTitle}>安心ポイント</Text>
          <Text style={styles.safetyText}>
            このサブスクリプションは自動更新されません。{'\n'}
            9週間後にアクセスが終了し、追加の課金は発生しません。{'\n'}
            「うっかり課金され続ける」心配はありません。
          </Text>
        </View>

        {/* Refund Policy */}
        <View style={styles.policyNote}>
          <Text style={styles.policyTitle}>返金について</Text>
          <Text style={styles.policyText}>
            購入後48時間以内であれば、Appleを通じて返金リクエストが可能です。
            詳しくはApp Storeのサポートをご確認ください。
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.purchaseButton}
            onPress={handlePurchase}
            activeOpacity={0.8}
            disabled={purchaseLoading}
          >
            <Text style={styles.purchaseButtonText}>
              {price}で購入する
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            activeOpacity={0.8}
          >
            <Text style={styles.restoreButtonText}>
              以前の購入を復元
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>
              戻る
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Message */}
        {purchaseError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{purchaseError}</Text>
          </View>
        )}

        {/* Terms */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            購入することで、利用規約とプライバシーポリシーに同意したものとみなされます。
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
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
    color: colors.day21Accent,
    marginTop: spacing.md,
    fontWeight: '600',
  },
  loadingSubtext: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: 'center',
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
  },
  productCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.day21Accent,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  productTitle: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    fontWeight: '700',
    flex: 1,
  },
  badge: {
    backgroundColor: colors.day21Accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  badgeText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.xs,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  productDetails: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  detailValue: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  detailValuePrice: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.xl,
    color: colors.day21Accent,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.textSecondary + '20',
    marginVertical: spacing.lg,
  },
  pointsContainer: {
    gap: spacing.sm,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pointIcon: {
    fontSize: fontSizes.md,
    color: colors.success,
    fontWeight: 'bold',
  },
  pointText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  safetyNote: {
    backgroundColor: colors.success + '10',
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  safetyTitle: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.success,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  safetyText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    lineHeight: fontSizes.sm * 1.6,
  },
  policyNote: {
    backgroundColor: colors.textSecondary + '10',
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  policyTitle: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  policyText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: fontSizes.xs * 1.6,
  },
  buttonsContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  purchaseButton: {
    backgroundColor: colors.day21Accent,
    borderRadius: 12,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  purchaseButtonText: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.md,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  restoreButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  restoreButtonText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.day21Accent,
  },
  backButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  backButtonText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  errorContainer: {
    backgroundColor: colors.error + '10',
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.error,
    textAlign: 'center',
  },
  termsContainer: {
    alignItems: 'center',
  },
  termsText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fontSizes.xs * 1.5,
  },
});
