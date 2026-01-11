/**
 * Typography Design Tokens
 * Based on ticket 001 specification
 */

export const typography = {
  // Heading: Noto Serif JP Light
  heading: {
    fontFamily: 'NotoSerifJP-Light',
    lineHeight: 2.0, // Japanese "ma" (spacing)
  },

  // Body: Noto Sans JP Regular
  body: {
    fontFamily: 'NotoSansJP-Regular',
    lineHeight: 1.9,
  },

  // Numeric/English: Inter
  numeric: {
    fontFamily: 'Inter',
    lineHeight: 1.5,
  },
} as const;

/**
 * Font sizes
 */
export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  base: 16, // Alias for md, for backward compatibility
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  '2xl': 24, // Alias for xxl
  '3xl': 30,
} as const;

/**
 * Font weights
 */
export const fontWeights = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export type FontSize = keyof typeof fontSizes;
export type FontWeight = keyof typeof fontWeights;
