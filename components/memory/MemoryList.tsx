import React from 'react';
import { FlatList, Text, StyleSheet, View } from 'react-native';
import { Memory } from '@/lib/supabase/types';
import { MemoryCard } from './MemoryCard';
import { colors, spacing, typography, fontSizes } from '@/constants/theme';

interface MemoryListProps {
  memories: Memory[];
  loading?: boolean;
}

export function MemoryList({ memories, loading }: MemoryListProps) {
  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Loading memories...</Text>
      </View>
    );
  }

  if (memories.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No memories yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={memories}
      renderItem={({ item }) => <MemoryCard memory={item} />}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.lg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
});
