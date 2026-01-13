import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Button, TextInput } from '@/components/ui';
import { colors, spacing, fontSizes, typography } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { VoiceInput } from '@/components/onboarding/VoiceInput';

export default function WhyScreen() {
  const { answers, setAnswer, setInputType } = useOnboardingStore();
  const [localAnswer, setLocalAnswer] = useState(answers.why);

  const handleNext = async () => {
    try {
      setAnswer('why', localAnswer);
      router.push('/(onboarding)/pain');
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.question}>
        なぜ、今、{'\n'}変わろうと思ったのですか？
      </Text>

      <Text style={styles.hint}>
        あなた自身の言葉で、率直に答えてください
      </Text>

      <View style={styles.inputRow}>
        <View style={styles.textInputWrapper}>
          <TextInput
            value={localAnswer}
            onChangeText={setLocalAnswer}
            multiline
            numberOfLines={6}
            placeholder="ここに入力してください..."
            style={styles.input}
            containerStyle={styles.inputContainer}
          />
        </View>
        <VoiceInput
          onTranscriptionComplete={(text) => {
            setLocalAnswer(text);
          }}
          onVoiceInputUsed={() => {
            setInputType('why', 'voice');
          }}
        />
      </View>

      <Button
        title="次へ"
        onPress={handleNext}
        disabled={!localAnswer.trim()}
        style={styles.button}
      />

      <Button
        title="戻る"
        variant="text"
        onPress={() => router.back()}
        style={styles.backButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  question: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.xxl,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: fontSizes.xxl * typography.heading.lineHeight,
  },
  hint: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    width: '100%',
    marginBottom: spacing.xl,
  },
  textInputWrapper: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 0,
  },
  input: {
    height: 150,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  button: {
    marginTop: spacing.lg,
  },
  backButton: {
    marginTop: spacing.md,
  },
});
