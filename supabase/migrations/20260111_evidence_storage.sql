-- ============================================
-- Evidence Images Storage Policies (Ticket 009)
-- ============================================

-- NOTE: The 'evidence-images' bucket must be created manually in Supabase Dashboard first:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create new bucket named 'evidence-images'
-- 3. Set as Public bucket (allows public reads)
-- 4. Then apply these policies via SQL

-- ============================================
-- Storage Policies for 'evidence-images' bucket
-- ============================================

-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload own evidence images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'evidence-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own evidence images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'evidence-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own evidence images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'evidence-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all evidence images (for sharing)
-- This is safe because folder structure is: evidence-images/{user_id}/{filename}
-- Users can only upload to their own folder, but anyone with URL can view
CREATE POLICY "Public can view evidence images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'evidence-images');

-- ============================================
-- Comments
-- ============================================

COMMENT ON POLICY "Users can upload own evidence images" ON storage.objects IS
  'Authenticated users can upload images to their own folder (evidence-images/{user_id}/*)';

COMMENT ON POLICY "Public can view evidence images" ON storage.objects IS
  'Public read access for sharing evidence. Folder structure ensures user isolation for writes.';
