-- Supabase Storage Setup for BiblianaArte.com
-- This script sets up the storage bucket and policies for artwork images

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'artwork-images',
  'artwork-images', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to artwork images
CREATE POLICY "Allow public read access to artwork images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'artwork-images');

-- Policy: Allow authenticated users to upload artwork images
CREATE POLICY "Allow authenticated upload to artwork images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'artwork-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IS NOT NULL
);

-- Policy: Allow authenticated users to update their own uploads
CREATE POLICY "Allow authenticated update of artwork images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'artwork-images' 
  AND auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users to delete artwork images
CREATE POLICY "Allow authenticated delete of artwork images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'artwork-images' 
  AND auth.role() = 'authenticated'
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_id_name 
ON storage.objects (bucket_id, name);

-- Function to get storage URL for an image
CREATE OR REPLACE FUNCTION get_storage_url(bucket_name text, file_path text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN concat(
    current_setting('app.settings.supabase_url', true),
    '/storage/v1/object/public/',
    bucket_name,
    '/',
    file_path
  );
END;
$$;

-- View to show storage usage statistics
CREATE OR REPLACE VIEW storage_stats AS
SELECT 
  bucket_id,
  COUNT(*) as total_files,
  SUM(metadata->>'size')::bigint as total_size_bytes,
  ROUND(SUM(metadata->>'size')::bigint / 1024.0 / 1024.0, 2) as total_size_mb,
  MIN(created_at) as first_upload,
  MAX(created_at) as last_upload
FROM storage.objects
WHERE bucket_id = 'artwork-images'
GROUP BY bucket_id;

-- Grant access to the view
GRANT SELECT ON storage_stats TO anon;
GRANT SELECT ON storage_stats TO authenticated;

COMMENT ON TABLE storage.buckets IS 'Storage buckets for organizing files';
COMMENT ON POLICY "Allow public read access to artwork images" ON storage.objects IS 'Allows anyone to view artwork images';
COMMENT ON FUNCTION get_storage_url IS 'Helper function to generate full storage URLs';
COMMENT ON VIEW storage_stats IS 'View showing storage usage statistics for monitoring';