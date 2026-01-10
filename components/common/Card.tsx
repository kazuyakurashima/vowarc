/**
 * VowArk Card Component
 *
 * Design System v0.1 compliant card with two variants:
 * - Standard: Surface background with subtle border
 * - Highlight: Day21 special with Deep Gold border
 */

import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { elevation } from '@/constants/elevation';

type CardVariant = 'standard' | 'highlight';

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
}

export function Card({ children, variant = 'standard', style }: CardProps) {
  const cardStyles = [
    styles.base,
    variant === 'highlight' && styles.highlight,
    style,
  ];

  return <View style={cardStyles}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: elevation.level1,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },
  highlight: {
    borderWidth: 2,
    borderColor: colors.day21Accent,
  },
});
