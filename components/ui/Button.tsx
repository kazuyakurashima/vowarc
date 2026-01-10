import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, fontSizes } from '@/constants/theme';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'text';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  onPress,
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[`${size}Size`],
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.textStyle,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.surface : colors.accent}
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  text: {
    backgroundColor: 'transparent',
  },
  mediumSize: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  smallSize: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  largeSize: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
  },
  disabled: {
    opacity: 0.5,
  },
  textStyle: {
    fontFamily: 'NotoSansJP-Regular',
  },
  primaryText: {
    color: colors.surface,
    fontSize: fontSizes.base,
  },
  secondaryText: {
    color: colors.textPrimary,
    fontSize: fontSizes.base,
  },
  textText: {
    color: colors.accent,
    fontSize: fontSizes.base,
  },
  mediumText: {
    fontSize: fontSizes.base,
  },
  smallText: {
    fontSize: fontSizes.sm,
  },
  largeText: {
    fontSize: fontSizes.lg,
  },
  disabledText: {
    opacity: 0.7,
  },
});
