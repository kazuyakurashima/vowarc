/**
 * Termination Complete Screen (Ticket 016)
 * Farewell message after user selects pause or terminate
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography, fontSizes } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

type FinalChoice = 'pause' | 'redesign' | 'terminate';

const COMPLETION_MESSAGES: Record<
  FinalChoice,
  { title: string; message: string; buttonText: string }
> = {
  pause: {
    title: '休息の時間',
    message:
      '30日後、準備ができたらお待ちしています。\n\nこの期間も、あなたの小さな一歩を\n心から応援しています。',
    buttonText: 'アプリを閉じる',
  },
  redesign: {
    title: '新たな出発',
    message:
      '過去の経験を糧に、\n新しい目標を設計しましょう。\n\n次のページから、\n改めて自分と向き合います。',
    buttonText: '新しい旅を始める',
  },
  terminate: {
    title: 'お疲れさまでした',
    message:
      'ここまでの旅、本当にお疲れさまでした。\n\n始めようとした、その一歩。\n挑戦したその時間。\nすべてがあなたの一部です。\n\nまた会える日を楽しみにしています。',
    buttonText: 'さようなら',
  },
};

export default function TerminationCompleteScreen() {
  const params = useLocalSearchParams<{ choice?: string }>();
  const choice = (params.choice as FinalChoice) || 'terminate';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Gentle entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();

    // Gentle haptic
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleClose = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (choice === 'redesign') {
      router.replace('/(onboarding)');
    } else {
      // For pause/terminate, go to a minimal state
      router.replace('/(tabs)');
    }
  };

  const content = COMPLETION_MESSAGES[choice];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Decorative Element */}
        <View style={styles.decorativeCircle}>
          <View style={styles.decorativeInner} />
        </View>

        {/* Title */}
        <Text style={styles.title}>{content.title}</Text>

        {/* Message */}
        <Text style={styles.message}>{content.message}</Text>

        {/* Quote */}
        {choice === 'terminate' && (
          <View style={styles.quoteCard}>
            <Text style={styles.quoteText}>
              「終わりは、また新しい始まりの種」
            </Text>
          </View>
        )}

        {choice === 'pause' && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>休止期間について</Text>
            <Text style={styles.infoText}>
              • 30日間、チェックインの義務はありません{'\n'}
              • データは安全に保存されます{'\n'}
              • いつでも再開できます
            </Text>
          </View>
        )}

        {/* Button */}
        <TouchableOpacity
          style={[
            styles.button,
            choice === 'terminate' && styles.buttonTerminate,
            choice === 'pause' && styles.buttonPause,
          ]}
          onPress={handleClose}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{content.buttonText}</Text>
        </TouchableOpacity>
      </Animated.View>
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
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  content: {
    alignItems: 'center',
  },
  decorativeCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  decorativeInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.textSecondary + '20',
  },
  title: {
    fontFamily: 'NotoSerifJP-Light',
    fontSize: fontSizes.xxl,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  message: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fontSizes.md * 1.8,
    marginBottom: spacing.xxl,
  },
  quoteCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
    borderLeftWidth: 2,
    borderLeftColor: colors.textSecondary + '50',
  },
  quoteText: {
    fontFamily: 'NotoSerifJP-Light',
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
    width: '100%',
  },
  infoTitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  infoText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: fontSizes.sm * 1.8,
  },
  button: {
    backgroundColor: colors.textPrimary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 200,
  },
  buttonTerminate: {
    backgroundColor: colors.textSecondary,
  },
  buttonPause: {
    backgroundColor: colors.warning,
  },
  buttonText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
