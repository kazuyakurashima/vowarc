/**
 * ImagePicker Component (Ticket 009)
 * Allows user to pick an image from camera or library
 */

import React from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import * as ExpoImagePicker from 'expo-image-picker';
import { Button } from '@/components/ui';
import { colors, spacing, fontSizes, typography } from '@/constants/theme';

interface ImagePickerProps {
  onImageSelected: (uri: string) => void;
  disabled?: boolean;
}

export function ImagePicker({ onImageSelected, disabled = false }: ImagePickerProps) {
  const [permissionRequested, setPermissionRequested] = React.useState(false);

  const requestCameraPermission = async () => {
    const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        '権限が必要です',
        'カメラを使用するには、設定からカメラへのアクセスを許可してください。'
      );
      return false;
    }
    return true;
  };

  const requestMediaLibraryPermission = async () => {
    const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        '権限が必要です',
        '写真を選択するには、設定からフォトライブラリへのアクセスを許可してください。'
      );
      return false;
    }
    return true;
  };

  const handleTakePhoto = async () => {
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return;

      const result = await ExpoImagePicker.launchCameraAsync({
        mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1, // Max quality - we compress on server
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('エラー', '写真の撮影に失敗しました。もう一度お試しください。');
    }
  };

  const handlePickFromLibrary = async () => {
    try {
      const hasPermission = await requestMediaLibraryPermission();
      if (!hasPermission) return;

      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1, // Max quality - we compress on server
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('エラー', '画像の選択に失敗しました。もう一度お試しください。');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>画像を選択</Text>

      <View style={styles.buttonRow}>
        <View style={styles.buttonContainer}>
          <Button
            title="📸 撮影"
            onPress={handleTakePhoto}
            disabled={disabled}
            variant="secondary"
            style={styles.button}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="🖼️ ライブラリ"
            onPress={handlePickFromLibrary}
            disabled={disabled}
            variant="secondary"
            style={styles.button}
          />
        </View>
      </View>

      <Text style={styles.hint}>
        画像は自動的に圧縮されます（最大5MB）
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  buttonContainer: {
    flex: 1,
  },
  button: {
    paddingVertical: spacing.md,
  },
  hint: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
