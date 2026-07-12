import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Team — DATYX" },
      { name: "description", content: "Meet the DATYX core team leading workshops, projects and community." },
      { property: "og:title", content: "Team — DATYX" },
      { property: "og:description", content: "Meet the DATYX core team." },
    ],
  }),
  component: Team,
});

const team = [
  { n: "Aarav Patel", r: "President", b: "ML engineer in the making. Runs DATYX Hack." },
  { n: "Isha Sharma", r: "VP · SQL Quest Lead", b: "Designs the 100-level curriculum." },
  { n: "Rohan Verma", r: "Head of Workshops", b: "Weekly Python & ML deep-dives." },
  { n: "Diya Nair", r: "Design & Community", b: "Keeps DATYX beautiful and welcoming." },
  { n: "Kabir Khan", r: "Projects Lead", b: "Ships open-source data tools." },
  { n: "Meera Iyer", r: "Outreach", b: "Alumni network + mentor program." },
];

function Team() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <span className="text-sm font-medium text-primary">Team</span>
      <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">The people behind DATYX</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">A small crew of students obsessed with data, learning and building things worth shipping.</p>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {team.map((m) => (
          <div key={m.n} className="rounded-xl border border-border bg-surface p-6">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-primary to-accent font-display text-lg font-bold text-primary-foreground shadow-glow">
              {m.n.split(" ").map((s) => s[0]).join("")}
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">{m.n}</h3>
            <div className="text-sm text-primary">{m.r}</div>
            <p className="mt-2 text-sm text-muted-foreground">{m.b}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
