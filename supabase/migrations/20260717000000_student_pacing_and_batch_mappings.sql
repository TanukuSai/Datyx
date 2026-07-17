-- Add section and email columns to public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS section text NOT NULL DEFAULT 'N/A';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Create batch_year_mappings table
CREATE TABLE IF NOT EXISTS public.batch_year_mappings (
  batch_code text PRIMARY KEY,
  current_year integer NOT NULL CHECK (current_year BETWEEN 1 AND 5),
  updated_at timestamptz DEFAULT now()
);

-- Seed initial batch year mappings
INSERT INTO public.batch_year_mappings (batch_code, current_year) VALUES
  ('26', 1),
  ('25', 2),
  ('24', 3),
  ('23', 4)
ON CONFLICT (batch_code) DO UPDATE 
SET current_year = EXCLUDED.current_year;

-- Enable RLS
ALTER TABLE public.batch_year_mappings ENABLE ROW LEVEL SECURITY;

-- Allow select for authenticated users
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.batch_year_mappings;
CREATE POLICY "Allow select for authenticated users" ON public.batch_year_mappings
  FOR SELECT TO authenticated USING (true);

-- Allow all write operations for admins only
DROP POLICY IF EXISTS "Allow write for admins" ON public.batch_year_mappings;
CREATE POLICY "Allow write for admins" ON public.batch_year_mappings
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
