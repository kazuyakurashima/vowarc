/**
 * VowArc Button Component
 *
 * Design System v0.1 compliant button with three variants:
 * - Primary: Accent background (Warm Coral or Deep Gold for Day21)
 * - Secondary: Transparent with border
 * - Ghost: Transparent with underline
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fontSizes } from '@/constants/typography';
import { triggerHaptic } from '@/constants/haptics';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isDay21?: boolean;  // Use Deep Gold accent for Day21 screens
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  isDay21 = false,
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const handlePress = async () => {
    if (disabled || loading) return;

    // Trigger haptic feedback
    await triggerHaptic(variant === 'primary' ? 'medium' : 'light');

    onPress();
  };

  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[`${size}Size`],
    isDay21 && variant === 'primary' && styles.day21Primary,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    isDay21 && variant === 'primary' && styles.day21Text,
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#FFFFFF' : colors.accent}
          size="small"
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Base styles
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },

  // Variants
  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: colors.textSecondary,
    borderRadius: 0,
    paddingHorizontal: 0,
  },

  // Day21 special styling
  day21Primary: {
    backgroundColor: colors.day21Accent,
  },

  // Sizes
  smallSize: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  mediumSize: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  largeSize: {
    paddingHorizontal: 40,
    paddingVertical: 20,
  },

  // Text styles
  text: {
    fontFamily: 'NotoSansJP-Medium',
    fontSize: fontSizes.base,
    textAlign: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: colors.textPrimary,
  },
  ghostText: {
    color: colors.textSecondary,
  },
  day21Text: {
    color: '#FFFFFF',
  },

  // Size-specific text
  smallText: {
    fontSize: fontSizes.sm,
  },
  mediumText: {
    fontSize: fontSizes.base,
  },
  largeText: {
    fontSize: fontSizes.lg,
  },

  // Disabled state
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
});
