/**
 * Color Palette - Quiet Luxury Design
 * Based on ticket 001 Design Tokens specification
 */

export const colors = {
  // Base (90%)
  background: '#F7F3F0', // Ecru - 3000K warm white
  surface: '#FAF8F5', // Pearl - surface color

  // Text
  textPrimary: '#2C2C2C', // Charcoal
  textSecondary: '#6B6B6B', // Slate

  // Accent (3%)
  accent: '#E07A5F', // Warm Coral - use sparingly

  // Special Accent (Day21 ritual only)
  day21Accent: '#C9A961', // Deep Gold - Day21 screen only

  // Semantic
  success: '#7A9E7E',
  warning: '#D4A574',
  error: '#C17B7B',
} as const;

/**
 * Elevation (明度差による奥行き表現、影は使用しない)
 */
export const elevation = {
  level0: colors.background,
  level1: colors.surface,
  level2: '#FDFCFA', // lighter surface
} as const;

export type ColorKey = keyof typeof colors;
export type ElevationLevel = keyof typeof elevation;
