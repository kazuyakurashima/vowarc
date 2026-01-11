/**
 * Audio Storage Service (Ticket 004)
 * Handles audio file uploads to Supabase Storage
 */

import { supabase } from '../supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

const AUDIO_BUCKET = 'checkin-audio';

/**
 * Upload audio file to Supabase Storage
 *
 * @param userId - User ID for folder organization
 * @param audioUri - Local file URI from expo-av recording
 * @param filename - Optional custom filename (defaults to timestamp-based)
 * @returns Public URL of uploaded audio
 */
export async function uploadAudioFile(
  userId: string,
  audioUri: string,
  filename?: string
): Promise<string> {
  try {
    // Generate filename if not provided
    const timestamp = Date.now();
    const finalFilename = filename || `${timestamp}.m4a`;
    const filePath = `${userId}/${finalFilename}`;

    // Read audio file as base64
    const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
      encoding: 'base64',
    });

    // Convert base64 to ArrayBuffer using base64-arraybuffer
    const arrayBuffer = decode(base64Audio);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: 'audio/m4a',
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      console.error('Audio upload failed:', error);
      throw new Error(`音声のアップロードに失敗しました: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(AUDIO_BUCKET)
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading audio:', error);
    throw error;
  }
}

/**
 * Delete an audio file from Supabase Storage
 *
 * @param fileUrl - Public URL of the audio to delete
 */
export async function deleteAudioFile(fileUrl: string): Promise<void> {
  try {
    // Extract file path from URL
    const urlParts = fileUrl.split('/');
    const bucketIndex = urlParts.findIndex(part => part === AUDIO_BUCKET);

    if (bucketIndex === -1) {
      throw new Error('Invalid audio file URL');
    }

    const filePath = urlParts.slice(bucketIndex + 1).join('/');

    const { error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .remove([filePath]);

    if (error) {
      throw new Error(`音声の削除に失敗しました: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting audio:', error);
    throw error;
  }
}
