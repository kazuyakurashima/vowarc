import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { MirrorFeedbackDisplay } from '@/components/checkin/MirrorFeedbackDisplay';
import { IfThenQuestion } from '@/components/checkin/IfThenQuestion';
import { useAuth } from '@/hooks/use-auth';
import { useHomeData } from '@/hooks/data/useHomeData';
import { supabase } from '@/lib/supabase';
import { MirrorFeedback } from '@/lib/supabase/types';
import { colors, spacing, typography, fontSizes } from '@/constants/theme';
import { getApiUrl } from '@/constants/config';

type Step = 'input' | 'feedback' | 'ifthen' | 'complete';

export default function TextCheckinScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { vow, meaningStatement } = useHomeData();

  const [step, setStep] = useState<Step>('input');
  const [checkinText, setCheckinText] = useState('');
  const [mirrorFeedback, setMirrorFeedback] = useState<MirrorFeedback | null>(null);
  const [ifThenTriggered, setIfThenTriggered] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateFeedback = async () => {
    if (!checkinText.trim()) {
      setError('チェックイン内容を入力してください');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call Mirror Feedback generation API
      const response = await fetch(getApiUrl('api/checkins/generate-mirror-feedback'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkinText: checkinText.trim(),
          vowContent: vow?.content,
          meaningContent: meaningStatement?.content,
        }),
      });

      if (!response.ok) {
        throw new Error('Mirror Feedbackの生成に失敗しました');
      }

      const data = await response.json();
      setMirrorFeedback(data.mirrorFeedback);
      setStep('feedback');
    } catch (err) {
      console.error('Failed to generate Mirror Feedback:', err);
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToIfThen = () => {
    setStep('ifthen');
  };

  const handleIfThenAnswer = async (triggered: boolean) => {
    setIfThenTriggered(triggered);
    await saveCheckin(triggered);
  };

  const saveCheckin = async (triggered: boolean) => {
    if (!user?.id) {
      Alert.alert('エラー', 'ユーザー情報が見つかりません');
      return;
    }

    try {
      setLoading(true);

      // Save checkin to database
      const { data: checkin, error: checkinError } = await supabase
        .from('checkins')
        .insert({
          user_id: user.id,
          date: new Date().toISOString().split('T')[0],
          type: 'morning',
          transcript: checkinText,
          mirror_feedback: mirrorFeedback,
          if_then_triggered: triggered,
        })
        .select()
        .single();

      if (checkinError) throw checkinError;

      // Extract memories asynchronously (non-blocking)
      extractMemories(checkin.id, checkinText);

      setStep('complete');

      // Navigate back to home after 1.5 seconds
      setTimeout(() => {
        router.push('/(tabs)');
      }, 1500);
    } catch (err) {
      console.error('Failed to save checkin:', err);
      Alert.alert('エラー', 'チェックインの保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const extractMemories = async (checkinId: string, transcript: string) => {
    try {
      const response = await fetch(getApiUrl('api/memories/extract'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkinId,
          transcript,
          userId: user?.id,
        }),
      });

      if (!response.ok) {
        console.warn('Memory extraction failed');
        return;
      }

      const data = await response.json();

      // Insert memories to database (client-side for RLS)
      if (data.memories && data.memories.length > 0) {
        await supabase.from('memories').insert(
          data.memories.map((mem: any) => ({
            ...mem,
            user_id: user?.id,
          }))
        );
      }
    } catch (err) {
      console.warn('Memory extraction error:', err);
      // Non-blocking: don't show error to user
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>テキストチェックイン</Text>

      {step === 'input' && (
        <View>
          <TextInput
            label="今日の振り返りを入力してください"
            value={checkinText}
            onChangeText={setCheckinText}
            multiline
            numberOfLines={8}
            placeholder="今日はどんな1日でしたか？誓いに向けてどのような行動をしましたか？"
            style={styles.textArea}
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
          <Button
            title="Mirror Feedbackを生成"
            onPress={handleGenerateFeedback}
            loading={loading}
            disabled={!checkinText.trim()}
          />
        </View>
      )}

      {step === 'feedback' && mirrorFeedback && (
        <View>
          <MirrorFeedbackDisplay feedback={mirrorFeedback} />
          <Button
            title="次へ"
            onPress={handleContinueToIfThen}
            style={styles.continueButton}
          />
        </View>
      )}

      {step === 'ifthen' && (
        <IfThenQuestion onAnswer={handleIfThenAnswer} />
      )}

      {step === 'complete' && (
        <View style={styles.completeContainer}>
          <Text style={styles.completeText}>チェックイン完了!</Text>
          <Text style={styles.completeSubtext}>
            メモリー抽出が進行中です...
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.xxl,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  textArea: {
    minHeight: 200,
    textAlignVertical: 'top',
  },
  errorText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.error,
    marginBottom: spacing.md,
  },
  continueButton: {
    marginTop: spacing.lg,
  },
  completeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  completeText: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.xl,
    color: colors.accent,
    marginBottom: spacing.sm,
  },
  completeSubtext: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
  },
});
