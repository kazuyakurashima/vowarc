/**
 * Voice Checkin Screen (Ticket 004)
 * Fullscreen voice interaction with AI Orb
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { uploadAudioFile } from '@/lib/supabase/audio-storage';
import { Orb } from '@/components/checkin/Orb';
import { IfThenQuestion } from '@/components/checkin/IfThenQuestion';
import { Button } from '@/components/ui/Button';
import { colors, spacing, typography, fontSizes } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { buildApiUrl } from '@/lib/api-config';

type FlowStep =
  | 'idle'
  | 'recording'
  | 'transcribing'
  | 'review'
  | 'if-then'
  | 'saving';

export default function VoiceCheckinScreen() {
  const { user } = useAuth();
  const { recording, startRecording, stopRecording, cancelRecording, metering } =
    useAudioRecording();

  const [flowStep, setFlowStep] = useState<FlowStep>('idle');
  const [transcription, setTranscription] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Format duration as MM:SS
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    await startRecording();
    setFlowStep('recording');
  };

  const handleStopRecording = async () => {
    const uri = await stopRecording();
    if (!uri) {
      Alert.alert('エラー', '録音の保存に失敗しました。');
      setFlowStep('idle');
      return;
    }

    setFlowStep('transcribing');

    try {
      if (!user) {
        console.error('[Voice Checkin] User not authenticated');
        throw new Error('User not authenticated');
      }

      // Get auth token
      console.log('[Voice Checkin] Getting auth token...');
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        console.error('[Voice Checkin] No auth token available');
        throw new Error('認証トークンが取得できません。再度ログインしてください。');
      }

      // Upload audio to Supabase Storage
      console.log('[Voice Checkin] Uploading audio file...');
      const url = await uploadAudioFile(user.id, uri);
      console.log('[Voice Checkin] Audio uploaded:', url);
      setAudioUrl(url);

      // Call Whisper API for transcription
      const apiUrl = buildApiUrl('/api/audio/transcribe');
      console.log('[Voice Checkin] Calling transcription API:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ audioUrl: url }),
      });

      console.log('[Voice Checkin] Transcription API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Voice Checkin] Transcription API error:', errorData);

        // Provide specific error messages based on status
        if (response.status === 401) {
          throw new Error('認証エラー: 再度ログインしてください。');
        } else if (response.status === 403) {
          throw new Error('アクセス権限がありません。');
        } else if (response.status === 400) {
          throw new Error(errorData.error || '音声ファイルの処理に失敗しました。');
        } else {
          throw new Error(errorData.error || `サーバーエラー (${response.status})`);
        }
      }

      const data = await response.json();
      console.log('[Voice Checkin] Transcription successful');
      setTranscription(data.text);
      setFlowStep('review');
    } catch (error) {
      console.error('[Voice Checkin] Error in handleStopRecording:', error);

      let errorMessage = '音声の文字起こしに失敗しました。';

      if (error instanceof Error) {
        // Network errors
        if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
          errorMessage = 'ネットワークエラー: サーバーに接続できません。\nEXPO_PUBLIC_API_URLを確認してください。';
        } else if (error.message.includes('認証') || error.message.includes('ログイン')) {
          errorMessage = error.message;
        } else {
          errorMessage = `エラー: ${error.message}`;
        }
      }

      Alert.alert('エラー', errorMessage);
      setFlowStep('idle');
    }
  };

  const handleCancelRecording = async () => {
    await cancelRecording();
    setFlowStep('idle');
  };

  const handleReviewConfirm = () => {
    setFlowStep('if-then');
  };

  const handleReviewRetry = () => {
    setTranscription('');
    setAudioUrl(null);
    setFlowStep('idle');
  };

  const handleIfThenAnswer = async (triggered: boolean | null) => {
    setFlowStep('saving');

    try {
      if (!user) throw new Error('User not authenticated');

      // Get auth token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error('No authentication token available');
      }

      // Call checkin save API
      const response = await fetch(buildApiUrl('/api/checkins/save'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: transcription,
          audioUrl,
          ifThenTriggered: triggered,
          type: 'voice',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Save failed');
      }

      Alert.alert('完了', 'チェックインを保存しました。', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('エラー', 'チェックインの保存に失敗しました。');
      setFlowStep('if-then');
    }
  };

  // Determine Orb state
  const getOrbState = (): 'waiting' | 'recording' | 'processing' => {
    if (flowStep === 'recording') return 'recording';
    if (flowStep === 'transcribing') return 'processing';
    return 'waiting';
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Orb Visualization */}
        <View style={styles.orbContainer}>
          <Orb state={getOrbState()} metering={metering} size={250} />

          {/* Recording duration */}
          {flowStep === 'recording' && (
            <Text style={styles.duration}>
              {formatDuration(recording.duration)}
            </Text>
          )}
        </View>

        {/* Idle State */}
        {flowStep === 'idle' && (
          <View style={styles.contentContainer}>
            <Text style={styles.title}>音声チェックイン</Text>
            <Text style={styles.instruction}>
              今日の取り組みや気づきを{'\n'}
              AIに話してください
            </Text>

            <TouchableOpacity
              style={styles.recordButton}
              onPress={handleStartRecording}
              activeOpacity={0.8}
            >
              <Text style={styles.recordButtonText}>タップして録音開始</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recording State */}
        {flowStep === 'recording' && (
          <View style={styles.contentContainer}>
            <Text style={styles.title}>録音中...</Text>
            <Text style={styles.instruction}>
              話し終わったら停止ボタンを{'\n'}
              押してください
            </Text>

            <View style={styles.buttonRow}>
              <Button
                title="キャンセル"
                onPress={handleCancelRecording}
                variant="secondary"
                style={styles.actionButton}
              />
              <Button
                title="停止"
                onPress={handleStopRecording}
                variant="primary"
                style={styles.actionButton}
              />
            </View>
          </View>
        )}

        {/* Transcribing State */}
        {flowStep === 'transcribing' && (
          <View style={styles.contentContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.title}>文字起こし中...</Text>
            <Text style={styles.instruction}>
              AIが音声を解析しています
            </Text>
          </View>
        )}

        {/* Review State */}
        {flowStep === 'review' && (
          <View style={styles.contentContainer}>
            <Text style={styles.title}>内容の確認・編集</Text>
            <Text style={styles.editHint}>
              必要に応じて内容を編集できます
            </Text>

            <TextInput
              value={transcription}
              onChangeText={setTranscription}
              multiline
              style={styles.transcriptionInput}
              placeholder="書き起こし内容を確認・編集してください"
              placeholderTextColor={colors.textSecondary}
            />

            <View style={styles.buttonRow}>
              <Button
                title="やり直す"
                onPress={handleReviewRetry}
                variant="secondary"
                style={styles.actionButton}
              />
              <Button
                title="確定"
                onPress={handleReviewConfirm}
                variant="primary"
                style={styles.actionButton}
              />
            </View>
          </View>
        )}

        {/* If-Then Question State */}
        {flowStep === 'if-then' && (
          <View style={styles.contentContainer}>
            <IfThenQuestion onAnswer={handleIfThenAnswer} />
          </View>
        )}

        {/* Saving State */}
        {flowStep === 'saving' && (
          <View style={styles.contentContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.title}>保存中...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
  },
  orbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xxl,
    minHeight: 280,
  },
  duration: {
    fontFamily: typography.mono?.fontFamily || typography.body.fontFamily,
    fontSize: fontSizes.xxl,
    fontWeight: '500',
    color: colors.accent,
    marginTop: spacing.xl,
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  title: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.xxl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  instruction: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fontSizes.base * 1.7,
    marginBottom: spacing.xxl,
    opacity: 0.9,
  },
  recordButton: {
    backgroundColor: '#E07A5F', // Warm Coral - 直接指定
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xxl * 1.5,
    borderRadius: 60,
    minWidth: 280,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E07A5F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  recordButtonText: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.lg,
    fontWeight: '600' as any,
    color: '#FFFFFF', // 確実に白色
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  editHint: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    opacity: 0.8,
  },
  transcriptionInput: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    width: '100%',
    minHeight: 200,
    maxHeight: 400,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(224, 122, 95, 0.2)', // Accent color with transparency
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    lineHeight: fontSizes.base * 1.8,
    letterSpacing: 0.2,
    textAlignVertical: 'top',
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
});
