-- Alter payments table to support manual uploads
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS utr text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS screenshot_url text;

-- Create storage bucket for screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('payment_screenshots', 'payment_screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads to payment_screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read of payment_screenshots" ON storage.objects;

-- Set up storage policies
CREATE POLICY "Allow authenticated uploads to payment_screenshots"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'payment_screenshots');

CREATE POLICY "Allow public read of payment_screenshots"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'payment_screenshots');
