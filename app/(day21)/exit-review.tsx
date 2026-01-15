/**
 * Exit Ritual Review Screen (Ticket 012)
 * Collects feedback before user exits
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography, fontSizes } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { getApiUrl } from '@/constants/config';
import * as Haptics from 'expo-haptics';

const REASON_CATEGORIES = [
  { id: 'no_effect', label: '効果を感じなかった' },
  { id: 'no_time', label: '時間が確保できなかった' },
  { id: 'financial', label: '金銭的な理由' },
  { id: 'other_service', label: '他のサービスを使う' },
  { id: 'goal_achieved', label: '目標を達成した' },
  { id: 'other', label: 'その他' },
];

export default function ExitReviewScreen() {
  const params = useLocalSearchParams<{
    trigger?: string;
    day_count?: string;
    checkin_count?: string;
    evidence_count?: string;
    potential_statement?: string;
  }>();

  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [expectationGap, setExpectationGap] = useState('');
  const [missingSupport, setMissingSupport] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectReason = async (reasonId: string) => {
    await Haptics.selectionAsync();
    setSelectedReason(reasonId);
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('選択してください', '停止の理由を選択してください。');
      return;
    }

    try {
      setIsSubmitting(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('エラー', '認証エラーが発生しました。');
        return;
      }

      const selectedLabel = REASON_CATEGORIES.find(r => r.id === selectedReason)?.label || selectedReason;

      const response = await fetch(
        getApiUrl('functions/v1/exit-ritual-complete'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            trigger: params.trigger || 'day21_stop',
            day_count: parseInt(params.day_count || '0', 10),
            checkin_count: parseInt(params.checkin_count || '0', 10),
            evidence_count: parseInt(params.evidence_count || '0', 10),
            potential_statement: params.potential_statement || '',
            review: {
              reason_category: selectedLabel,
              expectation_gap: expectationGap || null,
              missing_support: missingSupport || null,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      router.push('/(day21)/exit-complete');
    } catch (error) {
      console.error('Submit review error:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('エラー', '送信に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.textSecondary} size="large" />
        <Text style={styles.loadingText}>送信中...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>最後に教えてください</Text>
          <Text style={styles.subtitle}>
            今後の改善の参考にさせていただきます
          </Text>
        </View>

        {/* Reason Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>停止の理由（必須）</Text>

          {REASON_CATEGORIES.map((reason) => (
            <TouchableOpacity
              key={reason.id}
              style={[
                styles.reasonOption,
                selectedReason === reason.id && styles.reasonOptionSelected,
              ]}
              onPress={() => handleSelectReason(reason.id)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.radioOuter,
                selectedReason === reason.id && styles.radioOuterSelected,
              ]}>
                {selectedReason === reason.id && (
                  <View style={styles.radioInner} />
                )}
              </View>
              <Text style={[
                styles.reasonLabel,
                selectedReason === reason.id && styles.reasonLabelSelected,
              ]}>
                {reason.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Optional Questions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>期待との差（任意）</Text>
          <TextInput
            style={styles.textInput}
            placeholder="どのような期待がありましたか？"
            placeholderTextColor={colors.textSecondary + '80'}
            value={expectationGap}
            onChangeText={setExpectationGap}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>欲しかったサポート（任意）</Text>
          <TextInput
            style={styles.textInput}
            placeholder="どのようなサポートがあれば良かったですか？"
            placeholderTextColor={colors.textSecondary + '80'}
            value={missingSupport}
            onChangeText={setMissingSupport}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            !selectedReason && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!selectedReason}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>送信</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingTop: spacing.xxxl,
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
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  header: {
    marginBottom: spacing.xxl,
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reasonOptionSelected: {
    borderColor: colors.textPrimary,
    backgroundColor: colors.textPrimary + '08',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  radioOuterSelected: {
    borderColor: colors.textPrimary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.textPrimary,
  },
  reasonLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  reasonLabelSelected: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.textSecondary + '20',
  },
  submitButton: {
    backgroundColor: colors.textSecondary,
    borderRadius: 12,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.md,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
