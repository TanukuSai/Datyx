import { createFileRoute, Link } from "@tanstack/react-router";
import { Database, Trophy, Zap, Users, Code2, LineChart } from "lucide-react";
import logoAsset from "@/assets/logo.jpeg";
import sketchCommunity from "@/assets/sketch-community.png";
import sketchRocket from "@/assets/sketch-rocket.png";


export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-xl text-center lg:mx-0 lg:text-left">
            <img src={logoAsset} alt="DATYX Data Science Club" className="mx-auto mb-6 h-20 w-20 rounded-full bg-white shadow-glow ring-2 ring-primary/40 lg:mx-0" />
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Future Innovations · Data Science Club
            </span>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl">
              Turn data into <span className="text-gradient">superpower</span>.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              DATYX is a student community where you master SQL, Python and ML through gamified challenges, real projects and weekly workshops.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link to="/game" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
                🎮 Play SQL Quest
              </Link>
              <Link to="/auth" className="rounded-full border-[1.5px] border-black bg-white px-6 py-3 text-sm font-semibold hover:bg-secondary">
                Join the club →
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground lg:justify-start">
              <Stat n="0" l="Workshops" />
              <Stat n="0" l="SQL Games" />
              <Stat n="0" l="Members" />
              <Stat n="0" l="Live Projects" />
            </div>
          </div>
          <div className="relative mx-auto flex w-full max-w-md items-center justify-center lg:mx-0 lg:max-w-none lg:justify-self-end">
            <span className="pointer-events-none absolute -left-2 -top-2 font-display text-3xl text-black/70">✦</span>
            <img
              src={sketchCommunity}
              alt="Hand-drawn doodle of students collaborating with data"
              className="w-full max-w-md lg:max-w-lg"
            />
            <span className="pointer-events-none absolute -right-1 -bottom-1 font-display text-2xl text-black/60">✧</span>
          </div>
        </div>
      </section>


      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Built for the next generation of data thinkers</h2>
          <p className="mt-3 text-muted-foreground">Everything you need to go from zero to job-ready in data science.</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Feature icon={<Database className="h-5 w-5" />} title="SQL Quest — 100 Levels" desc="Beginner → Expert. Real datasets, XP, coins, and a live leaderboard." />
          <Feature icon={<Zap className="h-5 w-5" />} title="Weekly Workshops" desc="Hands-on sessions on Python, ML, deep learning and analytics tools." />
          <Feature icon={<Trophy className="h-5 w-5" />} title="Hackathons & Battles" desc="Team up, solve real data problems, win prizes and recognition." />
          <Feature icon={<Code2 className="h-5 w-5" />} title="Open-source Projects" desc="Contribute to club projects and build a portfolio that hires notice." />
          <Feature icon={<LineChart className="h-5 w-5" />} title="Real Datasets" desc="Practise on messy, real-world data — not toy CSVs." />
          <Feature icon={<Users className="h-5 w-5" />} title="Mentor Network" desc="Get 1:1 guidance from seniors, alumni and industry mentors." />
        </div>
      </section>

      {/* Game CTA */}
      <section className="border-y border-border/60 bg-surface">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 md:items-center lg:px-8">
          <div>
            <span className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">🚀 Now Playable</span>
            <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">SQL Quest — 100 Level Challenge</h2>
            <p className="mt-3 text-muted-foreground">
              A game-first way to learn SQL. Solve puzzles across 4 tiers — Beginner, Intermediate, Advanced and Expert — with hints, XP and a global leaderboard.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              <Bullet>🟢 Levels 1–25 — SELECT, WHERE, ORDER BY</Bullet>
              <Bullet>🟡 Levels 26–50 — GROUP BY, JOINs, Aggregates</Bullet>
              <Bullet>🟠 Levels 51–75 — Subqueries, CASE, complex JOINs</Bullet>
              <Bullet>🔴 Levels 76–100 — Window functions, CTEs, analytics</Bullet>
            </ul>
            <Link to="/game" className="mt-8 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
              Enter the arena →
            </Link>
          </div>
          <div className="rounded-xl border border-border bg-background p-6 shadow-card">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <span className="h-3 w-3 rounded-full bg-destructive/70" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <span className="h-3 w-3 rounded-full bg-primary/70" />
              <span className="ml-2 text-xs text-muted-foreground">level_07.sql</span>
            </div>
            <pre className="mt-4 overflow-x-auto text-sm font-mono leading-relaxed">
{`-- 🟢 Level 7 · Beginner
-- Get orders between 3000 and 7000

SELECT id, user_id, amount
FROM   Orders
WHERE  amount BETWEEN 3000 AND 7000
ORDER  BY amount DESC;`}
            </pre>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="rounded-md bg-primary/15 px-2 py-1 text-primary">+20 XP</span>
              <span className="text-muted-foreground">Next: Level 8 unlocked</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto grid max-w-5xl gap-8 px-4 py-24 md:grid-cols-[1fr_1.4fr] md:items-center sm:px-6 lg:px-8">
        <img src={sketchRocket} alt="Doodle rocket launching upward" loading="lazy" className="w-full max-w-[220px] justify-self-center" />
        <div className="text-center md:text-left">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Ready to join <span className="text-gradient">DATYX</span>?</h2>
          <p className="mt-3 text-muted-foreground">Create your account with email or Google. It takes 30 seconds.</p>
          <Link to="/auth" className="mt-8 inline-flex rounded-full bg-black px-8 py-3 text-sm font-semibold text-white hover:opacity-90">
            Create account
          </Link>
        </div>
      </section>

    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-display text-2xl font-bold text-foreground">{n}</span>
      <span>{l}</span>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="group rounded-xl border border-border bg-surface p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow">
      <div className="inline-flex rounded-lg bg-primary/15 p-2.5 text-primary">{icon}</div>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return <li className="flex gap-2 text-muted-foreground"><span>{children}</span></li>;
}
