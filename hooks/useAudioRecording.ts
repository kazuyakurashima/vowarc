/**
 * Audio Recording Hook (Ticket 004)
 * Manages audio recording with expo-av
 */

import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number; // in milliseconds
  uri: string | null;
}

export interface UseAudioRecordingReturn {
  recording: RecordingState;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>; // Returns URI
  cancelRecording: () => Promise<void>;
  metering: number; // 0-1, for visual feedback
}

export function useAudioRecording(): UseAudioRecordingReturn {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    uri: null,
  });

  const [metering, setMetering] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const meteringInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(console.error);
      }
      if (meteringInterval.current) {
        clearInterval(meteringInterval.current);
      }
    };
  }, []);

  const requestPermissions = async (): Promise<boolean> => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          '権限が必要です',
          'マイクへのアクセスを許可してください。設定から変更できます。'
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting audio permissions:', error);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      // Request permissions
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create recording with explicit m4a/AAC format for cross-platform consistency
      const { recording } = await Audio.Recording.createAsync({
        isMeteringEnabled: true,
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        web: {
          mimeType: 'audio/mp4',
          bitsPerSecond: 128000,
        },
      });

      recordingRef.current = recording;

      setRecordingState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        uri: null,
      });

      // Start metering updates for visualization
      meteringInterval.current = setInterval(async () => {
        if (recordingRef.current) {
          const status = await recordingRef.current.getStatusAsync();
          if (status.isRecording) {
            setRecordingState(prev => ({
              ...prev,
              duration: status.durationMillis,
            }));

            // Update metering level (normalized to 0-1)
            // expo-av doesn't provide metering on all platforms, so we simulate it
            if (status.metering !== undefined) {
              const normalized = Math.max(0, Math.min(1, (status.metering + 160) / 160));
              setMetering(normalized);
            } else {
              // Simulate pulsing for platforms without metering
              setMetering(0.3 + Math.random() * 0.3);
            }
          }
        }
      }, 100);
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('エラー', '録音の開始に失敗しました。もう一度お試しください。');
    }
  };

  const stopRecording = async (): Promise<string | null> => {
    try {
      if (!recordingRef.current) return null;

      // Clear metering interval
      if (meteringInterval.current) {
        clearInterval(meteringInterval.current);
        meteringInterval.current = null;
      }

      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();

      setRecordingState({
        isRecording: false,
        isPaused: false,
        duration: 0,
        uri,
      });

      setMetering(0);
      recordingRef.current = null;

      return uri;
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('エラー', '録音の停止に失敗しました。');
      return null;
    }
  };

  const cancelRecording = async () => {
    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }

      if (meteringInterval.current) {
        clearInterval(meteringInterval.current);
        meteringInterval.current = null;
      }

      setRecordingState({
        isRecording: false,
        isPaused: false,
        duration: 0,
        uri: null,
      });

      setMetering(0);
    } catch (error) {
      console.error('Error canceling recording:', error);
    }
  };

  return {
    recording: recordingState,
    startRecording,
    stopRecording,
    cancelRecording,
    metering,
  };
}
