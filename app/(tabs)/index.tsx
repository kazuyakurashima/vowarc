import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useHomeData } from '@/hooks/data/useHomeData';
import { Button } from '@/components/ui/Button';
import { colors, spacing, typography, fontSizes } from '@/constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { user, vow, meaningStatement, commitments, loading, error } = useHomeData();

  // Calculate day counter from trial_start_date
  const dayCounter = useMemo(() => {
    if (!user?.trial_start_date) return 0;
    const startDate = new Date(user.trial_start_date);
    const today = new Date();
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays + 1); // +1 to include start day
  }, [user?.trial_start_date]);

  // useCommitments already filters by today's date, so no need to filter again
  const todayCommitments = commitments || [];

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>エラーが発生しました</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Day Counter */}
      <View style={styles.dayCounterContainer}>
        <Text style={styles.dayCounterLabel}>Day</Text>
        <Text style={styles.dayCounterNumber}>{dayCounter}</Text>
      </View>

      {/* Meaning Statement */}
      {meaningStatement && (
        <View style={styles.meaningContainer}>
          <Text style={styles.meaningLabel}>あなたの意味</Text>
          <Text style={styles.meaningText}>{meaningStatement.content}</Text>
        </View>
      )}

      {/* Vow */}
      {vow && (
        <View style={styles.vowContainer}>
          <Text style={styles.vowLabel}>誓い</Text>
          <Text style={styles.vowText}>{vow.content}</Text>
        </View>
      )}

      {/* Today's Commitments */}
      <View style={styles.commitmentsContainer}>
        <Text style={styles.commitmentsLabel}>今日のコミットメント</Text>
        {todayCommitments.length === 0 ? (
          <Text style={styles.noCommitmentsText}>
            今日のコミットメントはありません
          </Text>
        ) : (
          todayCommitments.map((commitment) => (
            <View key={commitment.id} style={styles.commitmentCard}>
              <Text style={styles.commitmentText}>{commitment.content}</Text>
              <View style={[
                styles.commitmentStatus,
                commitment.status === 'completed' && styles.commitmentCompleted,
                commitment.status === 'failed' && styles.commitmentFailed,
              ]}>
                <Text style={styles.commitmentStatusText}>
                  {commitment.status === 'completed' ? '完了' :
                   commitment.status === 'failed' ? '未完了' : '進行中'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Checkin Buttons */}
      <View style={styles.checkinButtonsContainer}>
        <Text style={styles.checkinLabel}>今日のチェックイン</Text>
        <Button
          title="テキストでチェックイン"
          onPress={() => router.push('/(tabs)/checkin-text')}
          variant="primary"
          style={styles.checkinButton}
        />
        <Button
          title="音声でチェックイン"
          onPress={() => {
            // Placeholder for voice checkin (Ticket 004)
            alert('音声チェックインは準備中です');
          }}
          variant="secondary"
          style={styles.checkinButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
  },
  errorText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.base,
    color: colors.error,
  },
  dayCounterContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.lg,
  },
  dayCounterLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  dayCounterNumber: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.xxxl,
    color: colors.accent,
  },
  meaningContainer: {
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  meaningLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  meaningText: {
    fontFamily: 'NotoSerifJP-Light', // Noto Serif JP Light for Meaning Statement
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    lineHeight: fontSizes.lg * 1.6,
  },
  vowContainer: {
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  vowLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  vowText: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    lineHeight: fontSizes.lg * 1.4,
  },
  commitmentsContainer: {
    marginBottom: spacing.xl,
  },
  commitmentsLabel: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  noCommitmentsText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  commitmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  commitmentText: {
    flex: 1,
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  commitmentStatus: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    backgroundColor: colors.textSecondary,
  },
  commitmentCompleted: {
    backgroundColor: colors.accent,
  },
  commitmentFailed: {
    backgroundColor: colors.error,
  },
  commitmentStatusText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.xs,
    color: colors.surface,
  },
  checkinButtonsContainer: {
    marginTop: spacing.lg,
  },
  checkinLabel: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  checkinButton: {
    marginBottom: spacing.md,
  },
});
