import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { loadProgress, highestUnlocked, type Progress } from "@/lib/sql-quest/progress";
import { LEVELS, LEVEL_COUNT_TOTAL } from "@/lib/sql-quest/levels";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — DATYX" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

type EventRow = { id: string; title: string; description: string | null; event_date: string | null; start_time: string | null; venue: string | null; category: string | null; registration_link: string | null; status: string };
type Registration = { id: string; event_slug: string; event_title: string; category: string | null; created_at: string };
type Announcement = { id: string; title: string; body: string; created_at: string };

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<Progress>({ cleared: {}, xp: 0 });
  const [events, setEvents] = useState<EventRow[]>([]);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    setProgress(loadProgress());
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAll() {
    const [ev, rg, an] = await Promise.all([
      supabase.from("events").select("*").in("status", ["upcoming", "live"]).order("event_date", { ascending: true }).limit(6),
      supabase.from("event_registrations").select("*").order("created_at", { ascending: false }),
      supabase.from("announcements").select("*").eq("published", true).order("created_at", { ascending: false }).limit(5),
    ]);
    setEvents((ev.data as EventRow[]) || []);
    setRegs((rg.data as Registration[]) || []);
    setAnnouncements((an.data as Announcement[]) || []);
  }

  async function registerForEvent(e: EventRow) {
    const { data: sess } = await supabase.auth.getUser();
    if (!sess.user) return;
    const slug = e.id;
    const { error } = await supabase.from("event_registrations").insert({
      user_id: sess.user.id, event_slug: slug, event_title: e.title, category: e.category,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`Registered for ${e.title}`);
    loadAll();
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const name = (user?.user_metadata?.full_name as string | undefined) || user?.email?.split("@")[0] || "member";
  const cleared = Object.keys(progress.cleared).length;
  const nextLevel = Math.min(highestUnlocked(progress), LEVELS.length);
  const registeredIds = new Set(regs.map((r) => r.event_slug));

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="text-sm font-medium text-accent">Member Dashboard</span>
          <h1 className="mt-2 font-display text-4xl font-bold">Welcome, {name} 👋</h1>
          <p className="mt-2 text-muted-foreground">Your DATYX home — events, announcements, and SQL Quest progress.</p>
        </div>
        <button onClick={signOut} className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">Logout</button>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <Card title="Total XP" value={String(progress.xp)} hint="Clear levels to earn XP" />
        <Card title="Levels cleared" value={`${cleared} / ${LEVEL_COUNT_TOTAL}`} hint={`${LEVELS.length} seeded so far`} />
        <Card title="Registered events" value={String(regs.length)} hint="Your upcoming registrations" />
      </div>

      <Section title="Announcements">
        {announcements.length === 0 ? <Empty>No announcements yet.</Empty> : (
          <ul className="space-y-3">
            {announcements.map((a) => (
              <li key={a.id} className="rounded-xl border border-border bg-surface p-4 shadow-card">
                <div className="font-semibold">{a.title}</div>
                <div className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{a.body}</div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Upcoming Events">
        {events.length === 0 ? <Empty>No events published yet. Check back soon!</Empty> : (
          <div className="grid gap-4 sm:grid-cols-2">
            {events.map((e) => (
              <div key={e.id} className="rounded-xl border border-border bg-surface p-5 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-accent">{e.category || "Event"} · {e.status}</div>
                    <div className="mt-1 font-display text-lg font-semibold">{e.title}</div>
                  </div>
                </div>
                {e.description && <p className="mt-2 text-sm text-muted-foreground">{e.description}</p>}
                <div className="mt-3 text-xs text-muted-foreground">
                  {e.event_date && <span>{e.event_date}</span>} {e.start_time && <span>· {e.start_time}</span>} {e.venue && <span>· {e.venue}</span>}
                </div>
                <div className="mt-4 flex gap-2">
                  {registeredIds.has(e.id) ? (
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">Registered ✓</span>
                  ) : (
                    <button onClick={() => registerForEvent(e)} className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">Register</button>
                  )}
                  {e.registration_link && <a href={e.registration_link} target="_blank" rel="noreferrer" className="rounded-full border border-border px-4 py-1.5 text-xs font-medium hover:bg-secondary">External link ↗</a>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Registered Events">
        {regs.length === 0 ? <Empty>You haven't registered for any events yet.</Empty> : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface shadow-card">
            {regs.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <div className="font-medium">{r.event_title}</div>
                  <div className="text-xs text-muted-foreground">{r.category || "—"} · registered {new Date(r.created_at).toLocaleDateString()}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Continue SQL Quest">
        <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-display text-lg font-semibold">Level {nextLevel} is ready</div>
              <div className="text-sm text-muted-foreground">Pick up where you left off.</div>
            </div>
            <div className="flex gap-2">
              <Link to="/play/$levelId" params={{ levelId: String(nextLevel) }} className="rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90">▶ Play</Link>
              <Link to="/game" className="rounded-full border border-border px-5 py-2 text-sm font-semibold hover:bg-secondary">Level map</Link>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Profile">
        <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <Row k="Name" v={name} />
            <Row k="Email" v={user?.email || "—"} />
            <Row k="Member since" v={user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"} />
            <Row k="Provider" v={(user?.app_metadata?.provider as string) || "email"} />
          </div>
        </div>
      </Section>
    </div>
  );
}

function Card({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="mt-2 font-display text-3xl font-bold text-gradient">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">{children}</div>;
}
function Row({ k, v }: { k: string; v: string }) {
  return <div><div className="text-xs uppercase tracking-wide text-muted-foreground">{k}</div><div className="mt-0.5 font-medium">{v}</div></div>;
}
