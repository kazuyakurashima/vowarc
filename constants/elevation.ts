/**
 * VowArk Design System v0.1 - Elevation Tokens
 *
 * Elevation Philosophy:
 * - NO drop shadows (anti-pattern for Quiet Luxury)
 * - Use brightness/lightness differences instead
 * - Subtle layering through color variation
 */

export const elevation = {
  level0: '#F7F3F0',  // Background - base level (Ecru)
  level1: '#FAF8F5',  // Surface - slightly lighter (Pearl)
  level2: '#FDFCFA',  // Elevated surface - more prominent
} as const;

export type ElevationLevel = keyof typeof elevation;

/**
 * Get elevation color by level
 */
export const getElevation = (level: ElevationLevel): string => {
  return elevation[level];
};
