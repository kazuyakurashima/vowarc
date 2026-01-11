/**
 * CreateEvidenceForm Component (Ticket 009)
 * Form for creating new evidence (image/url/note)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Button, TextInput } from '@/components/ui';
import { ImagePicker } from './ImagePicker';
import { colors, spacing, fontSizes, typography } from '@/constants/theme';
import { EvidenceType } from '@/lib/supabase/types';
import { uploadEvidenceImage } from '@/lib/supabase/storage';
import { useCreateEvidence } from '@/hooks/data/useEvidences';
import { useAuth } from '@/hooks/auth';

interface CreateEvidenceFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateEvidenceForm({ onSuccess, onCancel }: CreateEvidenceFormProps) {
  const { user } = useAuth();
  const { createEvidence, creating } = useCreateEvidence();

  const [selectedType, setSelectedType] = useState<EvidenceType>('image');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const isFormValid = () => {
    if (!title.trim()) return false;

    if (selectedType === 'image' && !imageUri) return false;
    if (selectedType === 'url' && !content.trim()) return false;
    if (selectedType === 'note' && !content.trim()) return false;

    return true;
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('エラー', 'ユーザー情報が見つかりません');
      return;
    }

    if (!isFormValid()) {
      Alert.alert('エラー', 'すべての項目を入力してください');
      return;
    }

    try {
      setUploading(true);

      let fileUrl: string | null = null;

      // Upload image if type is 'image'
      if (selectedType === 'image' && imageUri) {
        fileUrl = await uploadEvidenceImage(user.id, imageUri);
      }

      // Create evidence record
      const evidence = await createEvidence({
        user_id: user.id,
        type: selectedType,
        title: title.trim(),
        content: selectedType !== 'image' ? content.trim() : null,
        file_url: fileUrl,
        date: new Date().toISOString().split('T')[0], // Today's date (YYYY-MM-DD)
      });

      if (evidence) {
        Alert.alert('成功', 'エビデンスを追加しました');
        onSuccess();
      } else {
        Alert.alert('エラー', 'エビデンスの追加に失敗しました');
      }
    } catch (error) {
      console.error('Error creating evidence:', error);
      Alert.alert('エラー', error instanceof Error ? error.message : 'エビデンスの追加に失敗しました');
    } finally {
      setUploading(false);
    }
  };

  const loading = creating || uploading;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>エビデンスを追加</Text>

      {/* Type selector */}
      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[styles.typeButton, selectedType === 'image' && styles.typeButtonActive]}
          onPress={() => setSelectedType('image')}
          disabled={loading}
        >
          <Text style={[styles.typeButtonText, selectedType === 'image' && styles.typeButtonTextActive]}>
            📸 画像
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeButton, selectedType === 'url' && styles.typeButtonActive]}
          onPress={() => setSelectedType('url')}
          disabled={loading}
        >
          <Text style={[styles.typeButtonText, selectedType === 'url' && styles.typeButtonTextActive]}>
            🔗 URL
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeButton, selectedType === 'note' && styles.typeButtonActive]}
          onPress={() => setSelectedType('note')}
          disabled={loading}
        >
          <Text style={[styles.typeButtonText, selectedType === 'note' && styles.typeButtonTextActive]}>
            📝 メモ
          </Text>
        </TouchableOpacity>
      </View>

      {/* Title input */}
      <TextInput
        label="タイトル"
        value={title}
        onChangeText={setTitle}
        placeholder="例: 朝5時起床達成"
        maxLength={200}
        editable={!loading}
      />

      {/* Type-specific inputs */}
      {selectedType === 'image' && (
        <View style={styles.imageSection}>
          <ImagePicker
            onImageSelected={setImageUri}
            disabled={loading}
          />

          {imageUri && (
            <View style={styles.imagePreviewContainer}>
              <Text style={styles.imagePreviewLabel}>プレビュー:</Text>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <TouchableOpacity
                onPress={() => setImageUri(null)}
                style={styles.removeImageButton}
                disabled={loading}
              >
                <Text style={styles.removeImageText}>✕ 削除</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {selectedType === 'url' && (
        <TextInput
          label="URL"
          value={content}
          onChangeText={setContent}
          placeholder="https://example.com"
          keyboardType="url"
          autoCapitalize="none"
          editable={!loading}
        />
      )}

      {selectedType === 'note' && (
        <TextInput
          label="メモ"
          value={content}
          onChangeText={setContent}
          placeholder="気づき、学び、振り返りなど"
          multiline
          numberOfLines={4}
          editable={!loading}
          style={styles.noteInput}
        />
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        <Button
          title="キャンセル"
          variant="text"
          onPress={onCancel}
          disabled={loading}
          style={styles.cancelButton}
        />

        <Button
          title={loading ? '保存中...' : '保存する'}
          onPress={handleSubmit}
          disabled={!isFormValid() || loading}
          loading={loading}
          style={styles.submitButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
  },
  title: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.xxl,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  typeButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: colors.accent + '20',
    borderColor: colors.accent,
  },
  typeButtonText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  typeButtonTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  imageSection: {
    marginTop: spacing.md,
  },
  imagePreviewContainer: {
    marginTop: spacing.md,
  },
  imagePreviewLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  removeImageButton: {
    marginTop: spacing.sm,
    alignSelf: 'center',
  },
  removeImageText: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.error,
  },
  noteInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});
