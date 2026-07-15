import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/hooks/useAccess";
import { Loader2 } from "lucide-react";
import sketchEvents from "@/assets/sketch-events.png";
import sketchCalendar from "@/assets/sketch-calendar.png";
import sketchStudent from "@/assets/sketch-student-easel.png";


type LiveEvent = {
  id: string; title: string; description: string | null; event_date: string | null;
  start_time: string | null; end_time: string | null; venue: string | null;
  category: string | null; registration_link: string | null; status: string; poster_url: string | null;
  organizer: string | null;
};

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events — DATYX" },
      { name: "description", content: "Tech, Workshops & Hackathons, Innovation & Cyber Security and Data Science events at DATYX Club. See the live event calendar." },
      { property: "og:title", content: "Events — DATYX" },
      { property: "og:description", content: "Interactive event calendar and every DATYX track — Tech, Workshops, Innovation, Cyber Security and Data Science." },
    ],
  }),
  component: Events,
});

type TrackEventRow = {
  id: string;
  track_key: string;
  track_name: string;
  track_tag: string;
  track_blurb: string;
  slug: string;
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  display_order: number;
};

export function EventCalendar({ previewEvents = [], adminPreview = false }: { previewEvents?: LiveEvent[]; adminPreview?: boolean } = {}) {
  const { signedIn, hasAccess } = useAccess();
  const [rows, setRows] = useState<LiveEvent[]>([]);
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);

  useEffect(() => {
    if (adminPreview) return;
    supabase.from("events").select("*").order("event_date", { ascending: true })
      .then(({ data }) => setRows((data as LiveEvent[]) || []));
  }, [adminPreview]);

  const allRows = useMemo(() => (adminPreview ? previewEvents : rows), [adminPreview, previewEvents, rows]);


  const byDate = useMemo(() => {
    const m = new Map<string, LiveEvent[]>();
    for (const e of allRows) {
      if (!e.event_date) continue;
      const k = e.event_date; // yyyy-mm-dd
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(e);
    }
    return m;
  }, [allRows]);


  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthName = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  function keyFor(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const selected = selectedKey ? byDate.get(selectedKey) ?? [] : [];

  return (
    <section className={adminPreview ? "" : "mt-14"}>
      {/* Starburst accent above header */}
      <div className="mb-3 flex items-center justify-center gap-3 text-black/70">
        <span className="font-display text-2xl">✦</span>
        <span className="h-px w-16 bg-black/40" />
        <span className="font-display text-3xl">✧</span>
        <span className="h-px w-16 bg-black/40" />
        <span className="font-display text-2xl">✦</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        {/* Sketch calendar — the image IS the calendar */}
        <div className="relative rounded-2xl border-[1.5px] border-black bg-white p-6 shadow-[6px_6px_0_0_rgba(17,17,17,0.9)]">
          {/* Spiral binding */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} className="block h-3 w-3 rounded-full border-[1.5px] border-black bg-white" />
              ))}
            </div>
            <span className="font-display text-2xl">✦</span>
          </div>

          <div className="flex items-end justify-between border-b-[1.5px] border-dashed border-black/70 pb-3">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-accent">
                {adminPreview ? "Admin Preview" : "Live Calendar"}
              </span>
              <h3 className="font-display text-3xl font-bold leading-none">{monthName}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setCursor(new Date(year, month - 1, 1))} className="rounded-full border-[1.5px] border-black bg-white px-3 py-1 text-sm hover:bg-secondary">←</button>
              <button type="button" onClick={() => { const n = new Date(); setCursor(new Date(n.getFullYear(), n.getMonth(), 1)); }} className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white">Today</button>
              <button type="button" onClick={() => setCursor(new Date(year, month + 1, 1))} className="rounded-full border-[1.5px] border-black bg-white px-3 py-1 text-sm hover:bg-secondary">→</button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => <div key={d} className="py-1">{d}</div>)}
          </div>
          <div className="relative mt-1 grid grid-cols-7 gap-[6px]">
            {cells.map((d, i) => {
              if (!d) return <div key={i} className="aspect-square" />;
              const k = keyFor(d);
              const evs = byDate.get(k);
              const isToday = k === todayKey;
              const isSelected = k === selectedKey;
              const isHover = k === hoverKey;
              const hasEvents = evs && evs.length > 0;
              const col = i % 7;
              const popRight = col >= 4; // flip popover on right-side cells
              return (
                <div
                  key={i}
                  className="relative"
                  onMouseEnter={() => hasEvents && setHoverKey(k)}
                  onMouseLeave={() => setHoverKey((cur) => (cur === k ? null : cur))}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedKey(hasEvents ? (isSelected ? null : k) : null)}
                    className={`group relative aspect-square w-full rounded-md border-[1.5px] text-left transition-all
                      ${hasEvents ? "border-black bg-yellow-100 hover:bg-yellow-200 cursor-pointer shadow-[2px_2px_0_0_rgba(17,17,17,0.9)]" : "border-black/30 bg-white text-muted-foreground"}
                      ${isSelected ? "ring-2 ring-black -translate-y-0.5" : ""}
                      ${isToday ? "outline outline-2 outline-offset-1 outline-black" : ""}`}
                  >
                    <span className="absolute left-1.5 top-1 text-xs font-semibold">{d}</span>
                    {hasEvents && (
                      <span className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5">
                        {evs!.slice(0, 3).map((_, j) => <span key={j} className="h-1.5 w-1.5 rounded-full bg-black" />)}
                      </span>
                    )}
                    {isToday && <span className="absolute -right-1 -top-2 font-display text-sm">✧</span>}
                  </button>

                  {/* Hover popover overlay */}
                  {isHover && hasEvents && (
                    <div className={`absolute top-full z-30 mt-2 w-72 sm:w-80 ${popRight ? "right-0" : "left-0"}`}>
                      <div className="relative rounded-2xl border-[1.5px] border-black bg-white p-4 shadow-[6px_6px_0_0_rgba(17,17,17,0.9)]">
                        <span className={`absolute -top-2 ${popRight ? "right-6" : "left-6"} h-3 w-3 rotate-45 border-l-[1.5px] border-t-[1.5px] border-black bg-white`} />
                        <div className="text-[10px] font-mono uppercase tracking-widest text-accent">
                          {new Date(k).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                        </div>
                        <ul className="mt-2 space-y-3 max-h-72 overflow-y-auto pr-1">
                          {evs!.map((e) => (
                            <li key={e.id} className="border-b border-dashed border-black/30 pb-3 last:border-0 last:pb-0">
                              {e.poster_url && <img src={e.poster_url} alt={e.title} className="mb-2 h-24 w-full rounded-lg border-[1.5px] border-black object-cover" loading="lazy" />}
                              <div className="text-[10px] font-mono uppercase tracking-wider text-accent">{e.category || "Event"} · {e.status}</div>
                              <h4 className="mt-0.5 font-display text-base font-semibold leading-tight">{e.title}</h4>
                              {e.description && <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{e.description}</p>}
                              <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                                {e.start_time && <span>🕒 {e.start_time}{e.end_time ? `–${e.end_time}` : ""}</span>}
                                {e.venue && <span>📍 {e.venue}</span>}
                                {e.organizer && <span>👤 {e.organizer}</span>}
                              </div>
                              {!adminPreview && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {!signedIn ? (
                                    <Link to="/auth" className="rounded-full bg-black px-3 py-1 text-[11px] font-semibold text-white hover:opacity-90">Sign in to register</Link>
                                  ) : !hasAccess ? (
                                    <Link to="/register/id" className="rounded-full bg-black px-3 py-1 text-[11px] font-semibold text-white hover:opacity-90">Complete registration</Link>
                                  ) : (
                                    <Link to="/dashboard" className="rounded-full bg-black px-3 py-1 text-[11px] font-semibold text-white hover:opacity-90">Register Now</Link>
                                  )}
                                  {e.registration_link && <a href={e.registration_link} target="_blank" rel="noreferrer" className="rounded-full border-[1.5px] border-black px-3 py-1 text-[11px] font-medium hover:bg-secondary">External ↗</a>}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t-[1.5px] border-dashed border-black/70 pt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-black" /> Programme scheduled</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm outline outline-2 outline-black" /> Today</span>
            <span>Hover a highlighted date for details. Click to pin.</span>
          </div>

          {/* Student illustration beside/below the grid */}
          <div className="pointer-events-none absolute -bottom-6 -right-4 hidden w-40 lg:block">
            <img src={sketchStudent} alt="" aria-hidden loading="lazy" className="w-full" />
          </div>
        </div>

        <div className="rounded-2xl border-[1.5px] border-black bg-white p-5 shadow-[6px_6px_0_0_rgba(17,17,17,0.9)]">

          <div className="text-xs font-medium text-accent">Programme details</div>
          <h3 className="mt-1 font-display text-xl font-bold">
            {selectedKey ? new Date(selectedKey).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) : "Pick a highlighted date"}
          </h3>
          {selected.length === 0 && (
            <div className="mt-4 flex flex-col items-center text-center">
              <img src={sketchCalendar} alt="" aria-hidden loading="lazy" className="w-40 opacity-80" />
              <p className="mt-2 text-sm text-muted-foreground">Highlighted dots mark days with events. Hover a date on the calendar to see what's happening.</p>
            </div>
          )}
          <ul className="mt-4 space-y-3">
            {selected.map((e) => (
              <li key={e.id} className="rounded-xl border-[1.5px] border-black bg-white p-4">
                {e.poster_url && <img src={e.poster_url} alt={e.title} className="mb-3 h-32 w-full rounded-lg object-cover" />}
                <div className="text-[11px] font-mono uppercase tracking-wider text-accent">{e.category || "Event"} · {e.status}</div>
                <h4 className="mt-0.5 font-display text-lg font-semibold">{e.title}</h4>
                {e.description && <p className="mt-1 text-sm text-muted-foreground">{e.description}</p>}
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {e.start_time && <span>🕒 {e.start_time}{e.end_time ? ` – ${e.end_time}` : ""}</span>}
                  {e.venue && <span>📍 {e.venue}</span>}
                  {e.organizer && <span>👤 {e.organizer}</span>}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {!signedIn ? (
                    <Link to="/auth" className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">Sign in to register</Link>
                  ) : !hasAccess ? (
                    <Link to="/register/id" className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">Complete registration</Link>
                  ) : (
                    <Link to="/dashboard" className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">Register (member)</Link>
                  )}
                  {e.registration_link && <a href={e.registration_link} target="_blank" rel="noreferrer" className="rounded-full border-[1.5px] border-black px-4 py-1.5 text-xs font-medium hover:bg-secondary">External link ↗</a>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Events() {
  const { signedIn, hasAccess } = useAccess();
  const [dbEvents, setDbEvents] = useState<TrackEventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTrackEvents() {
      try {
        const { data, error } = await supabase
          .from("track_events")
          .select("*")
          .order("display_order", { ascending: true });

        if (error) {
          throw error;
        }
        setDbEvents((data as TrackEventRow[]) || []);
      } catch (err) {
        console.error("Failed to load track events:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTrackEvents();
  }, []);

  const tracks = useMemo(() => {
    const trackMap = new Map<string, { key: string; name: string; tag: string; blurb: string; events: any[] }>();

    for (const row of dbEvents) {
      if (!trackMap.has(row.track_key)) {
        trackMap.set(row.track_key, {
          key: row.track_key,
          name: row.track_name,
          tag: row.track_tag,
          blurb: row.track_blurb,
          events: [],
        });
      }
      trackMap.get(row.track_key)!.events.push({
        slug: row.slug,
        t: row.title,
        desc: row.description,
        difficulty: row.difficulty,
      });
    }

    return Array.from(trackMap.values());
  }, [dbEvents]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground font-mono">Loading events...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
        <div>
          <span className="text-sm font-medium text-primary">Events</span>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">What's happening at DATYX</h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Explore events across every DATYX track — Tech, Workshops & Hackathons, Innovation & Cyber Security, and Data Science. Open the calendar below to see what's on this month.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {tracks.map((tr) => (
              <a key={tr.key} href={`#${tr.key}`} className="rounded-full border-[1.5px] border-black bg-white px-3 py-1 text-xs font-medium hover:bg-secondary">{tr.name}</a>
            ))}
            <Link to="/entertainment" className="rounded-full border-[1.5px] border-black bg-black px-3 py-1 text-xs font-medium text-white">Every Saturday →</Link>
          </div>
        </div>
        <img src={sketchEvents} alt="Doodle of a calendar and presentation" loading="lazy" width={1024} height={768} className="w-full max-w-sm justify-self-end" />
      </div>

      <EventCalendar />

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
              <div key={e.slug} className="group flex flex-col gap-4 rounded-xl border-[1.5px] border-black bg-white p-6 transition-all hover:shadow-[4px_4px_0_0_rgba(17,17,17,0.9)] sm:flex-row sm:items-center">
                <div className="w-40 shrink-0">
                  <div className="text-sm font-mono text-primary">{tr.tag}</div>
                  <span className="mt-1 inline-flex rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">{e.difficulty}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-semibold">{e.t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{e.desc}</p>
                </div>
                {!signedIn ? (
                  <Link to="/auth" className="rounded-full border-[1.5px] border-black bg-white px-4 py-2 text-sm font-medium hover:bg-secondary">Sign in to register</Link>
                ) : !hasAccess ? (
                  <Link to="/register/id" className="rounded-full border-[1.5px] border-black bg-white px-4 py-2 text-sm font-medium hover:bg-secondary">Complete registration</Link>
                ) : (
                  <Link to="/dashboard" className="rounded-full border-[1.5px] border-black bg-white px-4 py-2 text-sm font-medium hover:bg-secondary">Register (member)</Link>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
