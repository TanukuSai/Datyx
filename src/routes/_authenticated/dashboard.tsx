import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

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
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const name = (user?.user_metadata?.full_name as string | undefined) || user?.email?.split("@")[0] || "member";

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <span className="text-sm font-medium text-primary">Dashboard</span>
      <h1 className="mt-2 font-display text-4xl font-bold">Welcome, {name} 👋</h1>
      <p className="mt-2 text-muted-foreground">You're signed in. Start SQL Quest or explore upcoming events.</p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <Card title="Your XP" value="0" hint="Play SQL Quest to earn XP" />
        <Card title="Levels cleared" value="0 / 100" hint="Start with Level 1" />
        <Card title="Coins" value="0" hint="Redeem for hints" />
      </div>

      <div className="mt-8 rounded-xl border border-border bg-surface p-8">
        <h2 className="font-display text-2xl font-bold">Continue your journey</h2>
        <p className="mt-2 text-muted-foreground">The SQL Quest engine is launching soon. Explore the level map now.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/game" className="rounded-lg bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90">Open SQL Quest →</Link>
          <Link to="/events" className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary">See events</Link>
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
