-- Add new contact/photo columns to team_members
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS linkedin TEXT;

-- Seed bucket configurations into storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('team-photos', 'team-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if any to avoid errors during re-migration
DROP POLICY IF EXISTS "Public read team photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload team photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins update team photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete team photos" ON storage.objects;

-- Allow public read access to team photos
CREATE POLICY "Public read team photos" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'team-photos');

-- Allow admins to upload team photos
CREATE POLICY "Admins upload team photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'team-photos' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to update team photos
CREATE POLICY "Admins update team photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'team-photos' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete team photos
CREATE POLICY "Admins delete team photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'team-photos' AND public.has_role(auth.uid(), 'admin'));
