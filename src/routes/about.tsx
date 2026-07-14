import { createFileRoute } from "@tanstack/react-router";
import sketchCommunity from "@/assets/sketch-community.png";
import sketchThink from "@/assets/sketch-think.png";


export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — DATYX Data Science Club" },
      { name: "description", content: "DATYX is a student-run data science community focused on hands-on learning, real projects and gamified challenges." },
      { property: "og:title", content: "About — DATYX Data Science Club" },
      { property: "og:description", content: "Learn who we are and what DATYX stands for." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-center">
        <div>
          <span className="text-sm font-medium text-primary">About</span>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">We're building the data community we wish we had.</h1>
          <p className="mt-6 text-lg text-muted-foreground">
            DATYX is a student-run data science club with one mission: help every member go from curious to confident with data. We host workshops, ship open-source projects, run gamified challenges and connect students with mentors and industry.
          </p>
        </div>
        <img src={sketchCommunity} alt="Community learning together" loading="lazy" width={1024} height={768} className="w-full max-w-md justify-self-center md:justify-self-end" />
      </div>




      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {[
          { t: "Learn by doing", d: "No lectures without hands-on. Every session ends with a real deliverable." },
          { t: "Compete to grow", d: "Leaderboards, XP, hackathons — because learning is more fun as a game." },
          { t: "Share knowledge", d: "Our library, notes and code are open. Rising tides lift all boats." },
        ].map((v) => (
          <div key={v.t} className="rounded-xl border border-border bg-surface p-6">
            <h3 className="font-display text-lg font-semibold text-primary">{v.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{v.d}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 grid gap-8 rounded-xl border-[1.5px] border-black bg-white p-8 md:grid-cols-[1fr_1.3fr] md:items-center">
        <img src={sketchThink} alt="Doodle of a student with a laptop and a lightbulb" loading="lazy" className="w-full max-w-xs justify-self-center" />
        <div>
          <h2 className="font-display text-2xl font-bold">Our tracks</h2>
          <ul className="mt-4 space-y-3 text-muted-foreground">
            <li><strong className="text-foreground">SQL & Analytics</strong> — 100-level SQL Quest + BI tools.</li>
            <li><strong className="text-foreground">Python & ML</strong> — from pandas to scikit-learn to deep learning.</li>
            <li><strong className="text-foreground">Data Engineering</strong> — pipelines, warehouses and modern data stack.</li>
            <li><strong className="text-foreground">Applied AI</strong> — LLMs, RAG and shipping AI products.</li>
          </ul>
        </div>
      </div>

    </div>
  );
}
