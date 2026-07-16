-- SQL Quest Timing Gating & Progress Tracking Schema

-- Create quest_settings table
CREATE TABLE IF NOT EXISTS public.quest_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  start_time timestamptz,
  end_time timestamptz,
  active_topic_id text NOT NULL DEFAULT 'topic_1',
  updated_at timestamptz DEFAULT now()
);

-- Seed initial row
INSERT INTO public.quest_settings (id, start_time, end_time, active_topic_id)
VALUES (1, NULL, NULL, 'topic_1')
ON CONFLICT (id) DO NOTHING;

-- Create user_quest_progress table
CREATE TABLE IF NOT EXISTS public.user_quest_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level_id integer NOT NULL,
  completed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, level_id)
);

-- Expose active timings check (evaluating now() on Postgres server clock)
CREATE OR REPLACE FUNCTION public.is_quest_active()
RETURNS boolean AS $$
DECLARE
  v_start timestamptz;
  v_end timestamptz;
BEGIN
  SELECT start_time, end_time INTO v_start, v_end FROM public.quest_settings WHERE id = 1;
  IF v_start IS NULL OR v_end IS NULL THEN
    RETURN false;
  END IF;
  RETURN now() >= v_start AND now() <= v_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security (RLS)
ALTER TABLE public.quest_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quest_progress ENABLE ROW LEVEL SECURITY;

-- Disable duplicate policies if they exist
DROP POLICY IF EXISTS "Allow read access to quest_settings for everyone" ON public.quest_settings;
DROP POLICY IF EXISTS "Allow write access to quest_settings for admins" ON public.quest_settings;
DROP POLICY IF EXISTS "Allow users to view their own progress" ON public.user_quest_progress;
DROP POLICY IF EXISTS "Allow users to insert/update their own progress" ON public.user_quest_progress;
DROP POLICY IF EXISTS "Allow admins to read all progress records" ON public.user_quest_progress;

-- Create Policies
CREATE POLICY "Allow read access to quest_settings for everyone" ON public.quest_settings
  FOR SELECT USING (true);

CREATE POLICY "Allow write access to quest_settings for admins" ON public.quest_settings
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Allow users to view their own progress" ON public.user_quest_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert/update their own progress" ON public.user_quest_progress
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow admins to read all progress records" ON public.user_quest_progress
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Grant permissions
GRANT SELECT ON public.quest_settings TO authenticated, anon;
GRANT ALL ON public.quest_settings TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_quest_progress TO authenticated;
GRANT ALL ON public.user_quest_progress TO service_role;
