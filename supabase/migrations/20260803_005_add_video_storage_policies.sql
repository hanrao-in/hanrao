-- Migration: 20260803_005_add_video_storage_policies.sql
-- Description: Add UPDATE and DELETE policies for authenticated users on storage.objects for the 'videos' bucket to support upsert/replacement.

DO $$ 
BEGIN
  -- Drop old policies to avoid RLS violation conflicts
  DROP POLICY IF EXISTS "Public Access for Videos" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated Uploads for Videos" ON storage.objects;
  DROP POLICY IF EXISTS "Allow public read for videos storage" ON storage.objects;
  DROP POLICY IF EXISTS "Allow admins upload for videos storage" ON storage.objects;

  -- 1. SELECT (Public Read)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Access for Videos'
  ) THEN
    CREATE POLICY "Public Read Access for Videos" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'videos');
  END IF;

  -- 2. INSERT (Authenticated Users)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Insert Access for Videos'
  ) THEN
    CREATE POLICY "Authenticated Insert Access for Videos" 
    ON storage.objects FOR INSERT 
    TO authenticated
    WITH CHECK (bucket_id = 'videos');
  END IF;

  -- 3. UPDATE (Authenticated Users)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Update Access for Videos'
  ) THEN
    CREATE POLICY "Authenticated Update Access for Videos" 
    ON storage.objects FOR UPDATE 
    TO authenticated
    USING (bucket_id = 'videos')
    WITH CHECK (bucket_id = 'videos');
  END IF;

  -- 4. DELETE (Authenticated Users)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Delete Access for Videos'
  ) THEN
    CREATE POLICY "Authenticated Delete Access for Videos" 
    ON storage.objects FOR DELETE 
    TO authenticated
    USING (bucket_id = 'videos');
  END IF;
END $$;
