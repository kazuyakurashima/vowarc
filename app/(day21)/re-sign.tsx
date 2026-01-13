/**
 * Day 21 Re-Sign Screen (Ticket 007)
 * Psychological contract re-signing ceremony
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography, fontSizes } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function Day21ReSignScreen() {
  const params = useLocalSearchParams<{
    updatedVow?: string;
    toughLoveAreas?: string;
    toughLoveIntensity?: string;
  }>();

  const [hasSigned, setHasSigned] = useState(false);
  const [signaturePath, setSignaturePath] = useState<{ x: number; y: number }[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();

    // Pulse animation for the signing area
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setSignaturePath([{ x: locationX, y: locationY }]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setSignaturePath(prev => [...prev, { x: locationX, y: locationY }]);
      },
      onPanResponderRelease: () => {
        if (signaturePath.length > 10) {
          setHasSigned(true);
          // Strong haptic feedback on signature completion
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      },
    })
  ).current;

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push({
      pathname: '/(day21)/choice',
      params: {
        updatedVow: params.updatedVow || '',
        toughLoveAreas: params.toughLoveAreas || '',
        toughLoveIntensity: params.toughLoveIntensity || 'standard',
        signed: 'true',
      },
    });
  };

  const clearSignature = () => {
    setSignaturePath([]);
    setHasSigned(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>心理的契約の再署名</Text>
        </View>

        {/* Contract Text */}
        <View style={styles.contractCard}>
          <Text style={styles.contractText}>
            「私はこの3ヶ月で、
          </Text>
          <Text style={styles.contractHighlight}>
            今の自分
          </Text>
          <Text style={styles.contractText}>
            を卒業し、
          </Text>
          <Text style={styles.contractHighlight}>
            理想の自分
          </Text>
          <Text style={styles.contractText}>
            になる」
          </Text>
        </View>

        {/* Signature Area */}
        <Animated.View
          style={[
            styles.signatureContainer,
            { transform: [{ scale: hasSigned ? 1 : pulseAnim }] },
          ]}
        >
          <View style={styles.signatureLabel}>
            <Text style={styles.signatureLabelText}>
              {hasSigned ? '署名完了' : '下の枠内に指で署名'}
            </Text>
          </View>
          <View
            style={[
              styles.signatureArea,
              hasSigned && styles.signatureAreaSigned,
            ]}
            {...panResponder.panHandlers}
          >
            {/* Simple signature visualization */}
            {signaturePath.length > 0 && (
              <View style={styles.signatureDisplay}>
                {signaturePath.map((point, index) => (
                  <View
                    key={index}
                    style={[
                      styles.signaturePoint,
                      {
                        left: point.x - 2,
                        top: point.y - 2,
                      },
                    ]}
                  />
                ))}
              </View>
            )}
            {!hasSigned && signaturePath.length === 0 && (
              <Text style={styles.signaturePlaceholder}>
                ここに署名
              </Text>
            )}
          </View>
          {hasSigned && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearSignature}
            >
              <Text style={styles.clearButtonText}>署名をやり直す</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Date */}
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </Animated.View>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomButton}>
        <TouchableOpacity
          style={[styles.button, !hasSigned && styles.buttonDisabled]}
          onPress={handleNext}
          activeOpacity={0.8}
          disabled={!hasSigned}
        >
          <Text style={styles.buttonText}>契約を更新する</Text>
        </TouchableOpacity>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl,
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'NotoSerifJP-Light',
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
  },
  contractCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.day21Accent,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  contractText: {
    fontFamily: 'NotoSerifJP-Light',
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: fontSizes.lg * 2.1,
  },
  contractHighlight: {
    fontFamily: 'NotoSerifJP-Light',
    fontSize: fontSizes.lg,
    color: colors.day21Accent,
    textAlign: 'center',
    fontWeight: '600',
  },
  signatureContainer: {
    marginBottom: spacing.lg,
  },
  signatureLabel: {
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  signatureLabelText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  signatureArea: {
    height: 120,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.textSecondary + '30',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  signatureAreaSigned: {
    borderColor: colors.day21Accent,
    borderStyle: 'solid',
  },
  signatureDisplay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  signaturePoint: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.day21Accent,
  },
  signaturePlaceholder: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  clearButton: {
    alignSelf: 'center',
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  clearButtonText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  dateText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bottomButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.textSecondary + '10',
  },
  button: {
    backgroundColor: colors.day21Accent,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
