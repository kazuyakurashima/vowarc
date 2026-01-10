/**
 * VowArk Design System v0.1 - Typography Tokens
 *
 * Font Philosophy:
 * - Headings: Noto Serif JP Light (with generous line-height for Japanese "ma" - space/pause)
 * - Body: Noto Sans JP Regular (readable for long-form content)
 * - Numeric: Inter (for numbers, dates, and English text)
 */

export const typography = {
  // Heading font - Noto Serif JP Light
  heading: {
    fontFamily: 'NotoSerifJP-Light',
    lineHeight: 2.0,  // Japanese "ma" (pause/space) principle
    letterSpacing: 0.02,  // Slight spacing for headings
  },
  // Body font - Noto Sans JP Regular
  body: {
    fontFamily: 'NotoSansJP-Regular',
    lineHeight: 1.9,  // Generous line-height for readability
    letterSpacing: 0,
  },
  // Numeric font - Inter
  numeric: {
    fontFamily: 'Inter',
    lineHeight: 1.5,
    letterSpacing: 0,
  },
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;

export const fontWeights = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export type TypographyVariant = keyof typeof typography;
export type FontSize = keyof typeof fontSizes;
export type FontWeight = keyof typeof fontWeights;
