-- ==============================================================================
-- AVANYX STORE - SUPABASE STORAGE ROW LEVEL SECURITY (RLS) POLICIES SCHEMA
-- AUTHENTICATION PROVIDER: FIREBASE AUTHENTICATION (FIREBASE JWT)
-- ==============================================================================

-- 1. Create Storage Buckets (if not already created)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('developer-profile', 'developer-profile', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  ('developer-banner', 'developer-banner', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  ('app-icons', 'app-icons', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  ('app-banners', 'app-banners', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  ('app-screenshots', 'app-screenshots', true, 15728640, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  ('app-videos', 'app-videos', true, 104857600, ARRAY['video/mp4'])
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Helper function to extract Firebase JWT UID
CREATE OR REPLACE FUNCTION storage.firebase_uid()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'sub',
    auth.jwt() ->> 'user_id',
    auth.jwt() -> 'claims' ->> 'user_id',
    (auth.jwt() -> 'claims' ->> 'sub')
  );
$$;

-- 3. Helper function to extract Firebase Role from JWT claims or request header
CREATE OR REPLACE FUNCTION storage.firebase_role()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'role',
    auth.jwt() -> 'claims' ->> 'role',
    'USER'
  );
$$;

-- 4. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- PUBLIC READ POLICIES (All buckets are publicly readable for Store catalog)
-- ------------------------------------------------------------------------------
CREATE POLICY "Public Read Access for AVANYX Store Assets"
ON storage.objects FOR SELECT
USING (
  bucket_id IN (
    'developer-profile',
    'developer-banner',
    'app-icons',
    'app-banners',
    'app-screenshots',
    'app-videos'
  )
);

-- ------------------------------------------------------------------------------
-- UPLOAD POLICIES (DEVELOPER and ADMIN roles only, owned folder check)
-- ------------------------------------------------------------------------------

-- Developer Profile Upload Policy
CREATE POLICY "Developers Upload Developer Profile"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'developer-profile'
  AND (storage.firebase_role() IN ('DEVELOPER', 'ADMIN', 'service_role'))
  AND (name LIKE storage.firebase_uid() || '/%' OR storage.firebase_role() = 'ADMIN')
);

-- Developer Banner Upload Policy
CREATE POLICY "Developers Upload Developer Banner"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'developer-banner'
  AND (storage.firebase_role() IN ('DEVELOPER', 'ADMIN', 'service_role'))
  AND (name LIKE storage.firebase_uid() || '/%' OR storage.firebase_role() = 'ADMIN')
);

-- App Icons Upload Policy
CREATE POLICY "Developers Upload App Icons"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'app-icons'
  AND (storage.firebase_role() IN ('DEVELOPER', 'ADMIN', 'service_role'))
);

-- App Banners Upload Policy
CREATE POLICY "Developers Upload App Banners"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'app-banners'
  AND (storage.firebase_role() IN ('DEVELOPER', 'ADMIN', 'service_role'))
);

-- App Screenshots Upload Policy
CREATE POLICY "Developers Upload App Screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'app-screenshots'
  AND (storage.firebase_role() IN ('DEVELOPER', 'ADMIN', 'service_role'))
);

-- App Videos Upload Policy
CREATE POLICY "Developers Upload App Videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'app-videos'
  AND (storage.firebase_role() IN ('DEVELOPER', 'ADMIN', 'service_role'))
);

-- ------------------------------------------------------------------------------
-- UPDATE & DELETE POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Developers Update Owned Assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('developer-profile', 'developer-banner', 'app-icons', 'app-banners', 'app-screenshots', 'app-videos')
  AND (storage.firebase_role() IN ('DEVELOPER', 'ADMIN', 'service_role'))
);

CREATE POLICY "Developers Delete Owned Assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id IN ('developer-profile', 'developer-banner', 'app-icons', 'app-banners', 'app-screenshots', 'app-videos')
  AND (storage.firebase_role() IN ('DEVELOPER', 'ADMIN', 'service_role'))
);
