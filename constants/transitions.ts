/**
 * VowArc Design System v0.1 - Transition Tokens
 *
 * Transition Philosophy:
 * - Standard: Quick, responsive interactions
 * - Ritual: Slow, deliberate for Day0/Day21 ceremonies
 * - FadeIn: Gentle reveals
 * - Stagger: Sequential card appearances
 */

export const transitions = {
  // Standard screen transitions (300ms)
  standard: {
    duration: 300,
    easing: 'ease-in-out' as const,
  },

  // Fade in animations (600ms)
  fadeIn: {
    duration: 600,
    easing: 'ease-out' as const,
  },

  // Stagger animations for card sequences (400ms + 100ms delay)
  stagger: {
    duration: 400,
    delay: 100,
    easing: 'ease-out' as const,
  },

  // Ritual transitions for Day0/Day21 (1800ms - slow, deliberate)
  ritual: {
    duration: 1800,
    easing: 'ease-in-out' as const,
  },
} as const;

export type TransitionType = keyof typeof transitions;

/**
 * Helper function to get transition duration in milliseconds
 */
export const getTransitionDuration = (type: TransitionType): number => {
  return transitions[type].duration;
};

/**
 * Helper function to get CSS transition string
 */
export const getTransitionCSS = (
  type: TransitionType,
  property: string = 'all'
): string => {
  const t = transitions[type];
  return `${property} ${t.duration}ms ${t.easing}`;
};
