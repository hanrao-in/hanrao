-- Migration: 20260803_001_add_video_columns.sql
-- Description: Add video_url and video_urls to public.projects table to resolve PGRST204 errors.

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS video_url text;

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS video_urls text[] DEFAULT '{}';

-- Ensure storage bucket 'videos' exists with public read access
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public Access for Videos'
  ) THEN
    CREATE POLICY "Public Access for Videos" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'videos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Uploads for Videos'
  ) THEN
    CREATE POLICY "Authenticated Uploads for Videos" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');
  END IF;
END $$;
