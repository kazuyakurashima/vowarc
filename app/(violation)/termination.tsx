/**
 * Termination Screen (Ticket 016)
 * Displayed when user has 3+ consecutive violation weeks (severity 3)
 * Offers pause, redesign, or terminate options
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography, fontSizes } from '@/constants/theme';
import { useVow } from '@/hooks/data/useVow';
import { useAuth } from '@/hooks/auth';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';

type FinalChoice = 'pause' | 'redesign' | 'terminate';

const CHOICE_DETAILS: Record<
  FinalChoice,
  { title: string; description: string; icon: string }
> = {
  pause: {
    title: '一時休止',
    description: '今は難しい時期かもしれません。\n30日間休止して、準備が整ったら再開できます。',
    icon: '⏸️',
  },
  redesign: {
    title: 'ゼロから設計',
    description: '目標を根本から見直しましょう。\n新しい誓いとコミットメントを一から作り直します。',
    icon: '🔄',
  },
  terminate: {
    title: '契約を終了',
    description: 'この旅を終えることを選びます。\nここまでの歩みに感謝を込めて。',
    icon: '🏁',
  },
};

export default function TerminationScreen() {
  const params = useLocalSearchParams<{ violationId?: string }>();
  const { user } = useAuth();
  const { vow, loading: vowLoading } = useVow(user?.id);

  const [selectedChoice, setSelectedChoice] = useState<FinalChoice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evidenceSummary, setEvidenceSummary] = useState<{
    checkinDays: number;
    ifThenTriggers: number;
    evidenceCount: number;
  } | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    // Fetch evidence summary
    fetchEvidenceSummary();
  }, []);

  const fetchEvidenceSummary = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase.rpc('generate_evidence_summary', {
        p_user_id: user.id,
      });

      if (!error && data) {
        setEvidenceSummary({
          checkinDays: data.checkin_days || 0,
          ifThenTriggers: data.if_then_triggers || 0,
          evidenceCount: data.evidence_count || 0,
        });
      }
    } catch (err) {
      console.error('Error fetching evidence summary:', err);
    }
  };

  const handleSelectChoice = async (choice: FinalChoice) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedChoice(choice);
  };

  const handleConfirm = async () => {
    if (!selectedChoice || !user?.id) return;

    try {
      setIsSubmitting(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Update termination record (find by user_id and pending status)
      const { data: terminationRecord } = await supabase
        .from('termination_records')
        .select('id')
        .eq('user_id', user.id)
        .eq('final_choice', 'pending')
        .single();

      if (terminationRecord) {
        await supabase
          .from('termination_records')
          .update({
            final_choice: selectedChoice,
            responded_at: new Date().toISOString(),
          })
          .eq('id', terminationRecord.id);
      }

      // Handle each choice
      switch (selectedChoice) {
        case 'pause':
          await supabase
            .from('users')
            .update({ current_phase: 'paused' })
            .eq('id', user.id);
          break;

        case 'redesign':
          // Mark all current vows/commitments as not current
          await supabase
            .from('vows')
            .update({ is_current: false })
            .eq('user_id', user.id)
            .eq('is_current', true);

          // Mark pending commitments as failed (schema doesn't have 'archived' or 'in_progress')
          await supabase
            .from('commitments')
            .update({ status: 'failed' })
            .eq('user_id', user.id)
            .eq('status', 'pending');

          // Reset to onboarding flow
          router.replace('/(onboarding)');
          return;

        case 'terminate':
          await supabase
            .from('users')
            .update({ current_phase: 'terminated' })
            .eq('id', user.id);
          break;
      }

      router.replace({
        pathname: '/(violation)/termination-complete',
        params: { choice: selectedChoice },
      });
    } catch (error) {
      console.error('Error processing termination choice:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (vowLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.error} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.severityBadge}>
            <Text style={styles.severityBadgeText}>3週連続</Text>
          </View>
          <Text style={styles.title}>大切な選択の時</Text>
          <Text style={styles.subtitle}>
            この3週間、目標の達成が難しい状況が続いています。{'\n'}
            次のステップを一緒に考えましょう。
          </Text>
        </View>

        {/* Journey Summary */}
        {evidenceSummary && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>あなたの歩み</Text>
            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{evidenceSummary.checkinDays}</Text>
                <Text style={styles.statLabel}>チェックイン日数</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{evidenceSummary.ifThenTriggers}</Text>
                <Text style={styles.statLabel}>If-Then発動</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{evidenceSummary.evidenceCount}</Text>
                <Text style={styles.statLabel}>エビデンス</Text>
              </View>
            </View>
          </View>
        )}

        {/* Current Vow */}
        {vow?.content && (
          <View style={styles.vowCard}>
            <Text style={styles.vowLabel}>あなたの誓い</Text>
            <Text style={styles.vowText}>{vow.content}</Text>
          </View>
        )}

        {/* Choice Cards */}
        <Text style={styles.choiceHeader}>どの道を選びますか？</Text>
        <View style={styles.choiceContainer}>
          {(Object.keys(CHOICE_DETAILS) as FinalChoice[]).map((choice) => {
            const detail = CHOICE_DETAILS[choice];
            const isSelected = selectedChoice === choice;

            return (
              <TouchableOpacity
                key={choice}
                style={[
                  styles.choiceCard,
                  isSelected && styles.choiceCardSelected,
                  choice === 'terminate' && styles.choiceCardTerminate,
                  choice === 'terminate' && isSelected && styles.choiceCardTerminateSelected,
                ]}
                onPress={() => handleSelectChoice(choice)}
                activeOpacity={0.8}
              >
                <Text style={styles.choiceIcon}>{detail.icon}</Text>
                <Text
                  style={[
                    styles.choiceTitle,
                    isSelected && styles.choiceTitleSelected,
                    choice === 'terminate' && styles.choiceTitleTerminate,
                  ]}
                >
                  {detail.title}
                </Text>
                <Text style={styles.choiceDescription}>{detail.description}</Text>
                {isSelected && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedIndicatorText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={[
            styles.confirmButton,
            !selectedChoice && styles.confirmButtonDisabled,
            selectedChoice === 'terminate' && styles.confirmButtonTerminate,
          ]}
          onPress={handleConfirm}
          disabled={!selectedChoice || isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmButtonText}>
              {selectedChoice
                ? `${CHOICE_DETAILS[selectedChoice].title}を選択`
                : '選択してください'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Bottom Message */}
        <Text style={styles.bottomMessage}>
          どの選択も、あなたの決断を尊重します。
        </Text>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  severityBadge: {
    backgroundColor: colors.error + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    marginBottom: spacing.md,
  },
  severityBadgeText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.error,
    fontWeight: '600',
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
    textAlign: 'center',
    lineHeight: fontSizes.md * 1.6,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryTitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'NotoSerifJP-Light',
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.textSecondary + '30',
  },
  vowCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  vowLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  vowText: {
    fontFamily: 'NotoSerifJP-Light',
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    lineHeight: fontSizes.lg * 1.8,
  },
  choiceHeader: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  choiceContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  choiceCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  choiceCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + '08',
  },
  choiceCardTerminate: {
    backgroundColor: colors.error + '05',
  },
  choiceCardTerminateSelected: {
    borderColor: colors.error,
    backgroundColor: colors.error + '10',
  },
  choiceIcon: {
    fontSize: fontSizes.xxl,
    marginBottom: spacing.sm,
  },
  choiceTitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  choiceTitleSelected: {
    color: colors.accent,
  },
  choiceTitleTerminate: {
    color: colors.error,
  },
  choiceDescription: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: fontSizes.sm * 1.6,
  },
  selectedIndicator: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicatorText: {
    color: '#FFFFFF',
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  confirmButtonTerminate: {
    backgroundColor: colors.error,
  },
  confirmButtonText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bottomMessage: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
