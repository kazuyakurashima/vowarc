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
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
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
