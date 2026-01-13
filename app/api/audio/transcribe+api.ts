/**
 * Audio Transcription API Endpoint (Ticket 004)
 * Transcribes audio using Whisper API
 */

import { openai } from '@/lib/openai/client';
import { toFile } from 'openai/uploads';
import { getServerClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    // Get authorization token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json(
        { error: 'Unauthorized: Missing or invalid authorization token' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token using service role client
    const serverClient = getServerClient();
    const { data: userData, error: authError } = await serverClient.auth.getUser(token);

    if (authError || !userData.user) {
      console.error('Auth verification failed:', authError);
      return Response.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    // User is authenticated, proceed with transcription
    const { audioUrl } = await request.json();

    // Validate input
    if (!audioUrl || typeof audioUrl !== 'string') {
      return Response.json(
        { error: 'Invalid request: audioUrl is required' },
        { status: 400 }
      );
    }

    // SSRF Protection: Validate URL is from Supabase Storage
    // NOTE: If using custom domain, add it to allowed hosts here
    const supabaseProjectUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!supabaseProjectUrl) {
      console.error('EXPO_PUBLIC_SUPABASE_URL is not configured in API runtime');
      return Response.json(
        {
          error: 'Server configuration error',
          message: 'EXPO_PUBLIC_SUPABASE_URL environment variable is not set',
        },
        { status: 500 }
      );
    }

    let supabaseDomain: string;
    let audioUrlParsed: URL;

    try {
      supabaseDomain = new URL(supabaseProjectUrl).hostname;
      audioUrlParsed = new URL(audioUrl);
    } catch (error) {
      console.error('Invalid URL format:', error);
      return Response.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    if (!audioUrlParsed.hostname.endsWith(supabaseDomain)) {
      console.warn('SSRF attempt detected:', { audioUrl, supabaseDomain });
      return Response.json(
        {
          error: 'Invalid audio URL: must be from Supabase Storage',
          expected_domain: supabaseDomain,
        },
        { status: 400 }
      );
    }

    // Folder ownership validation: Verify URL path contains user's ID
    // Expected format: /storage/v1/object/public/checkin-audio/{user_id}/{filename}
    const pathParts = audioUrlParsed.pathname.split('/');
    const bucketIndex = pathParts.indexOf('checkin-audio');

    if (bucketIndex === -1 || bucketIndex >= pathParts.length - 2) {
      return Response.json(
        { error: 'Invalid audio URL: incorrect folder structure' },
        { status: 400 }
      );
    }

    const folderUserId = pathParts[bucketIndex + 1];

    if (folderUserId !== userData.user.id) {
      console.warn('Unauthorized folder access attempt:', {
        requestedUserId: folderUserId,
        authenticatedUserId: userData.user.id,
      });
      return Response.json(
        { error: 'Forbidden: You can only transcribe your own audio files' },
        { status: 403 }
      );
    }

    // Fetch audio file from Supabase Storage
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      return Response.json(
        { error: 'Failed to fetch audio file from storage' },
        { status: 400 }
      );
    }

    // Get audio as blob
    const audioBlob = await audioResponse.blob();

    // Convert Blob to File using OpenAI SDK's toFile helper
    // This works in both Node.js and Edge runtime
    const audioFile = await toFile(audioBlob, 'recording.m4a', { type: 'audio/m4a' });

    // Call Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'ja', // Japanese optimization
      response_format: 'verbose_json',
    });

    return Response.json({
      success: true,
      text: transcription.text,
      language: transcription.language,
      duration: transcription.duration,
    });
  } catch (error) {
    console.error('Error in transcription API:', error);

    return Response.json(
      {
        error: 'Failed to transcribe audio',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
