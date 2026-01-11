/**
 * Supabase Storage Service (Ticket 009)
 * Handles image uploads for Evidence Journal
 */

import { supabase } from '../supabase';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { decode } from 'base64-arraybuffer';

const EVIDENCE_BUCKET = 'evidence-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGE_WIDTH = 1920; // Resize to max 1920px width
const MAX_IMAGE_HEIGHT = 1920; // Resize to max 1920px height

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
    // Compress image first
    console.log('[UPLOAD] Starting compression for:', uri);
    const compressedUri = await compressImage(uri);
    console.log('[UPLOAD] Compression complete:', compressedUri);

    // Generate filename if not provided
    const timestamp = Date.now();
    const finalFilename = filename || `${timestamp}.jpg`; // Always use .jpg after compression
    const filePath = `${userId}/${finalFilename}`;
    console.log('[UPLOAD] Will upload to:', filePath);

    // Read compressed file as base64
    console.log('[UPLOAD] Reading file as base64...');
    const base64 = await FileSystem.readAsStringAsync(compressedUri, {
      encoding: 'base64',
    });
    console.log('[UPLOAD] Base64 read complete, length:', base64.length);

    // Check file size (base64 is ~33% larger than binary)
    const estimatedSize = (base64.length * 3) / 4;
    console.log('[UPLOAD] Estimated file size:', (estimatedSize / 1024 / 1024).toFixed(2), 'MB');

    if (estimatedSize > MAX_FILE_SIZE) {
      throw new Error(`画像が大きすぎます（圧縮後: ${(estimatedSize / 1024 / 1024).toFixed(1)}MB）。\nより小さい画像を選択してください。`);
    }

    // Convert base64 to ArrayBuffer
    console.log('[UPLOAD] Converting base64 to ArrayBuffer...');
    const arrayBuffer = decode(base64);
    console.log('[UPLOAD] ArrayBuffer created, byteLength:', arrayBuffer.byteLength);

    // Always JPEG after compression
    const contentType = 'image/jpeg';

    // Upload to Supabase Storage
    console.log('[UPLOAD] Uploading to Supabase Storage...');
    const { data, error } = await supabase.storage
      .from(EVIDENCE_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType,
        upsert: false, // Don't overwrite existing files
      });
    console.log('[UPLOAD] Upload response:', { data, error });

    if (error) {
      console.error('[UPLOAD] Upload failed:', error);
      throw new Error(`画像のアップロードに失敗しました: ${error.message}`);
    }

    // Get public URL
    console.log('[UPLOAD] Getting public URL...');
    const { data: urlData } = supabase.storage
      .from(EVIDENCE_BUCKET)
      .getPublicUrl(filePath);
    console.log('[UPLOAD] Success! Public URL:', urlData.publicUrl);

    return urlData.publicUrl;
  } catch (error) {
    console.error('[UPLOAD] ERROR:', error);
    console.error('[UPLOAD] Error stack:', error instanceof Error ? error.stack : 'No stack');
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
 * Compress and resize image before upload
 *
 * @param uri - Local file URI
 * @returns Compressed image URI
 */
export async function compressImage(uri: string): Promise<string> {
  try {
    console.log('[COMPRESS] Starting compression for:', uri);
    // Compress and resize image
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          resize: {
            width: MAX_IMAGE_WIDTH,
            height: MAX_IMAGE_HEIGHT,
          },
        },
      ],
      {
        compress: 0.7, // 70% quality
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    console.log('[COMPRESS] Compression successful:', result.uri);

    return result.uri;
  } catch (error) {
    console.error('[COMPRESS] ERROR:', error);
    console.error('[COMPRESS] Fallback to original URI');
    // Return original URI if compression fails
    return uri;
  }
}
