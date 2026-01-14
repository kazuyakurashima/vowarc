/**
 * Exit Ritual Complete Screen (Ticket 012)
 * Final farewell message
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography, fontSizes } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

export default function ExitCompleteScreen() {
  const handleClose = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🙏</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>ありがとうございました</Text>

        {/* Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.messageMain}>
            あなたの可能性は{'\n'}
            まだここにあります。
          </Text>

          <Text style={styles.messageSub}>
            いつか再び挑戦したくなった時、{'\n'}
            ここで待っています。
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Note */}
        <Text style={styles.note}>
          この21日間で見つけたことは、{'\n'}
          あなたの中に残り続けます。
        </Text>

        {/* Close Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleClose}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>閉じる</Text>
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
    paddingTop: spacing.xxxl * 1.5,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontFamily: 'NotoSerifJP-Light',
    fontSize: fontSizes.xxl,
    color: colors.textPrimary,
    marginBottom: spacing.xxl,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  messageMain: {
    fontFamily: 'NotoSerifJP-Light',
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: fontSizes.lg * 1.8,
    marginBottom: spacing.lg,
  },
  messageSub: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fontSizes.md * 1.6,
  },
  divider: {
    width: 60,
    height: 1,
    backgroundColor: colors.textSecondary + '30',
    marginBottom: spacing.xxl,
  },
  note: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fontSizes.sm * 1.6,
    fontStyle: 'italic',
    marginBottom: spacing.xxxl,
  },
  button: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxxl,
    borderWidth: 1,
    borderColor: colors.textSecondary + '30',
  },
  buttonText: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
