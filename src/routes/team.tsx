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
  photo_url?: string | null;
  phone?: string | null;
  email?: string | null;
  linkedin?: string | null;
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

function Card({ member }: { member: TeamMember }) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const initialsText = initials(member.name);

  return (
    <div className="perspective-1000 h-[380px] w-full cursor-pointer" onClick={handleCardClick}>
      <div className={`flip-card-inner w-full h-full ${isFlipped ? "flipped" : ""}`}>
        
        {/* Front Side */}
        <div className="flip-card-front rounded-xl border border-border bg-surface overflow-hidden relative flex flex-col justify-end">
          {member.photo_url ? (
            <img 
              src={member.photo_url} 
              alt={member.name} 
              className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/15 flex items-center justify-center p-6">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-primary to-accent font-display text-3xl font-bold text-primary-foreground shadow-glow">
                {initialsText}
              </div>
            </div>
          )}
          {/* Info overlay */}
          <div className="relative z-10 p-5 bg-gradient-to-t from-black/85 via-black/45 to-transparent text-white pt-16">
            <h3 className="font-display text-lg font-bold text-white line-clamp-1">{member.name}</h3>
            <div className="text-xs text-accent-foreground/90 font-semibold uppercase tracking-wider mt-0.5 line-clamp-1">{member.role}</div>
          </div>
        </div>

        {/* Back Side */}
        <div className="flip-card-back rounded-xl border border-border bg-surface p-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">About Lead</span>
              <h3 className="font-display text-lg font-bold mt-0.5 leading-tight">{member.name}</h3>
              <div className="text-xs text-accent font-semibold">{member.role}</div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{member.bio}</p>
          </div>

          <div className="mt-4 border-t border-dashed border-border/40 pt-4 space-y-2 text-xs">
            {member.email && (
              <div className="flex items-center gap-2 truncate">
                <span className="font-semibold text-muted-foreground w-12 shrink-0">Email:</span>
                <a 
                  href={`mailto:${member.email}`} 
                  onClick={handleLinkClick}
                  className="text-primary hover:underline font-mono truncate"
                >
                  {member.email}
                </a>
              </div>
            )}
            {member.phone && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-muted-foreground w-12 shrink-0">Phone:</span>
                <a 
                  href={`tel:${member.phone}`} 
                  onClick={handleLinkClick}
                  className="text-primary hover:underline font-mono"
                >
                  {member.phone}
                </a>
              </div>
            )}
            {member.linkedin && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-muted-foreground w-12 shrink-0">LinkedIn:</span>
                <a 
                  href={member.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={handleLinkClick}
                  className="text-accent hover:underline font-semibold"
                >
                  View Profile ↗
                </a>
              </div>
            )}
            <div className="text-center pt-2 text-[10px] text-muted-foreground/60 italic font-mono select-none">
              Click to flip card
            </div>
          </div>
        </div>

      </div>
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
        {items.map((m) => <Card key={m.id} member={m} />)}
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
      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
        }
        .flip-card-inner.flipped {
          transform: rotateY(180deg);
        }
        .flip-card-front, .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
        .flip-card-back {
          transform: rotateY(180deg);
        }
      `}</style>
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
