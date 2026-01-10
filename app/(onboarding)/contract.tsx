import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui';
import { colors, spacing, fontSizes, typography } from '@/constants/theme';

export default function ContractScreen() {
  const [agreed, setAgreed] = useState(false);

  const handleAgree = async () => {
    try {
      // TODO: Save contract acceptance to Supabase
      // TODO: Update user phase to 'trial'
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving contract:', error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>心理的契約</Text>

      <Text style={styles.subtitle}>
        VowArkは、あなたの3ヶ月の旅に伴走します
      </Text>

      <View style={styles.contractBox}>
        <Text style={styles.contractTitle}>VowArkがあなたに約束すること</Text>

        <View style={styles.contractItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.contractText}>
            あなたの努力・失敗・約束を記録し続ける証人（Witness）となります
          </Text>
        </View>

        <View style={styles.contractItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.contractText}>
            矛盾や言い訳を優しく、しかし確実に見逃しません
          </Text>
        </View>

        <View style={styles.contractItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.contractText}>
            失敗時は、承認→意味づけ→次の実験、の順で伴走します
          </Text>
        </View>

        <View style={styles.contractItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.contractText}>
            深い愛情の代替ではなく、証拠と一貫性で信頼を支えます
          </Text>
        </View>
      </View>

      <View style={styles.contractBox}>
        <Text style={styles.contractTitle}>あなたにお願いすること</Text>

        <View style={styles.contractItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.contractText}>
            毎日、音声または文字でチェックインしてください
          </Text>
        </View>

        <View style={styles.contractItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.contractText}>
            北極星（Meaning Statement）を毎日見返してください
          </Text>
        </View>

        <View style={styles.contractItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.contractText}>
            If-Then形式でコミットメントを設定してください
          </Text>
        </View>

        <View style={styles.contractItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.contractText}>
            正直であってください。嘘は、あなた自身への裏切りです
          </Text>
        </View>
      </View>

      <View style={styles.trialBox}>
        <Text style={styles.trialTitle}>21日間のトライアル</Text>
        <Text style={styles.trialText}>
          まずは21日間、無料でお試しください。{'\n'}
          継続する場合は、9週間一括で¥19,800です。
        </Text>
      </View>

      <Button
        title="約束します"
        onPress={handleAgree}
        style={styles.button}
      />

      <Button
        title="前の画面に戻る"
        variant="text"
        onPress={() => router.back()}
        style={styles.backButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  title: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.xxxl,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: fontSizes.xxxl * typography.heading.lineHeight,
  },
  subtitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: fontSizes.md * typography.body.lineHeight,
  },
  contractBox: {
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
  },
  contractTitle: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  contractItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  bullet: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  contractText: {
    flex: 1,
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    lineHeight: fontSizes.md * typography.body.lineHeight,
  },
  trialBox: {
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  trialTitle: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.lg,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  trialText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    lineHeight: fontSizes.sm * typography.body.lineHeight,
  },
  button: {
    marginTop: spacing.lg,
  },
  backButton: {
    marginTop: spacing.md,
  },
});
