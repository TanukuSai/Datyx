import { createFileRoute, Link } from "@tanstack/react-router";
import sketchFun from "@/assets/sketch-fun.png";
import { useAccess } from "@/hooks/useAccess";

export const Route = createFileRoute("/entertainment")({
  head: () => ({
    meta: [
      { title: "Every Saturday — DATYX" },
      { name: "description", content: "Entertainment and engagement activities running every Saturday at DATYX Club." },
      { property: "og:title", content: "Every Saturday — DATYX" },
      { property: "og:description", content: "Weekly Saturday activities: gaming, web dev, SQL game, startup challenges and hackathons." },
    ],
  }),
  component: Entertainment,
});

type Activity = {
  slug: string;
  icon: string;
  name: string;
  desc: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
};

const activities: Activity[] = [
  { slug: "gaming-tournament", icon: "🎮", name: "Gaming Tournament", desc: "Weekly multiplayer gaming competition promoting teamwork and fun.", category: "Entertainment", difficulty: "Beginner" },
  { slug: "network-gaming", icon: "🖥️", name: "Network Gaming", desc: "LAN gaming sessions with exciting multiplayer challenges.", category: "Entertainment", difficulty: "Beginner" },
  { slug: "web-dev-program", icon: "💻", name: "Web Development Program", desc: "Weekly practical sessions covering HTML, CSS, JavaScript, React and modern web development.", category: "Tech", difficulty: "Intermediate" },
  { slug: "sql-game-weekly", icon: "🗄️", name: "SQL Game", desc: "Interactive SQL competition where students solve database challenges.", category: "Data Science", difficulty: "Beginner" },
  { slug: "startup-challenge", icon: "🚀", name: "Startup Innovation Challenge", desc: "Students create startup ideas, develop business models and pitch innovative solutions.", category: "Innovation", difficulty: "Intermediate" },
  { slug: "mini-hackathons", icon: "💡", name: "Hackathons", desc: "Weekly mini-hackathons encouraging creativity, teamwork and software development.", category: "Workshops", difficulty: "Advanced" },
];

function Entertainment() {
  const { signedIn, hasAccess } = useAccess();
  return (
    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-center">
        <div>
          <span className="text-sm font-medium text-primary">Entertainment & Engagement</span>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Every Saturday at DATYX</h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            A recurring lineup of activities that keep the club energetic — play, build, pitch and code together. All activities run every Saturday.
          </p>
        </div>
        <img src={sketchFun} alt="Friends playing music and games" loading="lazy" width={1024} height={768} className="w-full max-w-sm justify-self-center md:justify-self-end" />
      </div>


      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {activities.map((a) => (
          <div key={a.slug} className="rounded-xl border border-border bg-surface p-6 transition-all hover:border-primary/40">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-2xl shadow-glow">
              <span aria-hidden>{a.icon}</span>
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">{a.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{a.desc}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-border bg-background px-2 py-0.5 text-muted-foreground">{a.category}</span>
              <span className="rounded-full border border-border bg-background px-2 py-0.5 text-muted-foreground">{a.difficulty}</span>
              <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 font-medium text-primary">
                Schedule: Every Saturday
              </span>
            </div>

            {!signedIn ? (
              <Link
                to="/auth"
                className="mt-5 inline-flex rounded-md border border-primary/40 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10"
              >
                Sign in to register
              </Link>
            ) : !hasAccess ? (
              <Link
                to="/register/id"
                className="mt-5 inline-flex rounded-md border border-primary/40 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10"
              >
                Complete registration
              </Link>
            ) : (
              <Link
                to="/dashboard"
                className="mt-5 inline-flex rounded-md border border-primary/40 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10"
              >
                Register
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
