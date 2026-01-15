/**
 * Day 21 Vow Update Screen (Ticket 007)
 * Allows user to review and update their vow
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography, fontSizes } from '@/constants/theme';
import { useDay21Report } from '@/hooks/data/useDay21Report';
import * as Haptics from 'expo-haptics';

export default function Day21VowUpdateScreen() {
  const { report } = useDay21Report();
  const [vowText, setVowText] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Initialize with current vow
    if (report?.vowEvolution.v2) {
      setVowText(report.vowEvolution.v2.content);
    } else if (report?.vowEvolution.v1) {
      setVowText(report.vowEvolution.v1.content);
    }
  }, [report]);

  const handleEdit = () => {
    setIsEditing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = () => {
    setIsEditing(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Pass updated vow to next screen via global state or params
    router.push({
      pathname: '/(day21)/tough-love',
      params: { updatedVow: vowText },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>誓いの結晶化</Text>
          <Text style={styles.subtitle}>
            21日間の体験を経て、{'\n'}
            あなたの誓いを&quot;今の言葉&quot;に更新してください
          </Text>
        </View>

        {/* Vow Card */}
        <View style={styles.vowCard}>
          {isEditing ? (
            <TextInput
              style={styles.vowInput}
              value={vowText}
              onChangeText={setVowText}
              multiline
              autoFocus
              placeholder="あなたの誓いを入力..."
              placeholderTextColor={colors.textSecondary}
            />
          ) : (
            <Text style={styles.vowText}>
              {vowText || '誓いを設定してください'}
            </Text>
          )}
        </View>

        {/* Edit/Save Button */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={isEditing ? handleSave : handleEdit}
          activeOpacity={0.7}
        >
          <Text style={styles.editButtonText}>
            {isEditing ? '保存' : '編集する'}
          </Text>
        </TouchableOpacity>

        {/* Guidance */}
        <View style={styles.guidance}>
          <Text style={styles.guidanceTitle}>書き方のヒント</Text>
          <Text style={styles.guidanceText}>
            ・3行以内に収める{'\n'}
            ・「〜になる」より「〜する」{'\n'}
            ・具体的な行動を含める
          </Text>
        </View>

        {/* Spacing */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomButton}>
        <TouchableOpacity
          style={[styles.button, !vowText && styles.buttonDisabled]}
          onPress={handleNext}
          activeOpacity={0.8}
          disabled={!vowText}
        >
          <Text style={styles.buttonText}>次へ</Text>
        </TouchableOpacity>
      </View>
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
    paddingTop: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: 'NotoSerifJP-Light',
    fontSize: fontSizes.xxl,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    lineHeight: fontSizes.md * 1.8,
  },
  vowCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.day21Accent,
    padding: spacing.xl,
    minHeight: 160,
  },
  vowText: {
    fontFamily: 'NotoSerifJP-Light',
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    lineHeight: fontSizes.lg * 1.9,
    textAlign: 'center',
  },
  vowInput: {
    fontFamily: 'NotoSerifJP-Light',
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    lineHeight: fontSizes.lg * 1.6,
    textAlign: 'center',
    minHeight: 120,
    textAlignVertical: 'center',
  },
  editButton: {
    alignSelf: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  editButtonText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.day21Accent,
    fontWeight: '600',
  },
  guidance: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  guidanceTitle: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  guidanceText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: fontSizes.sm * 1.8,
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
    backgroundColor: colors.day21Accent,
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
