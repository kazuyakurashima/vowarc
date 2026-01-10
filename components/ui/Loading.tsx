import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSizes, typography } from '@/constants/theme';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'large';
}

export function Loading({ message, size = 'large' }: LoadingProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={colors.accent} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  message: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
});
