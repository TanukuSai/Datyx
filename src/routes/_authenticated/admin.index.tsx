import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [counts, setCounts] = useState({ events: 0, messages: 0, announcements: 0, gallery: 0 });
  useEffect(() => {
    (async () => {
      const [e, m, a, g] = await Promise.all([
        supabase.from("events").select("id", { count: "exact", head: true }),
        supabase.from("contact_messages").select("id", { count: "exact", head: true }),
        supabase.from("announcements").select("id", { count: "exact", head: true }),
        supabase.from("gallery").select("id", { count: "exact", head: true }),
      ]);
      setCounts({
        events: e.count || 0, messages: m.count || 0, announcements: a.count || 0, gallery: g.count || 0,
      });
    })();
  }, []);

  return (
    <div>
      <h2 className="font-display text-2xl font-bold">Dashboard</h2>
      <p className="mt-1 text-sm text-muted-foreground">Overview of DATYX content and messages.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Events" value={counts.events} />
        <Stat label="Messages" value={counts.messages} />
        <Stat label="Announcements" value={counts.announcements} />
        <Stat label="Gallery items" value={counts.gallery} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-3xl font-bold">{value}</div>
    </div>
  );
}
