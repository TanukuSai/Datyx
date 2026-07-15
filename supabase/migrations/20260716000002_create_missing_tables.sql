-- 1. Create contact_messages table and RLS policies
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a contact message"
  ON public.contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(name) BETWEEN 2 AND 100
    AND length(email) BETWEEN 3 AND 200
    AND length(subject) BETWEEN 2 AND 200
    AND length(message) BETWEEN 10 AND 2000
  );

CREATE POLICY "Admins read contact messages" ON public.contact_messages
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete contact messages" ON public.contact_messages
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, DELETE ON public.contact_messages TO authenticated;

-- 2. Create event_registrations table and RLS policies
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_slug TEXT NOT NULL,
  event_title TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_slug)
);

GRANT SELECT, INSERT, DELETE ON public.event_registrations TO authenticated;
GRANT ALL ON public.event_registrations TO service_role;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own registrations"
  ON public.event_registrations FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users register themselves"
  ON public.event_registrations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users cancel their own registrations"
  ON public.event_registrations FOR DELETE TO authenticated USING (auth.uid() = user_id);
