import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { loadProgress, highestUnlocked, type Progress } from "@/lib/sql-quest/progress";
import { LEVELS, LEVEL_COUNT_TOTAL } from "@/lib/sql-quest/levels";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — DATYX" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<Progress>({ cleared: {}, xp: 0 });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    setProgress(loadProgress());
  }, []);

  const name = (user?.user_metadata?.full_name as string | undefined) || user?.email?.split("@")[0] || "member";
  const cleared = Object.keys(progress.cleared).length;
  const nextLevel = Math.min(highestUnlocked(progress), LEVELS.length);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <span className="text-sm font-medium text-primary">Dashboard</span>
      <h1 className="mt-2 font-display text-4xl font-bold">Welcome, {name} 👋</h1>
      <p className="mt-2 text-muted-foreground">Pick up where you left off in SQL Quest.</p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <Card title="Total XP" value={String(progress.xp)} hint="Clear levels to earn XP" />
        <Card title="Levels cleared" value={`${cleared} / ${LEVEL_COUNT_TOTAL}`} hint={`${LEVELS.length} seeded so far`} />
        <Card title="Next level" value={`#${nextLevel}`} hint="Ready to play" />
      </div>

      <div className="mt-8 rounded-xl border border-border bg-surface p-8">
        <h2 className="font-display text-2xl font-bold">Continue your journey</h2>
        <p className="mt-2 text-muted-foreground">Jump straight into your next SQL challenge.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/play/$levelId" params={{ levelId: String(nextLevel) }} className="rounded-lg bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90">
            ▶ Play Level {nextLevel}
          </Link>
          <Link to="/game" className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary">Level map</Link>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="mt-2 font-display text-3xl font-bold text-gradient">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}
