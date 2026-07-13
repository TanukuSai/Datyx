import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Team — DATYX" },
      { name: "description", content: "Meet the DATYX faculty coordinators, club leads and student track leads." },
      { property: "og:title", content: "Team — DATYX" },
      { property: "og:description", content: "Faculty coordinators, club leads and student track leads driving DATYX." },
    ],
  }),
  component: Team,
});

const faculty = [
  { n: "CH Sai Priya", r: "Faculty Coordinator", b: "Guides DATYX academic direction and student mentorship." },
  { n: "Marthineni Shilpa", r: "Faculty Coordinator", b: "Oversees club initiatives, research and industry collaboration." },
];

const clubLeads = [
  { n: "CH Sai Priya", r: "2nd Year Club Lead", b: "Anchors DATYX programming for 2nd year members." },
  { n: "Marthineni Shilpa", r: "3rd Year Club Lead", b: "Drives DATYX activities for 3rd year members." },
];

const trackLeads = [
  {
    n: "Sai Pournami",
    r: "Tech Track Lead",
    b: "Vertex Hack · CodeForge · DevSprint · Open Source Week",
  },
  {
    n: "Sannith Reddy",
    r: "Workshops & Hackathons Lead",
    b: "Tech Workshops · Hackathons · Tech Treasure Hunt",
  },
  {
    n: "Ashok Vallabhuni",
    r: "Innovation, Entrepreneurship & Cyber Security Lead",
    b: "Startup Weekend · Innovation Expo · Founder Fireside · Cyber Awareness · Cyber Security Fundamentals",
  },
  {
    n: "Balu Shalini",
    r: "Data Science Track Lead",
    b: "Data Detective · Model Masters · SQL Game · VizVerse · AI Labs",
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Card({ n, r, b }: { n: string; r: string; b: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-primary to-accent font-display text-lg font-bold text-primary-foreground shadow-glow">
        {initials(n)}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold">{n}</h3>
      <div className="text-sm text-primary">{r}</div>
      <p className="mt-2 text-sm text-muted-foreground">{b}</p>
    </div>
  );
}

function Section({ label, title, sub, items }: { label: string; title: string; sub?: string; items: { n: string; r: string; b: string }[] }) {
  return (
    <section className="mt-14">
      <span className="text-sm font-medium text-primary">{label}</span>
      <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{title}</h2>
      {sub ? <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{sub}</p> : null}
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((m) => <Card key={m.n + m.r} {...m} />)}
      </div>
    </section>
  );
}

function Team() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <span className="text-sm font-medium text-primary">Team</span>
      <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">The people behind DATYX</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Faculty coordinators, club leads and student track leads shaping every workshop, hackathon and Saturday activity at DATYX.
      </p>

      <Section label="Faculty" title="Faculty Coordinators" items={faculty} />
      <Section label="Leadership" title="Club Leads" items={clubLeads} />
      <Section label="Tracks" title="Student Track Leads" sub="Each lead owns a track and the events that run under it." items={trackLeads} />
    </div>
  );
}
