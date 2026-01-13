/**
 * Day 21 Intro Screen (Ticket 007)
 * Quiet introduction - acknowledges that the user has reached Day 21
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography, fontSizes } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

export default function Day21IntroScreen() {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [textFadeAnim] = useState(new Animated.Value(0));
  const [buttonFadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Start with reflection pulse haptics
    const pulseInterval = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 1000); // 60bpm pulse

    // Sequence animations for progressive disclosure
    Animated.sequence([
      // Day counter fades in first
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
      // Main text fades in
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
      // Button fades in last
      Animated.timing(buttonFadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start();

    // Stop pulse after animations complete
    setTimeout(() => clearInterval(pulseInterval), 6000);

    return () => clearInterval(pulseInterval);
  }, []);

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(day21)/report');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Day Counter */}
        <Animated.View style={[styles.dayContainer, { opacity: fadeAnim }]}>
          <Text style={styles.dayLabel}>Day</Text>
          <Text style={styles.dayNumber}>21</Text>
        </Animated.View>

        {/* Main Message */}
        <Animated.View style={[styles.messageContainer, { opacity: textFadeAnim }]}>
          <Text style={styles.messageTitle}>ここまで来ました</Text>
          <Text style={styles.messageBody}>
            21日間、あなたは自分と向き合い続けました。{'\n'}
            その事実は、誰にも否定できません。
          </Text>
        </Animated.View>

        {/* Continue Button */}
        <Animated.View style={[styles.buttonContainer, { opacity: buttonFadeAnim }]}>
          <TouchableOpacity style={styles.button} onPress={handleNext} activeOpacity={0.8}>
            <Text style={styles.buttonText}>振り返る</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  dayContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  dayLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  dayNumber: {
    fontFamily: 'NotoSerifJP-Light',
    fontSize: 72,
    color: colors.day21Accent, // Deep Gold for Day 21
    letterSpacing: 4,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  messageTitle: {
    fontFamily: 'NotoSerifJP-Light',
    fontSize: fontSizes.xxl,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  messageBody: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fontSizes.md * 2.0, // Japanese "Ma" spacing
  },
  buttonContainer: {
    position: 'absolute',
    bottom: spacing.xxxl,
    left: spacing.xl,
    right: spacing.xl,
  },
  button: {
    backgroundColor: colors.day21Accent,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
