/**
 * Exit Ritual Summary Screen (Ticket 012)
 * Shows user's journey summary before leaving
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography, fontSizes } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { getApiUrl } from '@/constants/config';
import * as Haptics from 'expo-haptics';

interface ExitSummary {
  day_count: number;
  checkin_count: number;
  evidence_count: number;
  potential_statement: string;
  meaning_statement: string | null;
  vow_content: string | null;
}

export default function ExitSummaryScreen() {
  const params = useLocalSearchParams<{
    trigger?: string;
  }>();

  const [summary, setSummary] = useState<ExitSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('認証エラー');
        return;
      }

      const response = await fetch(
        getApiUrl('functions/v1/exit-ritual-summary'),
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch summary');
      }

      const data = await response.json();
      setSummary(data);
    } catch (err) {
      console.error('Fetch summary error:', err);
      // Use fallback data if API fails
      setSummary({
        day_count: 21,
        checkin_count: 0,
        evidence_count: 0,
        potential_statement: 'この一歩を踏み出したこと自体が、変化への意志の証です。',
        meaning_statement: null,
        vow_content: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    router.push({
      pathname: '/(day21)/exit-review',
      params: {
        trigger: params.trigger || 'day21_stop',
        day_count: summary?.day_count?.toString() || '0',
        checkin_count: summary?.checkin_count?.toString() || '0',
        evidence_count: summary?.evidence_count?.toString() || '0',
        potential_statement: summary?.potential_statement || '',
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.textSecondary} size="large" />
        <Text style={styles.loadingText}>振り返りを準備しています...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>ここまでの旅を振り返る</Text>
      </View>

      {/* Stats Card */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>あなたの歩み</Text>

        <View style={styles.statRow}>
          <Text style={styles.statIcon}>📅</Text>
          <Text style={styles.statLabel}>参加期間</Text>
          <Text style={styles.statValue}>{summary?.day_count || 0}日間</Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statIcon}>💬</Text>
          <Text style={styles.statLabel}>チェックイン</Text>
          <Text style={styles.statValue}>{summary?.checkin_count || 0}回</Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statIcon}>📸</Text>
          <Text style={styles.statLabel}>Evidence</Text>
          <Text style={styles.statValue}>{summary?.evidence_count || 0}件</Text>
        </View>
      </View>

      {/* Potential Statement */}
      <View style={styles.potentialCard}>
        <View style={styles.potentialHeader}>
          <Text style={styles.potentialIcon}>🔮</Text>
          <Text style={styles.potentialTitle}>AIが見ていた可能性</Text>
        </View>
        <Text style={styles.potentialText}>
          "{summary?.potential_statement}"
        </Text>
      </View>

      {/* Message */}
      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>
          この経験は無駄ではありません。{'\n'}
          自分と向き合った時間は、{'\n'}
          必ず次への糧になります。
        </Text>
      </View>

      {/* CTA Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleNext}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>次へ</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    alignItems: 'center',
  },
  title: {
    fontFamily: 'NotoSerifJP-Light',
    fontSize: fontSizes.xxl,
    color: colors.textPrimary,
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  statsTitle: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.textSecondary + '15',
  },
  statIcon: {
    fontSize: fontSizes.md,
    marginRight: spacing.md,
  },
  statLabel: {
    flex: 1,
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  statValue: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  potentialCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderLeftWidth: 3,
    borderLeftColor: colors.day21Accent,
  },
  potentialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  potentialIcon: {
    fontSize: fontSizes.lg,
    marginRight: spacing.sm,
  },
  potentialTitle: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  potentialText: {
    fontFamily: 'NotoSerifJP-Light',
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    lineHeight: fontSizes.md * 1.8,
    fontStyle: 'italic',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  messageText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fontSizes.md * 1.6,
  },
  button: {
    backgroundColor: colors.textSecondary,
    borderRadius: 12,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.md,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
