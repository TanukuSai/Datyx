import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import sketchTeam from "@/assets/sketch-team.png";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Team — DATYX" },
      { name: "description", content: "Meet the DATYX faculty coordinators, club leads and student track leads." },
      { property: "og:title", content: "Team — DATYX" },
      { property: "og:description", content: "Faculty coordinators, club leads and student track leads driving DATYX." },
    ],
  }),
  component: Team,
});

type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string;
  category: "faculty" | "track_lead" | "creative_lead";
  display_order: number;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Card({ n, r, b }: { n: string; r: string; b: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-primary to-accent font-display text-lg font-bold text-primary-foreground shadow-glow">
        {initials(n)}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold">{n}</h3>
      <div className="text-sm text-primary">{r}</div>
      <p className="mt-2 text-sm text-muted-foreground">{b}</p>
    </div>
  );
}

function Section({ label, title, sub, items }: { label: string; title: string; sub?: string; items: TeamMember[] }) {
  return (
    <section className="mt-14">
      <span className="text-sm font-medium text-primary">{label}</span>
      <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{title}</h2>
      {sub ? <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{sub}</p> : null}
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((m) => <Card key={m.id} n={m.name} r={m.role} b={m.bio} />)}
      </div>
    </section>
  );
}

function Team() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeam() {
      try {
        const { data, error } = await supabase
          .from("team_members")
          .select("*")
          .order("display_order", { ascending: true });

        if (error) {
          throw error;
        }
        setMembers((data as TeamMember[]) || []);
      } catch (err) {
        console.error("Failed to load team:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTeam();
  }, []);

  const faculty = members.filter((m) => m.category === "faculty");
  const trackLeads = members.filter((m) => m.category === "track_lead");
  const creativeLeads = members.filter((m) => m.category === "creative_lead");

  return (
    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-10 md:grid-cols-[1fr_1.2fr] md:items-center">
        <img src={sketchTeam} alt="Doodle of team members waving" loading="lazy" width={1024} height={768} className="order-2 w-full max-w-md justify-self-center md:order-1" />
        <div className="order-1 md:order-2">
          <span className="text-sm font-medium text-primary">Team</span>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">The people behind DATYX</h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Faculty coordinators and student track leads shaping every workshop, hackathon and Saturday activity at DATYX.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-20 flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground font-mono">Loading team members...</span>
        </div>
      ) : (
        <>
          {faculty.length > 0 && <Section label="Faculty" title="Faculty Coordinators" items={faculty} />}
          {trackLeads.length > 0 && <Section label="Tracks" title="Student Track Leads" sub="Each lead owns a track and the events that run under it." items={trackLeads} />}
          {creativeLeads.length > 0 && <Section label="Creative & Marketing" title="Creative & Marketing Leads" sub="Leads driving creative tracks and club marketing." items={creativeLeads} />}
        </>
      )}
    </div>
  );
}
