/**
 * VowArk Design System v0.1 - Theme
 *
 * Consolidated theme file that exports all design tokens.
 * Based on Design DNA: Quiet Luxury, Tough Love, Integrity
 */

// Export all design tokens
export * from './colors';
export * from './typography';
export * from './spacing';
export * from './transitions';
export * from './elevation';
export * from './haptics';

/**
 * Legacy compatibility exports
 * TODO: Migrate existing components to use new design tokens
 */
import { Platform } from 'react-native';
import { colors } from './colors';

export const Colors = {
  light: {
    text: colors.textPrimary,
    background: colors.background,
    tint: colors.accent,
    icon: colors.textSecondary,
    tabIconDefault: colors.textSecondary,
    tabIconSelected: colors.accent,
  },
  dark: {
    // Note: VowArk v0.1 focuses on light mode only
    // Dark mode support is planned for future iterations
    text: '#ECEDEE',
    background: '#151718',
    tint: '#fff',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#fff',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
