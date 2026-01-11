/**
 * Supabase Storage Service (Ticket 009)
 * Handles image uploads for Evidence Journal
 */

import { supabase } from '../supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

const EVIDENCE_BUCKET = 'evidence-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Upload an evidence image to Supabase Storage
 *
 * @param userId - User ID (for folder organization)
 * @param uri - Local file URI (from ImagePicker)
 * @param filename - Optional custom filename (defaults to timestamp-based)
 * @returns Public URL of uploaded image
 */
export async function uploadEvidenceImage(
  userId: string,
  uri: string,
  filename?: string
): Promise<string> {
  try {
    // Generate filename if not provided
    const timestamp = Date.now();
    const extension = uri.split('.').pop() || 'jpg';
    const finalFilename = filename || `${timestamp}.${extension}`;
    const filePath = `${userId}/${finalFilename}`;

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Check file size (base64 is ~33% larger than binary)
    const estimatedSize = (base64.length * 3) / 4;
    if (estimatedSize > MAX_FILE_SIZE) {
      throw new Error(`ファイルサイズが大きすぎます（最大: 5MB）`);
    }

    // Convert base64 to ArrayBuffer
    const arrayBuffer = decode(base64);

    // Determine content type
    const contentType = getContentType(extension);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(EVIDENCE_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType,
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      throw new Error(`画像のアップロードに失敗しました: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(EVIDENCE_BUCKET)
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading evidence image:', error);
    throw error;
  }
}

/**
 * Delete an evidence image from Supabase Storage
 *
 * @param fileUrl - Public URL of the image to delete
 */
export async function deleteEvidenceImage(fileUrl: string): Promise<void> {
  try {
    // Extract file path from URL
    // URL format: https://{project}.supabase.co/storage/v1/object/public/evidence-images/{userId}/{filename}
    const urlParts = fileUrl.split('/');
    const bucketIndex = urlParts.findIndex(part => part === EVIDENCE_BUCKET);

    if (bucketIndex === -1) {
      throw new Error('Invalid evidence image URL');
    }

    const filePath = urlParts.slice(bucketIndex + 1).join('/');

    const { error } = await supabase.storage
      .from(EVIDENCE_BUCKET)
      .remove([filePath]);

    if (error) {
      throw new Error(`画像の削除に失敗しました: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting evidence image:', error);
    throw error;
  }
}

/**
 * Get content type from file extension
 */
function getContentType(extension: string): string {
  const ext = extension.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Compress image before upload (future enhancement)
 * Currently not implemented - using raw upload
 */
export async function compressImage(uri: string): Promise<string> {
  // TODO: Implement image compression using expo-image-manipulator
  // For MVP, we skip compression and rely on client-side file size check
  return uri;
}
