/**
 * Transition/Animation Design Tokens
 * Based on ticket 001 specification
 */

export const transitions = {
  // Standard screen transition
  standard: {
    duration: 300,
    easing: 'ease-in-out' as const,
  },

  // Ritual transition (Day21 etc.)
  ritual: {
    duration: 1800, // 1.8s
    easing: 'ease-in-out' as const,
  },

  // Fade in
  fadeIn: {
    duration: 600,
    easing: 'ease-out' as const,
  },
} as const;

export type TransitionKey = keyof typeof transitions;
