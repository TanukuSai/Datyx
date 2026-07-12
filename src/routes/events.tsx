import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events — DATYX" },
      { name: "description", content: "Workshops, hackathons and speaker sessions hosted by DATYX Club." },
      { property: "og:title", content: "Events — DATYX" },
      { property: "og:description", content: "Workshops, hackathons and speaker sessions." },
    ],
  }),
  component: Events,
});

const events = [
  { d: "Every Sat · 4pm", t: "SQL Quest Live", tag: "Weekly", desc: "Solve levels together, share hints and climb the leaderboard." },
  { d: "Apr 12", t: "Intro to Pandas", tag: "Workshop", desc: "Data wrangling from CSV to insight — beginner friendly." },
  { d: "Apr 26", t: "Kaggle Kickoff", tag: "Challenge", desc: "Team up and submit your first ML solution together." },
  { d: "May 10", t: "LLMs in Production", tag: "Talk", desc: "Guest engineer walks through a real RAG deployment." },
  { d: "May 24–25", t: "DATYX Hack 24", tag: "Hackathon", desc: "24-hour build sprint. Data + AI. Big prizes." },
];

function Events() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
      <span className="text-sm font-medium text-primary">Events</span>
      <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">What's happening at DATYX</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">Workshops, talks, hackathons and weekly game sessions. Members get first access.</p>

      <div className="mt-12 space-y-4">
        {events.map((e) => (
          <div key={e.t} className="group flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 transition-all hover:border-primary/40 sm:flex-row sm:items-center">
            <div className="w-40 shrink-0">
              <div className="text-sm font-mono text-primary">{e.d}</div>
              <span className="mt-1 inline-flex rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">{e.tag}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-display text-lg font-semibold">{e.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{e.desc}</p>
            </div>
            <button className="rounded-md border border-primary/40 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10">RSVP</button>
          </div>
        ))}
      </div>
    </div>
  );
}
