import { createFileRoute, Link } from "@tanstack/react-router";
import sketchCoder from "@/assets/sketch-coder.png";
import { useEffect, useState } from "react";
import { Lock, Check, ShieldAlert } from "lucide-react";
import { LEVELS, LEVEL_COUNT_TOTAL } from "@/lib/sql-quest/levels";
import { loadProgress, isUnlocked, type Progress } from "@/lib/sql-quest/progress";
import { useAccess } from "@/hooks/useAccess";

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
  { id: 1, name: "Beginner", range: "Levels 1–25", color: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10", topics: ["SELECT", "WHERE", "ORDER BY", "LIMIT"] },
  { id: 2, name: "Intermediate", range: "Levels 26–50", color: "text-yellow-300 border-yellow-400/30 bg-yellow-400/10", topics: ["GROUP BY", "HAVING", "Aggregates", "Basic JOINs"] },
  { id: 3, name: "Advanced", range: "Levels 51–75", color: "text-orange-300 border-orange-400/30 bg-orange-400/10", topics: ["INNER / LEFT / RIGHT JOIN", "Subqueries", "CASE", "Nested"] },
  { id: 4, name: "Expert", range: "Levels 76–100", color: "text-red-300 border-red-400/30 bg-red-400/10", topics: ["Window functions", "CTEs", "Complex joins", "Analytics"] },
];

function Game() {
  const { loading: accessLoading, signedIn, hasAccess } = useAccess();
  const [progress, setProgress] = useState<Progress>({ cleared: {}, xp: 0 });

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const seeded = LEVELS.length;

  return (
    <div>
      <section className="relative overflow-hidden bg-hero">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:px-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">🎮 GAME MODE</span>
            <h1 className="mt-4 font-display text-5xl font-bold sm:text-6xl">SQL Quest — <span className="text-gradient">100 Level Challenge</span></h1>
            <p className="mt-4 max-w-xl text-muted-foreground">Real SQL in your browser. {seeded} live levels seeded, {LEVEL_COUNT_TOTAL - seeded} more on the roadmap. Solve, earn XP, unlock the next.</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {hasAccess ? (
                <Link to="/play/$levelId" params={{ levelId: "1" }} className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:opacity-90">
                  ▶ Start Level 1
                </Link>
              ) : signedIn ? (
                <Link to="/dashboard" className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:opacity-90">
                  Complete registration →
                </Link>
              ) : (
                <Link to="/auth" className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:opacity-90">
                  Sign in to play →
                </Link>
              )}
              <a href="#tiers" className="rounded-full border-[1.5px] border-black bg-white px-6 py-3 text-sm font-semibold hover:bg-secondary">See the tiers</a>
            </div>

            {/* Verification banner for signed-in but unverified users */}
            {signedIn && !hasAccess && !accessLoading && (
              <div className="mt-6 flex items-start gap-3 rounded-lg border border-amber-300/40 bg-amber-50 p-4">
                <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Profile verification required</p>
                  <p className="mt-0.5 text-xs text-amber-700">Only verified DATYX members can play SQL Quest. Complete your registration and wait for admin approval to unlock the game.</p>
                </div>
              </div>
            )}
          </div>
          <img src={sketchCoder} alt="Doodle of a coder at a computer" loading="lazy" width={1024} height={768} className="w-full max-w-md justify-self-center lg:justify-self-end" />
        </div>
      </section>



      <section id="tiers" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
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
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold">Level map</h2>
              <p className="mt-1 text-sm text-muted-foreground">Green = cleared · Purple = playable · Grey = locked or coming soon.</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              XP: <span className="font-mono text-foreground">{progress.xp}</span>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-5 gap-3 sm:grid-cols-10">
            {Array.from({ length: LEVEL_COUNT_TOTAL }, (_, i) => {
              const n = i + 1;
              const seed = LEVELS.find((l) => l.id === n);
              const cleared = Boolean(progress.cleared[n]);
              const unlocked = seed && isUnlocked(n, progress);
              const state = !seed ? "future" : cleared ? "cleared" : unlocked ? "open" : "locked";
              return (
                <LevelTile key={n} n={n} state={state} hasAccess={hasAccess} />
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function LevelTile({ n, state, hasAccess }: { n: number; state: "cleared" | "open" | "locked" | "future"; hasAccess: boolean }) {
  const cls = {
    cleared: "border-emerald-400/40 text-emerald-300 bg-emerald-400/10",
    open: "border-primary/50 text-primary bg-primary/10 hover:bg-primary/20",
    locked: "border-border text-muted-foreground bg-background/60",
    future: "border-border/60 text-muted-foreground/60 bg-background/40",
  }[state];
  const clickable = hasAccess && (state === "open" || state === "cleared");
  const inner = (
    <div className={`group aspect-square rounded-md border ${cls} grid place-items-center text-xs font-mono relative overflow-hidden ${clickable ? "cursor-pointer" : ""}`}>
      {state === "cleared" ? <Check className="h-3.5 w-3.5" /> : state === "locked" || state === "future" ? <Lock className="h-3.5 w-3.5 opacity-60" /> : <span>{n}</span>}
      {clickable && <span className="absolute inset-0 hidden items-center justify-center text-[10px] font-semibold uppercase tracking-wider group-hover:flex">Play</span>}
    </div>
  );
  if (!clickable) return inner;
  return (
    <Link to="/play/$levelId" params={{ levelId: String(n) }}>{inner}</Link>
  );
}
