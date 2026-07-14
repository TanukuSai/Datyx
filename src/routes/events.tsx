import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type LiveEvent = { id: string; title: string; description: string | null; event_date: string | null; start_time: string | null; venue: string | null; category: string | null; registration_link: string | null; status: string; poster_url: string | null };

function LiveEvents() {
  const [rows, setRows] = useState<LiveEvent[]>([]);
  useEffect(() => {
    supabase.from("events").select("*").in("status", ["upcoming", "live"]).order("event_date", { ascending: true }).then(({ data }) => setRows((data as LiveEvent[]) || []));
  }, []);
  if (rows.length === 0) return null;
  return (
    <section className="mt-10">
      <span className="text-sm font-medium text-accent">Live from Admin</span>
      <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">Upcoming & Live Events</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {rows.map((e) => (
          <div key={e.id} className="rounded-xl border border-border bg-surface p-5 shadow-card">
            {e.poster_url && <img src={e.poster_url} alt={e.title} className="mb-3 h-40 w-full rounded-lg object-cover" />}
            <div className="text-xs text-accent">{e.category || "Event"} · {e.status}</div>
            <h3 className="mt-1 font-display text-lg font-semibold">{e.title}</h3>
            {e.description && <p className="mt-1 text-sm text-muted-foreground">{e.description}</p>}
            <div className="mt-2 text-xs text-muted-foreground">
              {e.event_date && <span>{e.event_date}</span>}{e.start_time && <span> · {e.start_time}</span>}{e.venue && <span> · {e.venue}</span>}
            </div>
            <div className="mt-3 flex gap-2">
              <Link to="/dashboard" className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">Register (member)</Link>
              {e.registration_link && <a href={e.registration_link} target="_blank" rel="noreferrer" className="rounded-full border border-border px-4 py-1.5 text-xs font-medium hover:bg-secondary">External link ↗</a>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}


export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events — DATYX" },
      { name: "description", content: "Tech, Workshops & Hackathons, Innovation & Cyber Security and Data Science events at DATYX Club." },
      { property: "og:title", content: "Events — DATYX" },
      { property: "og:description", content: "Explore DATYX events across Tech, Workshops, Innovation, Cyber Security and Data Science tracks." },
    ],
  }),
  component: Events,
});

type EventItem = { slug: string; t: string; desc: string; difficulty: "Beginner" | "Intermediate" | "Advanced" };
type Track = { key: string; name: string; tag: string; blurb: string; events: EventItem[] };

const tracks: Track[] = [
  {
    key: "tech",
    name: "Tech Track",
    tag: "Tech",
    blurb: "Build, ship and compete on the fundamentals.",
    events: [
      { slug: "vertex-hack", t: "Vertex Hack", desc: "24-hour innovation hackathon where students solve real-world problems.", difficulty: "Advanced" },
      { slug: "codeforge", t: "CodeForge", desc: "Competitive coding contest focusing on algorithms and programming.", difficulty: "Intermediate" },
      { slug: "devsprint", t: "DevSprint", desc: "Fast-paced web and application development competition.", difficulty: "Intermediate" },
      { slug: "open-source-week", t: "Open Source Week", desc: "Learn Git, GitHub and contribute to open-source projects.", difficulty: "Beginner" },
    ],
  },
  {
    key: "workshops",
    name: "Workshops & Hackathons",
    tag: "Workshops",
    blurb: "Hands-on learning and team-based building.",
    events: [
      { slug: "tech-workshops", t: "Tech Workshops", desc: "Hands-on learning sessions on trending technologies.", difficulty: "Beginner" },
      { slug: "hackathons", t: "Hackathons", desc: "Team-based innovation competitions.", difficulty: "Advanced" },
      { slug: "tech-treasure-hunt", t: "Tech Treasure Hunt", desc: "A fun technical puzzle-solving challenge across multiple rounds.", difficulty: "Intermediate" },
    ],
  },
  {
    key: "innovation",
    name: "Innovation & Cyber Security",
    tag: "Innovation",
    blurb: "From startup ideas to secure systems.",
    events: [
      { slug: "startup-weekend", t: "Startup Weekend", desc: "Build startup ideas and pitch them to mentors.", difficulty: "Intermediate" },
      { slug: "innovation-expo", t: "Innovation Expo", desc: "Showcase innovative technical projects.", difficulty: "Beginner" },
      { slug: "founder-fireside", t: "Founder Fireside", desc: "Interactive discussions with startup founders and entrepreneurs.", difficulty: "Beginner" },
      { slug: "cyber-awareness", t: "Cyber Awareness", desc: "Learn safe digital practices and cybersecurity awareness.", difficulty: "Beginner" },
      { slug: "cyber-security-fundamentals", t: "Cyber Security Fundamentals", desc: "Introduction to ethical hacking and cybersecurity concepts.", difficulty: "Intermediate" },
    ],
  },
  {
    key: "data",
    name: "Data Science Track",
    tag: "Data Science",
    blurb: "Analyze, model, visualize and automate with data.",
    events: [
      { slug: "data-detective", t: "Data Detective", desc: "Real-world data analysis challenge.", difficulty: "Intermediate" },
      { slug: "model-masters", t: "Model Masters", desc: "Machine learning competition.", difficulty: "Advanced" },
      { slug: "sql-game", t: "SQL Game", desc: "Interactive SQL challenge with increasing difficulty.", difficulty: "Beginner" },
      { slug: "vizverse", t: "VizVerse", desc: "Create insightful data visualizations.", difficulty: "Intermediate" },
      { slug: "ai-labs", t: "AI Labs", desc: "Hands-on AI and Machine Learning workshops.", difficulty: "Advanced" },
    ],
  },
];

function Events() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <span className="text-sm font-medium text-primary">Events</span>
      <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">What's happening at DATYX</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Explore events across every DATYX track — Tech, Workshops & Hackathons, Innovation & Cyber Security, and Data Science.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {tracks.map((tr) => (
          <a key={tr.key} href={`#${tr.key}`} className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground">
            {tr.name}
          </a>
        ))}
        <Link to="/entertainment" className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20">
          Every Saturday →
        </Link>
      </div>

      <LiveEvents />

      {tracks.map((tr) => (
        <section id={tr.key} key={tr.key} className="mt-14 scroll-mt-24">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="text-sm font-medium text-primary">{tr.tag}</span>
              <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{tr.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{tr.blurb}</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {tr.events.map((e) => (
              <div key={e.slug} className="group flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 transition-all hover:border-primary/40 sm:flex-row sm:items-center">
                <div className="w-40 shrink-0">
                  <div className="text-sm font-mono text-primary">{tr.tag}</div>
                  <span className="mt-1 inline-flex rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">
                    {e.difficulty}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-semibold">{e.t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{e.desc}</p>
                </div>
                <Link
                  to="/auth"
                  className="rounded-md border border-primary/40 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10"
                >
                  Register
                </Link>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
