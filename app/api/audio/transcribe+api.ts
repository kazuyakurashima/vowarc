/**
 * Audio Transcription API Endpoint (Ticket 004)
 * Transcribes audio using Whisper API
 */

import { openai } from '@/lib/openai/client';
import { toFile } from 'openai/uploads';

export async function POST(request: Request) {
  try {
    const { audioUrl } = await request.json();

    // Validate input
    if (!audioUrl || typeof audioUrl !== 'string') {
      return Response.json(
        { error: 'Invalid request: audioUrl is required' },
        { status: 400 }
      );
    }

    // SSRF Protection: Validate URL is from Supabase Storage
    const supabaseProjectUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!supabaseProjectUrl) {
      return Response.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabaseDomain = new URL(supabaseProjectUrl).hostname;
    const audioUrlParsed = new URL(audioUrl);

    if (!audioUrlParsed.hostname.endsWith(supabaseDomain)) {
      return Response.json(
        { error: 'Invalid audio URL: must be from Supabase Storage' },
        { status: 400 }
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
