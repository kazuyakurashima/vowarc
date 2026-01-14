/**
 * Theme Design Tokens - Central Export
 * Quiet Luxury Design System for VowArc
 */

export { colors, elevation } from './colors';
export { typography, fontSizes, fontWeights } from './typography';
export { spacing } from './spacing';
export { transitions } from './transitions';

// Re-export types
export type { ColorKey, ElevationLevel } from './colors';
export type { FontSize, FontWeight } from './typography';
export type { SpacingKey } from './spacing';
export type { TransitionKey } from './transitions';

/**
 * Complete theme object
 */
export const theme = {
  colors: require('./colors').colors,
  elevation: require('./colors').elevation,
  typography: require('./typography').typography,
  fontSizes: require('./typography').fontSizes,
  fontWeights: require('./typography').fontWeights,
  spacing: require('./spacing').spacing,
  transitions: require('./transitions').transitions,
} as const;
