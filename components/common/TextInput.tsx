/**
 * VowArc TextInput Component
 *
 * Design System v0.1 compliant text input with:
 * - Standard single-line input
 * - Multiline text area support
 * - Focus state with accent border
 */

import React, { useState } from 'react';
import {
  TextInput as RNTextInput,
  StyleSheet,
  View,
  Text,
  ViewStyle,
  TextStyle,
  TextInputProps as RNTextInputProps,
} from 'react-native';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fontSizes } from '@/constants/typography';
import { elevation } from '@/constants/elevation';

interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  label?: string;
  error?: string;
  multiline?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export function TextInput({
  label,
  error,
  multiline = false,
  containerStyle,
  inputStyle,
  ...props
}: TextInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <RNTextInput
        style={[
          styles.input,
          multiline && styles.multiline,
          isFocused && styles.focused,
          error && styles.error,
          inputStyle,
        ]}
        placeholderTextColor={colors.textSecondary}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: 'NotoSansJP-Medium',
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: elevation.level1,
    borderWidth: 1,
    borderColor: colors.textSecondary,
    borderRadius: 8,
    padding: spacing.md,
    fontFamily: 'NotoSansJP-Regular',
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    lineHeight: 24, // 1.5 × 16px base font
  },
  multiline: {
    minHeight: 120,
    paddingTop: spacing.md,
    lineHeight: 30.4, // 1.9 × 16px for Japanese text
  },
  focused: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  error: {
    borderColor: colors.error,
  },
  errorText: {
    fontFamily: 'NotoSansJP-Regular',
    fontSize: fontSizes.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
