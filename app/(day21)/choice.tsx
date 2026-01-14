/**
 * Day 21 Choice Screen (Ticket 007)
 * Final decision screen - Continue or Stop
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography, fontSizes } from '@/constants/theme';
import { completeDay21, ToughLoveIntensity } from '@/hooks/data/useDay21Report';
import * as Haptics from 'expo-haptics';

export default function Day21ChoiceScreen() {
  const params = useLocalSearchParams<{
    updatedVow?: string;
    toughLoveAreas?: string;
    toughLoveIntensity?: string;
    signed?: string;
  }>();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Navigate to payment confirmation screen
    router.push({
      pathname: '/(day21)/payment-confirm',
      params: {
        updatedVow: params.updatedVow,
        toughLoveAreas: params.toughLoveAreas,
        toughLoveIntensity: params.toughLoveIntensity,
        signed: params.signed,
      },
    });
  };

  const handleStop = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      '本当に停止しますか？',
      '21日間の取り組みを終了します。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '停止する',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmitting(true);

              await completeDay21({
                choice: 'stop',
              });

              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

              // Navigate to exit ritual (MVP: simple confirmation)
              Alert.alert(
                'お疲れさまでした',
                '21日間、自分と向き合い続けたことは事実です。\nいつでも戻ってきてください。',
                [
                  {
                    text: '終了',
                    onPress: () => router.replace('/(tabs)'),
                  },
                ]
              );
            } catch (error) {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('エラー', '処理に失敗しました。もう一度お試しください。');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (isSubmitting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.day21Accent} size="large" />
        <Text style={styles.loadingText}>処理中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>選択の時</Text>
          <Text style={styles.subtitle}>
            ここから先は、あなたの選択です
          </Text>
        </View>

        {/* Choice Cards */}
        <View style={styles.choicesContainer}>
          {/* Continue Option */}
          <TouchableOpacity
            style={styles.choiceCard}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <View style={styles.choiceIcon}>
              <Text style={styles.choiceIconText}>→</Text>
            </View>
            <Text style={styles.choiceTitle}>継続する</Text>
            <Text style={styles.choiceDescription}>
              有料期間（3ヶ月）に進み、{'\n'}
              変化を確かなものにする
            </Text>
            <View style={styles.choiceBadge}>
              <Text style={styles.choiceBadgeText}>決済確認へ</Text>
            </View>
          </TouchableOpacity>

          {/* Stop Option */}
          <TouchableOpacity
            style={[styles.choiceCard, styles.choiceCardSecondary]}
            onPress={handleStop}
            activeOpacity={0.8}
          >
            <View style={[styles.choiceIcon, styles.choiceIconSecondary]}>
              <Text style={[styles.choiceIconText, styles.choiceIconTextSecondary]}>・</Text>
            </View>
            <Text style={[styles.choiceTitle, styles.choiceTitleSecondary]}>
              ここで終える
            </Text>
            <Text style={[styles.choiceDescription, styles.choiceDescriptionSecondary]}>
              21日間の体験を{'\n'}
              いったん閉じる
            </Text>
            <View style={[styles.choiceBadge, styles.choiceBadgeSecondary]}>
              <Text style={[styles.choiceBadgeText, styles.choiceBadgeTextSecondary]}>
                Exit Ritualへ
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Note */}
        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            どちらの選択も、あなたの決断として尊重されます。
          </Text>
        </View>
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
  header: {
    marginBottom: spacing.xxl,
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
  choicesContainer: {
    gap: spacing.lg,
  },
  choiceCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.day21Accent,
    padding: spacing.xl,
    alignItems: 'center',
  },
  choiceCardSecondary: {
    borderColor: colors.textSecondary + '30',
  },
  choiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.day21Accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  choiceIconSecondary: {
    backgroundColor: colors.textSecondary + '20',
  },
  choiceIconText: {
    fontSize: 24,
    color: colors.day21Accent,
    fontWeight: 'bold',
  },
  choiceIconTextSecondary: {
    color: colors.textSecondary,
  },
  choiceTitle: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.lg,
    color: colors.day21Accent,
    marginBottom: spacing.sm,
    fontWeight: '700',
  },
  choiceTitleSecondary: {
    color: colors.textSecondary,
  },
  choiceDescription: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: fontSizes.md * 1.6,
    marginBottom: spacing.md,
  },
  choiceDescriptionSecondary: {
    color: colors.textSecondary,
  },
  choiceBadge: {
    backgroundColor: colors.day21Accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  choiceBadgeSecondary: {
    backgroundColor: colors.textSecondary + '30',
  },
  choiceBadgeText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.xs,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  choiceBadgeTextSecondary: {
    color: colors.textSecondary,
  },
  noteContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  noteText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
