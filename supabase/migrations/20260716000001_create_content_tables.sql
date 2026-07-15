-- Drop existing tables if they exist to start fresh
DROP TABLE IF EXISTS public.track_events CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.gallery CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;

-- Create events table (live events calendar)
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date date,
  start_time time,
  end_time time,
  venue text,
  organizer text,
  category text,
  poster_url text,
  registration_link text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'upcoming', 'live', 'past')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create announcements table
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create gallery table
CREATE TABLE public.gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  caption text,
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create team_members table
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  bio text NOT NULL,
  category text NOT NULL CHECK (category IN ('faculty', 'track_lead', 'creative_lead')),
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create track_events table
CREATE TABLE public.track_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_key text NOT NULL,
  track_name text NOT NULL,
  track_tag text NOT NULL,
  track_blurb text NOT NULL,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_events ENABLE ROW LEVEL SECURITY;

-- Define Policies: SELECT is public for all
CREATE POLICY "Public SELECT events" ON public.events FOR SELECT TO public USING (true);
CREATE POLICY "Public SELECT announcements" ON public.announcements FOR SELECT TO public USING (true);
CREATE POLICY "Public SELECT gallery" ON public.gallery FOR SELECT TO public USING (true);
CREATE POLICY "Public SELECT team_members" ON public.team_members FOR SELECT TO public USING (true);
CREATE POLICY "Public SELECT track_events" ON public.track_events FOR SELECT TO public USING (true);

-- Define Policies: ALL writes restricted to Admins
CREATE POLICY "Admin write events" ON public.events FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin write announcements" ON public.announcements FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin write gallery" ON public.gallery FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin write team_members" ON public.team_members FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin write track_events" ON public.track_events FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Seed Faculty Coordinators
INSERT INTO public.team_members (name, role, bio, category, display_order) VALUES
('CH SAI PRIYA', 'Faculty Coordinator', 'Guides DATYX academic direction and student mentorship.', 'faculty', 1),
('MARTHINENI SHILPA', 'Faculty Coordinator', 'Oversees club initiatives, research and industry collaboration.', 'faculty', 2);

-- Seed Track Leads
INSERT INTO public.team_members (name, role, bio, category, display_order) VALUES
('ASHOK VALLABHUNI', 'Innovation, Entrepreneurship & Cyber Security Lead', 'Startup Weekend · Innovation Expo · Founder Fireside · Cyber Awareness · Cyber Security Fundamentals', 'track_lead', 1),
('SAI POURNAMI', 'Tech Track Lead', 'Vertex Hack · CodeForge · DevSprint · Open Source Week', 'track_lead', 2),
('SANNITH REDDY', 'Workshops & Hackathons Lead', 'Tech Workshops · Hackathons · Tech Treasure Hunt', 'track_lead', 3),
('BALU SHALINI', 'Data Science Track Lead', 'Data Detective · Model Masters · SQL Game · VizVerse · AI Labs', 'track_lead', 4);

-- Seed Creative & Marketing Leads
INSERT INTO public.team_members (name, role, bio, category, display_order) VALUES
('PONAGANTI MANUPRIYA', 'Interactive Canvas Lead', 'Leads the Interactive Canvas track — creative digital experiences and design experiments.', 'creative_lead', 1),
('DINGARI MANOGNA', 'MotionCraft Lead', 'Leads MotionCraft — motion design, animation and visual storytelling projects.', 'creative_lead', 2),
('SOMISHETTY AKHIL KRISHNA', 'Sketch to Screen Lead', 'Leads Sketch to Screen — turning ideas into UI and interactive prototypes.', 'creative_lead', 3),
('SWAMY VIGNESH', 'Club Marketing Lead', 'Owns club marketing, outreach and community growth across campus.', 'creative_lead', 4);

-- Seed Track Events - Tech Track
INSERT INTO public.track_events (track_key, track_name, track_tag, track_blurb, slug, title, description, difficulty, display_order) VALUES
('tech', 'Tech Track', 'Tech', 'Build, ship and compete on the fundamentals.', 'vertex-hack', 'Vertex Hack', '24-hour innovation hackathon where students solve real-world problems.', 'Advanced', 1),
('tech', 'Tech Track', 'Tech', 'Build, ship and compete on the fundamentals.', 'codeforge', 'CodeForge', 'Competitive coding contest focusing on algorithms and programming.', 'Intermediate', 2),
('tech', 'Tech Track', 'Tech', 'Build, ship and compete on the fundamentals.', 'devsprint', 'DevSprint', 'Fast-paced web and application development competition.', 'Intermediate', 3),
('tech', 'Tech Track', 'Tech', 'Build, ship and compete on the fundamentals.', 'open-source-week', 'Open Source Week', 'Learn Git, GitHub and contribute to open-source projects.', 'Beginner', 4);

-- Seed Track Events - Workshops & Hackathons
INSERT INTO public.track_events (track_key, track_name, track_tag, track_blurb, slug, title, description, difficulty, display_order) VALUES
('workshops', 'Workshops & Hackathons', 'Workshops', 'Hands-on learning and team-based building.', 'tech-workshops', 'Tech Workshops', 'Hands-on learning sessions on trending technologies.', 'Beginner', 5),
('workshops', 'Workshops & Hackathons', 'Workshops', 'Hands-on learning and team-based building.', 'hackathons', 'Hackathons', 'Team-based innovation competitions.', 'Advanced', 6),
('workshops', 'Workshops & Hackathons', 'Workshops', 'Hands-on learning and team-based building.', 'tech-treasure-hunt', 'Tech Treasure Hunt', 'A fun technical puzzle-solving challenge across multiple rounds.', 'Intermediate', 7);

-- Seed Track Events - Innovation & Cyber Security
INSERT INTO public.track_events (track_key, track_name, track_tag, track_blurb, slug, title, description, difficulty, display_order) VALUES
('innovation', 'Innovation & Cyber Security', 'Innovation', 'From startup ideas to secure systems.', 'startup-weekend', 'Startup Weekend', 'Build startup ideas and pitch them to mentors.', 'Intermediate', 8),
('innovation', 'Innovation & Cyber Security', 'Innovation', 'From startup ideas to secure systems.', 'innovation-expo', 'Innovation Expo', 'Showcase innovative technical projects.', 'Beginner', 9),
('innovation', 'Innovation & Cyber Security', 'Innovation', 'From startup ideas to secure systems.', 'founder-fireside', 'Founder Fireside', 'Interactive discussions with startup founders and entrepreneurs.', 'Beginner', 10),
('innovation', 'Innovation & Cyber Security', 'Innovation', 'From startup ideas to secure systems.', 'cyber-awareness', 'Cyber Awareness', 'Learn safe digital practices and cybersecurity awareness.', 'Beginner', 11),
('innovation', 'Innovation & Cyber Security', 'Innovation', 'From startup ideas to secure systems.', 'cyber-security-fundamentals', 'Cyber Security Fundamentals', 'Introduction to ethical hacking and cybersecurity concepts.', 'Intermediate', 12);

-- Seed Track Events - Data Science Track
INSERT INTO public.track_events (track_key, track_name, track_tag, track_blurb, slug, title, description, difficulty, display_order) VALUES
('data', 'Data Science Track', 'Data Science', 'Analyze, model, visualize and automate with data.', 'data-detective', 'Data Detective', 'Real-world data analysis challenge.', 'Intermediate', 13),
('data', 'Data Science Track', 'Data Science', 'Analyze, model, visualize and automate with data.', 'model-masters', 'Model Masters', 'Machine learning competition.', 'Advanced', 14),
('data', 'Data Science Track', 'Data Science', 'Analyze, model, visualize and automate with data.', 'sql-game', 'SQL Game', 'Interactive SQL challenge with increasing difficulty.', 'Beginner', 15),
('data', 'Data Science Track', 'Data Science', 'Analyze, model, visualize and automate with data.', 'vizverse', 'VizVerse', 'Create insightful data visualizations.', 'Intermediate', 16),
('data', 'Data Science Track', 'Data Science', 'Analyze, model, visualize and automate with data.', 'ai-labs', 'AI Labs', 'Hands-on AI and Machine Learning workshops.', 'Advanced', 17);

-- Seed the recurring SQL Quest Live calendar event
INSERT INTO public.events (title, description, event_date, start_time, end_time, venue, category, status) VALUES
('SQL Quest Live', 'Solve levels together, share hints and climb the leaderboard.', CURRENT_DATE + ((13 - EXTRACT(DOW FROM CURRENT_DATE)::integer) % 7 + 1) * INTERVAL '1 day', '16:00:00', '18:00:00', 'Lab 1 / Online', 'Weekly', 'upcoming');

