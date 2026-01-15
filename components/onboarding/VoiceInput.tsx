/**
 * Reusable Voice Input Component for Onboarding
 * Simplified version of voice checkin (no Orb, no If-Then)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput as RNTextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { uploadAudioFile } from '@/lib/supabase/audio-storage';
import { Button } from '@/components/ui/Button';
import { colors, spacing, typography, fontSizes } from '@/constants/theme';
import { useAuth } from '@/hooks/auth';
import { supabase } from '@/lib/supabase';
import { buildApiUrl } from '@/lib/api-config';

type VoiceInputProps = {
  onTranscriptionComplete: (text: string) => void;
  onVoiceInputUsed?: () => void; // Callback when voice input is used
  onAudioUrlReady?: (audioUrl: string) => void; // Callback with audio URL
};

type FlowStep = 'idle' | 'recording' | 'transcribing' | 'reviewing';

export function VoiceInput({ onTranscriptionComplete, onVoiceInputUsed, onAudioUrlReady }: VoiceInputProps) {
  const { user } = useAuth();
  const { recording, startRecording, stopRecording, cancelRecording } =
    useAudioRecording();

  const [visible, setVisible] = useState(false);
  const [flowStep, setFlowStep] = useState<FlowStep>('idle');
  const [transcription, setTranscription] = useState('');
  const [audioUrl, setAudioUrl] = useState<string>('');

  // Format duration as MM:SS
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    setVisible(true);
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
        throw new Error('User not authenticated');
      }

      // Get auth token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error('認証トークンが取得できません。再度ログインしてください。');
      }

      // Upload audio to Supabase Storage
      const url = await uploadAudioFile(user.id, uri);
      setAudioUrl(url); // Store audio URL

      // Call Whisper API for transcription
      const apiUrl = buildApiUrl('/api/audio/transcribe');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ audioUrl: url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `サーバーエラー (${response.status})`);
      }

      const data = await response.json();
      setTranscription(data.text);
      setFlowStep('reviewing');
    } catch (error) {
      console.error('[VoiceInput] Error:', error);

      let errorMessage = '音声の文字起こしに失敗しました。';

      if (error instanceof Error) {
        if (error.message.includes('Network request failed')) {
          errorMessage = 'ネットワークエラー: サーバーに接続できません。';
        } else {
          errorMessage = `エラー: ${error.message}`;
        }
      }

      Alert.alert('エラー', errorMessage);
      setFlowStep('idle');
      setVisible(false);
    }
  };

  const handleCancelRecording = async () => {
    await cancelRecording();
    setFlowStep('idle');
    setVisible(false);
  };

  const handleConfirm = () => {
    onTranscriptionComplete(transcription);
    onVoiceInputUsed?.(); // Notify that voice input was used
    onAudioUrlReady?.(audioUrl); // Pass audio URL to parent
    setTranscription('');
    setAudioUrl(''); // Clear audio URL
    setFlowStep('idle');
    setVisible(false);
  };

  const handleRetry = () => {
    setTranscription('');
    setFlowStep('idle');
  };

  return (
    <>
      {/* Microphone Button */}
      <TouchableOpacity
        style={styles.micButton}
        onPress={handleStartRecording}
        activeOpacity={0.7}
      >
        <Ionicons name="mic" size={24} color={colors.accent} />
      </TouchableOpacity>

      {/* Voice Input Modal */}
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (flowStep === 'recording') {
            handleCancelRecording();
          } else {
            setVisible(false);
            setFlowStep('idle');
          }
        }}
      >
        <View style={styles.modalContainer}>
          {/* Idle State (shouldn't be visible in modal) */}
          {flowStep === 'idle' && (
            <View style={styles.contentContainer}>
              <Text style={styles.title}>音声入力</Text>
              <Text style={styles.instruction}>録音を開始してください</Text>
            </View>
          )}

          {/* Recording State */}
          {flowStep === 'recording' && (
            <View style={styles.contentContainer}>
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
              </View>

              <Text style={styles.title}>録音中...</Text>
              <Text style={styles.duration}>
                {formatDuration(recording.duration)}
              </Text>
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
          {flowStep === 'reviewing' && (
            <View style={styles.contentContainer}>
              <Text style={styles.title}>内容の確認・編集</Text>
              <Text style={styles.editHint}>
                必要に応じて内容を編集できます
              </Text>

              <RNTextInput
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
                  onPress={handleRetry}
                  variant="secondary"
                  style={styles.actionButton}
                />
                <Button
                  title="確定"
                  onPress={handleConfirm}
                  variant="primary"
                  style={styles.actionButton}
                />
              </View>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  recordingIndicator: {
    marginBottom: spacing.xl,
  },
  recordingDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.error,
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
  duration: {
    fontFamily: typography.mono?.fontFamily || typography.body.fontFamily,
    fontSize: fontSizes.xxl,
    fontWeight: '500',
    color: colors.accent,
    marginBottom: spacing.lg,
    letterSpacing: 3,
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
    borderColor: 'rgba(224, 122, 95, 0.2)',
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    lineHeight: fontSizes.base * 1.8,
    letterSpacing: 0.2,
    textAlignVertical: 'top',
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
});
