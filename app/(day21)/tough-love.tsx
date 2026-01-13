/**
 * Day 21 Tough Love Screen (Ticket 007)
 * Intervention consent and intensity settings
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography, fontSizes } from '@/constants/theme';
import { useDay21Report } from '@/hooks/data/useDay21Report';
import { ToughLoveIntensity } from '@/hooks/data/useDay21Report';
import * as Haptics from 'expo-haptics';

// Intervention areas
const INTERVENTION_AREAS = [
  { key: 'avoidance', label: '逃げ癖', description: '困難から逃げるパターンへの指摘' },
  { key: 'time_excuse', label: '時間言い訳', description: '「時間がない」という言い訳への指摘' },
  { key: 'deliverables', label: '提出物', description: 'Evidence未提出への指摘' },
  { key: 'digression', label: '逸脱会話', description: '話題を逸らすパターンへの指摘' },
];

const INTENSITY_OPTIONS: { key: ToughLoveIntensity; label: string; description: string }[] = [
  { key: 'gentle', label: '穏やか', description: '優しく気づきを促す' },
  { key: 'standard', label: '標準', description: 'バランスよく指摘する' },
  { key: 'strong', label: '強め', description: '厳しく率直に伝える' },
];

export default function Day21ToughLoveScreen() {
  const { report } = useDay21Report();
  const params = useLocalSearchParams<{ updatedVow?: string }>();
  const [selectedAreas, setSelectedAreas] = useState<string[]>(['avoidance', 'time_excuse']);
  const [intensity, setIntensity] = useState<ToughLoveIntensity>('standard');

  const toggleArea = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAreas(prev =>
      prev.includes(key)
        ? prev.filter(a => a !== key)
        : [...prev, key]
    );
  };

  const selectIntensity = (key: ToughLoveIntensity) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIntensity(key);
  };

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/(day21)/re-sign',
      params: {
        updatedVow: params.updatedVow || '',
        toughLoveAreas: selectedAreas.join(','),
        toughLoveIntensity: intensity,
      },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>厳しさへの合意</Text>
          <Text style={styles.subtitle}>
            有料期間では、あなたの成長のために{'\n'}
            厳しい指摘をすることがあります
          </Text>
        </View>

        {/* Tough Love Preview */}
        {report?.toughLovePreview && (
          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>予告</Text>
            <Text style={styles.previewText}>{report.toughLovePreview}</Text>
          </View>
        )}

        {/* Intervention Areas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>介入を許可する領域</Text>
          <Text style={styles.sectionDescription}>
            チェックを入れた領域について、AIが厳しく指摘します
          </Text>
          {INTERVENTION_AREAS.map(area => (
            <TouchableOpacity
              key={area.key}
              style={[
                styles.areaItem,
                selectedAreas.includes(area.key) && styles.areaItemSelected,
              ]}
              onPress={() => toggleArea(area.key)}
              activeOpacity={0.7}
            >
              <View style={styles.areaCheckbox}>
                {selectedAreas.includes(area.key) && (
                  <View style={styles.areaCheckboxInner} />
                )}
              </View>
              <View style={styles.areaContent}>
                <Text style={styles.areaLabel}>{area.label}</Text>
                <Text style={styles.areaDescription}>{area.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Intensity Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>介入の強度</Text>
          <View style={styles.intensityContainer}>
            {INTENSITY_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.intensityOption,
                  intensity === option.key && styles.intensityOptionSelected,
                ]}
                onPress={() => selectIntensity(option.key)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.intensityLabel,
                  intensity === option.key && styles.intensityLabelSelected,
                ]}>
                  {option.label}
                </Text>
                <Text style={styles.intensityDescription}>{option.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Note */}
        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            ※ 人格否定や暴言は一切行いません。{'\n'}
            行動パターンへの建設的な指摘のみです。
          </Text>
        </View>

        {/* Spacing */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomButton}>
        <TouchableOpacity
          style={[styles.button, selectedAreas.length === 0 && styles.buttonDisabled]}
          onPress={handleNext}
          activeOpacity={0.8}
          disabled={selectedAreas.length === 0}
        >
          <Text style={styles.buttonText}>同意して次へ</Text>
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
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.day21Accent,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  previewLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.xs,
    color: colors.day21Accent,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  previewText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    lineHeight: fontSizes.md * 1.6,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  areaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  areaItemSelected: {
    borderColor: colors.day21Accent,
  },
  areaCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaCheckboxInner: {
    width: 14,
    height: 14,
    borderRadius: 2,
    backgroundColor: colors.day21Accent,
  },
  areaContent: {
    flex: 1,
  },
  areaLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  areaDescription: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  intensityContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  intensityOption: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  intensityOptionSelected: {
    borderColor: colors.day21Accent,
  },
  intensityLabel: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  intensityLabelSelected: {
    color: colors.day21Accent,
  },
  intensityDescription: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  noteContainer: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
  },
  noteText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: fontSizes.sm * 1.6,
    fontStyle: 'italic',
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
