/**
 * Warning Modal Component (Ticket 016)
 * Displayed when a violation is first detected
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { colors, spacing, typography, fontSizes } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

interface WarningModalProps {
  visible: boolean;
  violationType: 'commitment_miss' | 'absence' | 'false_report';
  onDismiss: () => void;
  onResponse: (response: WarningResponse) => void;
}

interface WarningResponse {
  action: 'share_reason' | 'reduce_commitment' | 'redesign_if_then' | 'continue';
  reason?: string;
}

const VIOLATION_MESSAGES = {
  commitment_miss: {
    title: 'ちょっと立ち止まりましょう',
    description: '今週のコミット達成率が低くなっています。',
  },
  absence: {
    title: '少し間が空きましたね',
    description: '3日以上チェックインがありませんでした。',
  },
  false_report: {
    title: '一緒に確認させてください',
    description: '報告内容に気になる点がありました。',
  },
};

export default function WarningModal({
  visible,
  violationType,
  onDismiss,
  onResponse,
}: WarningModalProps) {
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [reason, setReason] = useState('');

  const message = VIOLATION_MESSAGES[violationType];

  const handleShareReason = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowReasonInput(true);
  };

  const handleSubmitReason = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onResponse({ action: 'share_reason', reason });
    setShowReasonInput(false);
    setReason('');
  };

  const handleAction = async (action: WarningResponse['action']) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onResponse({ action });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <Text style={styles.title}>{message.title}</Text>
            <Text style={styles.description}>{message.description}</Text>

            {/* Question */}
            <Text style={styles.question}>何かあったのでしょうか？</Text>

            {/* Reason Input */}
            {showReasonInput ? (
              <View style={styles.reasonContainer}>
                <TextInput
                  style={styles.reasonInput}
                  placeholder="話を聞かせてください..."
                  placeholderTextColor={colors.textSecondary + '80'}
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  autoFocus
                />
                <TouchableOpacity
                  style={[styles.submitButton, !reason && styles.submitButtonDisabled]}
                  onPress={handleSubmitReason}
                  disabled={!reason}
                  activeOpacity={0.8}
                >
                  <Text style={styles.submitButtonText}>送信</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShareReason}
                activeOpacity={0.8}
              >
                <Text style={styles.shareButtonText}>話を聞かせてください</Text>
              </TouchableOpacity>
            )}

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>一緒に計画を見直しましょう</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Action Options */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleAction('reduce_commitment')}
                activeOpacity={0.8}
              >
                <Text style={styles.actionIcon}>📉</Text>
                <Text style={styles.actionText}>コミットを減らす</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleAction('redesign_if_then')}
                activeOpacity={0.8}
              >
                <Text style={styles.actionIcon}>🔄</Text>
                <Text style={styles.actionText}>障害を再設計する</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonSecondary]}
                onPress={() => handleAction('continue')}
                activeOpacity={0.8}
              >
                <Text style={styles.actionIcon}>→</Text>
                <Text style={[styles.actionText, styles.actionTextSecondary]}>
                  このまま続ける
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    backgroundColor: colors.background,
    borderRadius: 20,
    maxHeight: '85%',
    width: '100%',
    maxWidth: 400,
  },
  content: {
    padding: spacing.xl,
  },
  title: {
    fontFamily: 'NotoSerifJP-Light',
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  question: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  shareButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.textSecondary + '30',
  },
  shareButtonText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  reasonContainer: {
    marginBottom: spacing.lg,
  },
  reasonInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.textSecondary + '30',
    marginBottom: spacing.md,
  },
  submitButton: {
    backgroundColor: colors.textPrimary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.md,
    color: colors.background,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.textSecondary + '30',
  },
  dividerText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginHorizontal: spacing.md,
  },
  actionsContainer: {
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.textSecondary + '30',
  },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  actionIcon: {
    fontSize: fontSizes.lg,
    marginRight: spacing.md,
  },
  actionText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  actionTextSecondary: {
    color: colors.textSecondary,
  },
});
