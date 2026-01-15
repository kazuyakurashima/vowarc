/**
 * VowArc Design System v0.1 - Color Tokens
 *
 * Color Ratio Philosophy:
 * - 90%: background / surface (Ecru / Pearl)
 * - 7%: textPrimary / textSecondary (Charcoal / Slate)
 * - 3%: accent (Warm Coral / Deep Gold)
 *
 * Design DNA: Quiet Luxury, Low Saturation (<8%)
 */

export const colors = {
  // Base (90% usage)
  background: '#F7F3F0',  // Ecru - 3000K warm white
  surface: '#FAF8F5',     // Pearl - for cards and surfaces
  surfaceElevated: '#FFFFFF', // White - for elevated cards

  // Text (7% usage)
  textPrimary: '#2C2C2C',   // Charcoal - primary text
  textSecondary: '#6B6B6B', // Slate - secondary text

  // Accent (3% usage)
  accent: '#E07A5F',  // Warm Coral - use sparingly
  primary: '#E07A5F', // Alias for accent - primary action color

  // Day21 Special Accent (3% max - ritual use only)
  day21Accent: '#C9A961',  // Deep Gold - ONLY for Day21 screens

  // Semantic colors
  success: '#7A9E7E',   // Muted green
  warning: '#D4A574',   // Soft amber
  error: '#C17B7B',     // Muted red

  // UI colors
  border: '#E5E0DB',    // Subtle border color
} as const;

export type ColorToken = keyof typeof colors;
