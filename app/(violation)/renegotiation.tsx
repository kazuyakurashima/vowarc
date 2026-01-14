/**
 * Renegotiation Screen (Ticket 016)
 * Displayed when user has 2 consecutive violation weeks (severity 2)
 * Allows goal editing and re-signing of contract
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography, fontSizes } from '@/constants/theme';
import { useVow } from '@/hooks/data/useVow';
import { useCommitments } from '@/hooks/data/useCommitments';
import { useViolationStatus } from '@/hooks/data/useViolationStatus';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';

type Step = 'review' | 'edit' | 'sign';

export default function RenegotiationScreen() {
  const params = useLocalSearchParams<{ violationId?: string }>();
  const { user } = useAuth();
  const { vow, loading: vowLoading } = useVow(user?.id);
  const { commitments, loading: commitmentsLoading } = useCommitments(user?.id);
  const { resolveViolation } = useViolationStatus(user?.id);

  const [step, setStep] = useState<Step>('review');
  const [editedVow, setEditedVow] = useState('');
  const [editedCommitments, setEditedCommitments] = useState<string[]>([]);
  const [hasSigned, setHasSigned] = useState(false);
  const [signaturePath, setSignaturePath] = useState<{ x: number; y: number }[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Initialize edited values
  useEffect(() => {
    if (vow?.content) {
      setEditedVow(vow.content);
    }
    if (commitments && commitments.length > 0) {
      setEditedCommitments(commitments.map((c) => c.content || ''));
    }
  }, [vow, commitments]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setSignaturePath([{ x: locationX, y: locationY }]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setSignaturePath((prev) => [...prev, { x: locationX, y: locationY }]);
      },
      onPanResponderRelease: () => {
        if (signaturePath.length > 10) {
          setHasSigned(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      },
    })
  ).current;

  const handleProceedToEdit = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('edit');
  };

  const handleProceedToSign = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('sign');
  };

  const handleComplete = async () => {
    if (!user?.id) return;

    try {
      setIsSaving(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Update vow if changed
      if (editedVow !== vow?.content) {
        // Mark old vow as not current
        await supabase
          .from('vows')
          .update({ is_current: false })
          .eq('user_id', user.id)
          .eq('is_current', true);

        // Insert new vow
        await supabase.from('vows').insert({
          user_id: user.id,
          content: editedVow,
          is_current: true,
          version: (vow?.version || 0) + 1,
        });
      }

      // Update commitments if changed
      for (let i = 0; i < commitments.length; i++) {
        if (editedCommitments[i] !== commitments[i]?.content) {
          await supabase
            .from('commitments')
            .update({ content: editedCommitments[i] })
            .eq('id', commitments[i].id);
        }
      }

      // Resolve the violation
      if (params.violationId) {
        await resolveViolation(
          params.violationId,
          'renegotiated',
          `Vow updated. Commitments adjusted: ${editedCommitments.join(', ')}`
        );
      }

      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving renegotiation:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const clearSignature = () => {
    setSignaturePath([]);
    setHasSigned(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const isLoading = vowLoading || commitmentsLoading;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.warning} />
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
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.warningBadge}>
              <Text style={styles.warningBadgeText}>2週連続</Text>
            </View>
            <Text style={styles.title}>契約の見直し</Text>
            <Text style={styles.subtitle}>
              一緒に目標を調整し、再出発しましょう
            </Text>
          </View>

          {/* Step: Review */}
          {step === 'review' && (
            <View style={styles.stepContainer}>
              <Text style={styles.sectionTitle}>現在の誓い</Text>
              <View style={styles.vowCard}>
                <Text style={styles.vowText}>{vow?.content || '誓いが設定されていません'}</Text>
              </View>

              <Text style={styles.sectionTitle}>現在のコミットメント</Text>
              {commitments.map((c, index) => (
                <View key={c.id} style={styles.commitmentCard}>
                  <Text style={styles.commitmentText}>{c.content}</Text>
                  <Text style={styles.commitmentStatus}>
                    {c.status === 'completed' ? '✓ 完了' : '未完了'}
                  </Text>
                </View>
              ))}

              <View style={styles.questionBox}>
                <Text style={styles.questionText}>
                  この目標は現実的でしょうか？{'\n'}
                  無理のない計画に調整しませんか？
                </Text>
              </View>
            </View>
          )}

          {/* Step: Edit */}
          {step === 'edit' && (
            <View style={styles.stepContainer}>
              <Text style={styles.sectionTitle}>誓いを見直す</Text>
              <TextInput
                style={styles.vowInput}
                value={editedVow}
                onChangeText={setEditedVow}
                multiline
                placeholder="あなたの誓いを書き直してください..."
                placeholderTextColor={colors.textSecondary + '80'}
              />

              <Text style={styles.sectionTitle}>コミットメントを調整</Text>
              {editedCommitments.map((c, index) => (
                <TextInput
                  key={index}
                  style={styles.commitmentInput}
                  value={c}
                  onChangeText={(text) => {
                    const updated = [...editedCommitments];
                    updated[index] = text;
                    setEditedCommitments(updated);
                  }}
                  placeholder={`コミットメント ${index + 1}`}
                  placeholderTextColor={colors.textSecondary + '80'}
                />
              ))}

              <View style={styles.tipBox}>
                <Text style={styles.tipText}>
                  💡 小さく始めることで、継続しやすくなります
                </Text>
              </View>
            </View>
          )}

          {/* Step: Sign */}
          {step === 'sign' && (
            <View style={styles.stepContainer}>
              <Text style={styles.sectionTitle}>新しい契約</Text>
              <View style={styles.contractCard}>
                <Text style={styles.contractLabel}>私の誓い</Text>
                <Text style={styles.contractContent}>{editedVow}</Text>
              </View>

              <Animated.View
                style={[
                  styles.signatureContainer,
                  { transform: [{ scale: hasSigned ? 1 : pulseAnim }] },
                ]}
              >
                <View style={styles.signatureLabel}>
                  <Text style={styles.signatureLabelText}>
                    {hasSigned ? '署名完了' : '下の枠内に指で署名'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.signatureArea,
                    hasSigned && styles.signatureAreaSigned,
                  ]}
                  {...panResponder.panHandlers}
                >
                  {signaturePath.length > 0 && (
                    <View style={styles.signatureDisplay}>
                      {signaturePath.map((point, index) => (
                        <View
                          key={index}
                          style={[
                            styles.signaturePoint,
                            { left: point.x - 2, top: point.y - 2 },
                          ]}
                        />
                      ))}
                    </View>
                  )}
                  {!hasSigned && signaturePath.length === 0 && (
                    <Text style={styles.signaturePlaceholder}>ここに署名</Text>
                  )}
                </View>
                {hasSigned && (
                  <TouchableOpacity style={styles.clearButton} onPress={clearSignature}>
                    <Text style={styles.clearButtonText}>署名をやり直す</Text>
                  </TouchableOpacity>
                )}
              </Animated.View>

              <Text style={styles.dateText}>
                {new Date().toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomButton}>
        {step === 'review' && (
          <TouchableOpacity
            style={styles.button}
            onPress={handleProceedToEdit}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>目標を調整する</Text>
          </TouchableOpacity>
        )}
        {step === 'edit' && (
          <TouchableOpacity
            style={[styles.button, !editedVow && styles.buttonDisabled]}
            onPress={handleProceedToSign}
            activeOpacity={0.8}
            disabled={!editedVow}
          >
            <Text style={styles.buttonText}>契約を更新する</Text>
          </TouchableOpacity>
        )}
        {step === 'sign' && (
          <TouchableOpacity
            style={[styles.button, (!hasSigned || isSaving) && styles.buttonDisabled]}
            onPress={handleComplete}
            activeOpacity={0.8}
            disabled={!hasSigned || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>再出発する</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  warningBadge: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    marginBottom: spacing.md,
  },
  warningBadgeText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.warning,
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
  },
  stepContainer: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  vowCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  vowText: {
    fontFamily: 'NotoSerifJP-Light',
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    lineHeight: fontSizes.lg * 1.8,
  },
  commitmentCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commitmentText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    flex: 1,
  },
  commitmentStatus: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  questionBox: {
    backgroundColor: colors.warning + '15',
    borderRadius: 12,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  questionText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: fontSizes.md * 1.6,
  },
  vowInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.textSecondary + '30',
  },
  commitmentInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.textSecondary + '30',
  },
  tipBox: {
    backgroundColor: colors.success + '15',
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  tipText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  contractCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 2,
    borderColor: colors.warning,
  },
  contractLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  contractContent: {
    fontFamily: 'NotoSerifJP-Light',
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    lineHeight: fontSizes.lg * 1.8,
  },
  signatureContainer: {
    marginBottom: spacing.lg,
  },
  signatureLabel: {
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  signatureLabelText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  signatureArea: {
    height: 120,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.textSecondary + '30',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  signatureAreaSigned: {
    borderColor: colors.warning,
    borderStyle: 'solid',
  },
  signatureDisplay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  signaturePoint: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.warning,
  },
  signaturePlaceholder: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  clearButton: {
    alignSelf: 'center',
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  clearButtonText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  dateText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
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
    backgroundColor: colors.warning,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
