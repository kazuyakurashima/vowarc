/**
 * Spacing Design Tokens
 * Type-to-Space Ratio: 15:85を意識
 * Based on ticket 001 specification
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,

  // Paragraph gap
  paragraphGap: 24, // lineHeightの1.5倍以上
} as const;

export type SpacingKey = keyof typeof spacing;
