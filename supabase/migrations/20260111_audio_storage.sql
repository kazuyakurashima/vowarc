-- ============================================
-- Audio Storage Policies (Ticket 004)
-- ============================================

-- NOTE: The 'checkin-audio' bucket must be created manually in Supabase Dashboard first:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create new bucket named 'checkin-audio'
-- 3. Set as Public bucket (allows public reads for playback)
-- 4. Then apply these policies via SQL

-- ============================================
-- Storage Policies for 'checkin-audio' bucket
-- ============================================

-- Allow authenticated users to upload their own audio files
CREATE POLICY "Users can upload own checkin audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'checkin-audio'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own audio files
CREATE POLICY "Users can update own checkin audio"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'checkin-audio'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own audio files
CREATE POLICY "Users can delete own checkin audio"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'checkin-audio'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all audio files (for playback)
-- This is safe because folder structure is: checkin-audio/{user_id}/{filename}
-- Users can only upload to their own folder, but anyone with URL can listen
CREATE POLICY "Public can access checkin audio"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'checkin-audio');

-- ============================================
-- Comments
-- ============================================

COMMENT ON POLICY "Users can upload own checkin audio" ON storage.objects IS
  'Authenticated users can upload audio files to their own folder (checkin-audio/{user_id}/*)';

COMMENT ON POLICY "Public can access checkin audio" ON storage.objects IS
  'Public read access for playback. Folder structure ensures user isolation for writes.';
