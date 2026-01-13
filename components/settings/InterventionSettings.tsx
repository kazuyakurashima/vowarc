/**
 * Intervention Settings Component (Ticket 005)
 * Allows users to configure AI Coach intervention areas
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, spacing, typography, fontSizes } from '@/constants/theme';
import { useInterventionSettings } from '@/hooks/data/useInterventionSettings';
import { INTERVENTION_AREAS, InterventionAreaKey } from '@/lib/openai/coach';

interface InterventionSettingsProps {
  userId: string;
}

export function InterventionSettings({ userId }: InterventionSettingsProps) {
  const {
    settings,
    loading,
    saving,
    error,
    toggleInterveneArea,
    toggleNoTouchArea,
    availableAreas,
  } = useInterventionSettings(userId);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  const areaKeys = Object.keys(availableAreas) as InterventionAreaKey[];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>介入設定</Text>
      <Text style={styles.subtitle}>
        AIコーチが積極的に指摘する領域と、触れない領域を設定できます
      </Text>

      {/* Transparency Notice */}
      <View style={styles.noticeBox}>
        <Text style={styles.noticeText}>
          AIは参照しませんが、記録は残ります。{'\n'}
          法的要請時には開示される可能性があります。{'\n'}
          安全上の理由（自傷示唆等）がある場合は例外的に介入します。
        </Text>
      </View>

      {/* Intervene Areas Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>突っ込む領域</Text>
        <Text style={styles.sectionDescription}>
          選択した領域では、AIが矛盾や逃げを指摘します
        </Text>
        <View style={styles.chipsContainer}>
          {areaKeys.map((key) => {
            const isSelected = settings.interveneAreas.includes(key);
            const isDisabled = settings.noTouchAreas.includes(key);
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.chip,
                  isSelected && styles.chipSelected,
                  isDisabled && styles.chipDisabled,
                ]}
                onPress={() => toggleInterveneArea(key)}
                disabled={saving || isDisabled}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected && styles.chipTextSelected,
                    isDisabled && styles.chipTextDisabled,
                  ]}
                >
                  {availableAreas[key]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* No-Touch Areas Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>触れない領域</Text>
        <Text style={styles.sectionDescription}>
          選択した領域では、AIは矛盾検出を行いません
        </Text>
        <View style={styles.chipsContainer}>
          {areaKeys.map((key) => {
            const isSelected = settings.noTouchAreas.includes(key);
            const isDisabled = settings.interveneAreas.includes(key);
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.chip,
                  isSelected && styles.chipNoTouch,
                  isDisabled && styles.chipDisabled,
                ]}
                onPress={() => toggleNoTouchArea(key)}
                disabled={saving || isDisabled}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected && styles.chipTextNoTouch,
                    isDisabled && styles.chipTextDisabled,
                  ]}
                >
                  {availableAreas[key]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>
            設定の保存に失敗しました: {error.message}
          </Text>
        </View>
      )}

      {/* Saving Indicator */}
      {saving && (
        <View style={styles.savingIndicator}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={styles.savingText}>保存中...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  title: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: fontSizes.sm * typography.body.lineHeight,
  },
  noticeBox: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderLeftWidth: 3,
    borderLeftColor: colors.textSecondary,
  },
  noticeText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: fontSizes.xs * typography.body.lineHeight,
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
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.textSecondary + '30',
  },
  chipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipNoTouch: {
    backgroundColor: colors.error + '20',
    borderColor: colors.error,
  },
  chipDisabled: {
    opacity: 0.4,
  },
  chipText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  chipTextNoTouch: {
    color: colors.error,
    fontWeight: '600',
  },
  chipTextDisabled: {
    color: colors.textSecondary,
  },
  errorBox: {
    backgroundColor: colors.error + '15',
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  errorText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.error,
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  savingText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
});
