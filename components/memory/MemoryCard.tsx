import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Memory } from '@/lib/supabase/types';
import { colors, spacing, typography, fontSizes } from '@/constants/theme';

interface MemoryCardProps {
  memory: Memory;
}

export function MemoryCard({ memory }: MemoryCardProps) {
  const isMilestone = memory.memory_type === 'milestone';

  return (
    <View style={[styles.card, isMilestone && styles.milestone]}>
      <Text style={styles.content}>{memory.content}</Text>

      {memory.tags.length > 0 && (
        <View style={styles.tags}>
          {memory.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.date}>
        {new Date(memory.created_at).toLocaleDateString('ja-JP')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  milestone: {
    borderLeftWidth: 4,
    borderLeftColor: colors.day21Accent,
  },
  content: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  tag: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  tagText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  date: {
    fontFamily: typography.numeric.fontFamily,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
});
