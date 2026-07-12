import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/game")({
  head: () => ({
    meta: [
      { title: "SQL Quest — 100 Level Challenge · DATYX" },
      { name: "description", content: "Learn SQL through a 100-level game — beginner to expert, with XP, coins and a live leaderboard." },
      { property: "og:title", content: "SQL Quest — 100 Level Challenge" },
      { property: "og:description", content: "Play your way from SELECT to window functions across 100 levels." },
    ],
  }),
  component: Game,
});

const tiers = [
  { id: 1, name: "Beginner", range: "Levels 1–25", color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10", topics: ["SELECT", "WHERE", "ORDER BY", "LIMIT"] },
  { id: 2, name: "Intermediate", range: "Levels 26–50", color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10", topics: ["GROUP BY", "HAVING", "Aggregates", "Basic JOINs"] },
  { id: 3, name: "Advanced", range: "Levels 51–75", color: "text-orange-400 border-orange-400/30 bg-orange-400/10", topics: ["INNER / LEFT / RIGHT JOIN", "Subqueries", "CASE", "Nested"] },
  { id: 4, name: "Expert", range: "Levels 76–100", color: "text-red-400 border-red-400/30 bg-red-400/10", topics: ["Window functions", "CTEs", "Complex joins", "Analytics"] },
];

function Game() {
  return (
    <div>
      <section className="relative overflow-hidden bg-hero">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">🎮 GAME MODE</span>
          <h1 className="mt-4 font-display text-5xl font-bold sm:text-6xl">SQL Quest — <span className="text-gradient">100 Level Challenge</span></h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">Master SQL from zero to expert. Solve real problems, earn XP, unlock levels and climb the global leaderboard.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/auth" className="rounded-lg bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90">
              Sign in to play →
            </Link>
            <a href="#tiers" className="rounded-lg border border-border bg-surface-elevated px-6 py-3 text-sm font-semibold hover:bg-secondary">See the tiers</a>
          </div>
        </div>
      </section>

      <section id="tiers" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {tiers.map((t) => (
            <div key={t.id} className="rounded-xl border border-border bg-surface p-6">
              <div className="flex items-center justify-between">
                <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${t.color}`}>{t.name}</span>
                <span className="text-xs text-muted-foreground">{t.range}</span>
              </div>
              <h3 className="mt-4 font-display text-2xl font-bold">Tier {t.id} · {t.name}</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {t.topics.map((tp) => (
                  <li key={tp} className="rounded-md bg-secondary px-2 py-1 font-mono text-xs">{tp}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border/60 bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold">Level map</h2>
          <p className="mt-2 text-muted-foreground">A peek at what's ahead. Sign in to start unlocking.</p>
          <div className="mt-8 grid grid-cols-5 gap-3 sm:grid-cols-10">
            {Array.from({ length: 100 }, (_, i) => {
              const n = i + 1;
              const tier = n <= 25 ? "emerald" : n <= 50 ? "yellow" : n <= 75 ? "orange" : "red";
              const color = {
                emerald: "border-emerald-400/30 text-emerald-300",
                yellow: "border-yellow-400/30 text-yellow-300",
                orange: "border-orange-400/30 text-orange-300",
                red: "border-red-400/30 text-red-300",
              }[tier];
              return (
                <div key={n} className={`group aspect-square rounded-md border ${color} bg-background/60 grid place-items-center text-xs font-mono relative overflow-hidden`}>
                  <span className="opacity-70 group-hover:opacity-0 transition-opacity">{n}</span>
                  <Lock className="h-3.5 w-3.5 absolute opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl font-bold">Coming next: <span className="text-gradient">in-browser SQL runner</span></h2>
        <p className="mt-3 text-muted-foreground">Real SQL execution with SQLite WASM, hints after 2 fails, XP, coins and a leaderboard. Create your account so your progress saves the moment it drops.</p>
        <Link to="/auth" className="mt-8 inline-flex rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">Create free account</Link>
      </section>
    </div>
  );
}
