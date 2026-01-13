/**
 * Orb Component (Ticket 004)
 * AI visualization as sphere/waveform during voice interaction
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors } from '@/constants/theme';

type OrbState = 'waiting' | 'recording' | 'processing';

interface OrbProps {
  state: OrbState;
  metering?: number; // 0-1, for recording state
  size?: number;
}

export function Orb({ state, metering = 0, size = 200 }: OrbProps) {
  // Animation values
  const breathingScale = useRef(new Animated.Value(1)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const rotationValue = useRef(new Animated.Value(0)).current;
  const waveOpacity = useRef(new Animated.Value(0.3)).current;

  // Waiting state: Slow breathing animation
  useEffect(() => {
    if (state === 'waiting') {
      const breathing = Animated.loop(
        Animated.sequence([
          Animated.timing(breathingScale, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(breathingScale, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      breathing.start();
      return () => breathing.stop();
    }
  }, [state, breathingScale]);

  // Recording state: Pulse with metering
  useEffect(() => {
    if (state === 'recording') {
      const targetScale = 1 + metering * 0.3; // Max 30% size increase
      Animated.spring(pulseScale, {
        toValue: targetScale,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [state, metering, pulseScale]);

  // Processing state: Rotating waveform
  useEffect(() => {
    if (state === 'processing') {
      const rotation = Animated.loop(
        Animated.timing(rotationValue, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      );

      const wave = Animated.loop(
        Animated.sequence([
          Animated.timing(waveOpacity, {
            toValue: 0.8,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(waveOpacity, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );

      rotation.start();
      wave.start();

      return () => {
        rotation.stop();
        wave.stop();
      };
    }
  }, [state, rotationValue, waveOpacity]);

  // Calculate transform based on state
  const getTransform = () => {
    if (state === 'waiting') {
      return [{ scale: breathingScale }];
    }
    if (state === 'recording') {
      return [{ scale: pulseScale }];
    }
    if (state === 'processing') {
      const spin = rotationValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      });
      return [{ rotate: spin }];
    }
    return [];
  };

  // Orb color variations based on state
  const getOrbColor = () => {
    switch (state) {
      case 'waiting':
        return 'rgba(247, 243, 240, 0.6)'; // Ecru with transparency
      case 'recording':
        return 'rgba(247, 243, 240, 0.9)'; // More opaque when recording
      case 'processing':
        return 'rgba(247, 243, 240, 0.7)';
      default:
        return 'rgba(247, 243, 240, 0.6)';
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Main Orb */}
      <Animated.View
        style={[
          styles.orb,
          {
            width: size * 0.7,
            height: size * 0.7,
            borderRadius: (size * 0.7) / 2,
            backgroundColor: getOrbColor(),
            transform: getTransform(),
          },
        ]}
      />

      {/* Outer glow ring for recording state */}
      {state === 'recording' && (
        <Animated.View
          style={[
            styles.glowRing,
            {
              width: size * 0.9,
              height: size * 0.9,
              borderRadius: (size * 0.9) / 2,
              opacity: metering * 0.5,
            },
          ]}
        />
      )}

      {/* Waveform rings for processing state */}
      {state === 'processing' && (
        <>
          <Animated.View
            style={[
              styles.waveRing,
              {
                width: size * 0.85,
                height: size * 0.85,
                borderRadius: (size * 0.85) / 2,
                opacity: waveOpacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.waveRing,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                opacity: waveOpacity.interpolate({
                  inputRange: [0.3, 0.8],
                  outputRange: [0.15, 0.4],
                }),
              },
            ]}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  orb: {
    position: 'absolute',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  glowRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(247, 243, 240, 0.8)',
  },
  waveRing: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(247, 243, 240, 0.6)',
  },
});
