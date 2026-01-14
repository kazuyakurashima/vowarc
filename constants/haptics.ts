/**
 * VowArc Design System v0.1 - Haptics Tokens
 *
 * Haptic Philosophy:
 * - Light: Regular taps, navigation
 * - Medium: Button presses, confirmations
 * - Heavy (vowImpact): Vow signing, major milestones
 * - Reflection pulse: 60bpm rhythm (1000ms) for introspection
 */

import * as Haptics from 'expo-haptics';

export const haptics = {
  // Basic impact levels
  light: 'impactLight' as const,
  medium: 'impactMedium' as const,
  vowImpact: 'impactHeavy' as const,

  // Special patterns
  reflectionPulse: {
    type: 'impactLight' as const,
    interval: 1000,  // 60bpm - heart rate for calm reflection
  },

  // Completion breath pattern (for TICKET-VOICE-007)
  completionBreath: {
    inhale: 1500,   // 1.5s inhale
    exhale: 2000,   // 2s exhale
  },
} as const;

/**
 * Trigger haptic feedback based on type
 */
export const triggerHaptic = async (type: keyof typeof haptics) => {
  try {
    switch (type) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'vowImpact':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      default:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch (error) {
    // Haptics may not be available on all devices
    console.warn('Haptic feedback not available:', error);
  }
};

/**
 * Trigger reflection pulse pattern (60bpm)
 */
export const triggerReflectionPulse = async (duration: number = 5000) => {
  const pulses = Math.floor(duration / haptics.reflectionPulse.interval);

  for (let i = 0; i < pulses; i++) {
    await triggerHaptic('light');
    await new Promise(resolve => setTimeout(resolve, haptics.reflectionPulse.interval));
  }
};
