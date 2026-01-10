/**
 * VowArk Design System v0.1 - Spacing Tokens
 *
 * Spacing Philosophy:
 * - Type-to-Space Ratio: 15:85 (generous whitespace)
 * - Paragraph gap: lineHeight × 1.5+
 * - Emphasize vertical rhythm and breathing room
 */

export const spacing = {
  // Base spacing scale
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,

  // Special spacing for typography
  paragraphGap: 24,  // Minimum gap between paragraphs (lineHeight × 1.5)
  sectionGap: 48,    // Gap between major sections
} as const;

export type SpacingToken = keyof typeof spacing;
