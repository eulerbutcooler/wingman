-- Supabase Storage setup for wingman files
-- Run this in your Supabase SQL editor

-- Create the storage bucket for wingman files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('wingman-files', 'wingman-files', true);

-- Create storage policies for the wingman-files bucket

-- Policy: Users can upload files to their own folder
CREATE POLICY "Users can upload files to their own folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'wingman-files' AND
  (storage.foldername(name))[1] IN ('course-images', 'lesson-videos', 'lesson-pdfs', 'lesson-presentations', 'lesson-documents', 'misc-files') AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Users can read their own files
CREATE POLICY "Users can read their own files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'wingman-files' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Users can update their own files
CREATE POLICY "Users can update their own files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'wingman-files' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'wingman-files' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Allow public read access for course content
CREATE POLICY "Public read access for course content" ON storage.objects
FOR SELECT USING (bucket_id = 'wingman-files');

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
