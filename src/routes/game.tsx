import { createFileRoute, Link } from "@tanstack/react-router";
import sketchCoder from "@/assets/sketch-coder.png";
import { useEffect, useState } from "react";
import { Lock, Check, ShieldAlert, BookOpen, Clock, AlertTriangle, ArrowRight, Eye, ChevronRight, X } from "lucide-react";
import { LEVELS } from "@/lib/sql-quest/levels";
import { loadProgress, isUnlocked, fetchUserProgress, type Progress } from "@/lib/sql-quest/progress";
import { TOPICS, type Topic, isTopicUnlocked } from "@/lib/sql-quest/topics";
import { useAccess } from "@/hooks/useAccess";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/game")({
  head: () => ({
    meta: [
      { title: "SQL Quest — Topic-Wise Learning Challenge · DATYX" },
      { name: "description", content: "Learn SQL step-by-step through 20 curated levels, with theory, interactive examples, and progress tracking." },
      { property: "og:title", content: "SQL Quest — DATYX Challenge" },
      { property: "og:description", content: "Step-by-step SQL curriculum with timing schedule and topic-wise pacing." },
    ],
  }),
  component: Game,
});

// Helper to format UTC timestamp to IST time string for display
function formatUtcToIstString(isoString: string | null): string {
  if (!isoString) return "Not Scheduled";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "Not Scheduled";
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }) + " IST";
}

function Game() {
  const { loading: accessLoading, signedIn, hasAccess } = useAccess();
  const [progress, setProgress] = useState<Progress>({ cleared: {}, xp: 0 });
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  
  // Quest Gating States
  const [questActive, setQuestActive] = useState(false);
  const [questSettings, setQuestSettings] = useState<{
    start_time: string | null;
    end_time: string | null;
    active_topic_id: string;
  } | null>(null);

  // Drawer / Resource States
  const [activeLearnTopic, setActiveLearnTopic] = useState<Topic | null>(null);
  const [learnTab, setLearnTab] = useState<"theory" | "examples" | "practice">("theory");
  const [practiceInput, setPracticeInput] = useState("");
  const [showPracticeAnswer, setShowPracticeAnswer] = useState(false);

  // Initial load
  async function initQuest() {
    setCheckingAccess(true);
    try {
      // 1. Get settings
      const { data: settings } = await supabase
        .from("quest_settings")
        .select("start_time, end_time, active_topic_id")
        .eq("id", 1)
        .maybeSingle();
      
      if (settings) {
        setQuestSettings(settings);
      }

      // 2. Query Postgres server clock via RPC
      const { data: isActive } = await supabase.rpc("is_quest_active");
      setQuestActive(Boolean(isActive));

      // 3. Determine if current user is admin (to bypass locks)
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        const uid = sessionData.session.user.id;
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", uid);
        const admin = roles?.some((r) => r.role === "admin") ?? false;
        setIsAdmin(admin);

        // Fetch Supabase-persisted user progress
        const p = await fetchUserProgress(uid);
        setProgress(p);
      } else {
        // Fallback to local storage for guests
        setProgress(loadProgress());
      }
    } catch (e) {
      console.error("Failed to check quest timings:", e);
      setProgress(loadProgress());
    } finally {
      setCheckingAccess(false);
    }
  }

  useEffect(() => {
    initQuest();
  }, []);

  const activeMaxTopic = questSettings?.active_topic_id || "topic_1";
  const showLockScreen = !questActive && !isAdmin;

  if (checkingAccess) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2">
        <LoaderComponent />
      </div>
    );
  }

  // QUEST TIMING LOCKED SCREEN (Students see this when quest is outside timing window)
  if (showLockScreen) {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-4 py-20 text-center">
        <div className="w-full rounded-2xl border border-border bg-surface p-8 shadow-card space-y-6">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-400/10 text-red-500 text-3xl">
            <Clock className="h-8 w-8 animate-pulse" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">SQL Quest is Closed</h1>
          <p className="text-sm text-muted-foreground">
            The SQL Quest is only available during active club timings.
          </p>

          <div className="rounded-xl bg-secondary/50 border border-border p-4 text-left space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Next Event Timing</p>
            <div className="space-y-1 text-xs">
              <p className="flex justify-between">
                <span className="font-medium">Starts:</span>
                <span className="font-mono text-foreground">{formatUtcToIstString(questSettings?.start_time)}</span>
              </p>
              <p className="flex justify-between">
                <span className="font-medium">Ends:</span>
                <span className="font-mono text-foreground">{formatUtcToIstString(questSettings?.end_time)}</span>
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/"
              className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface p-8 shadow-card md:p-12 lg:grid lg:grid-cols-[1.3fr_1fr] lg:gap-10 lg:items-center">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              🏆 ACTIVE EVENT
            </span>
            {isAdmin && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-600">
                ⚙ Admin Bypass Active
              </span>
            )}
          </div>
          <h1 className="font-display text-4xl font-extrabold sm:text-5xl tracking-tight">
            SQL Quest <span className="text-gradient">Data Science Challenge</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Learn SQL structured curriculum through active challenges, inline theory lessons, code examples, and practice playgrounds.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {hasAccess ? (
              <Link
                to="/play/$levelId"
                params={{ levelId: "1" }}
                className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:opacity-90 flex items-center gap-2 shadow-glow"
              >
                ▶ Start Level 1 <ChevronRight className="h-4 w-4" />
              </Link>
            ) : signedIn ? (
              <Link to="/dashboard" className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:opacity-90">
                Complete registration →
              </Link>
            ) : (
              <Link to="/auth" className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:opacity-90">
                Sign in to play →
              </Link>
            )}
            
            {isAdmin && (
              <Link
                to="/admin/quest"
                className="rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold hover:bg-secondary flex items-center gap-1.5"
              >
                Configure Timings
              </Link>
            )}
          </div>

          {/* Timing details for live students */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg p-3 w-fit border border-border">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>Event active until: <strong className="text-foreground">{formatUtcToIstString(questSettings?.end_time)}</strong></span>
          </div>
        </div>
        <img
          src={sketchCoder}
          alt="Doodle of a coder at a computer"
          loading="lazy"
          className="w-full max-w-sm justify-self-center hidden lg:block"
        />
      </section>

      {/* Verification Banner */}
      {signedIn && !hasAccess && !accessLoading && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300/40 bg-amber-50 p-4">
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Profile verification required</p>
            <p className="mt-0.5 text-xs text-amber-700">
              Only verified DATYX members can play SQL Quest. Complete your registration and wait for admin approval to unlock the game.
            </p>
          </div>
        </div>
      )}

      {/* Curriculum & Topics List */}
      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-border pb-3">
          <div>
            <h2 className="font-display text-2xl font-bold">SQL Curriculum Topics</h2>
            <p className="text-sm text-muted-foreground">Unlock topic learning cards and solve corresponding levels below.</p>
          </div>
          <div className="text-right text-sm text-muted-foreground font-mono">
            Accumulated XP: <span className="font-bold text-foreground">{progress.xp}</span>
          </div>
        </div>

        <div className="space-y-6">
          {TOPICS.map((topic) => {
            const unlocked = isTopicUnlocked(topic.id, activeMaxTopic);
            
            return (
              <div
                key={topic.id}
                className={`rounded-2xl border transition-all ${
                  unlocked
                    ? "border-border bg-surface p-6 shadow-sm"
                    : "border-border bg-secondary/20 p-6 opacity-60 relative overflow-hidden select-none"
                }`}
              >
                {/* Lock Overlay */}
                {!unlocked && (
                  <div className="absolute inset-0 bg-secondary/15 backdrop-blur-[2px] flex items-center justify-center z-10 flex-col gap-2">
                    <Lock className="h-7 w-7 text-muted-foreground" />
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Unreleased Topic</p>
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                        unlocked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      }`}>
                        {topic.levelsRange}
                      </span>
                      <h3 className="font-display text-lg font-bold text-foreground">{topic.name}</h3>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{topic.description}</p>
                  </div>

                  {unlocked && (
                    <button
                      onClick={() => {
                        setActiveLearnTopic(topic);
                        setLearnTab("theory");
                        setPracticeInput("");
                        setShowPracticeAnswer(false);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 px-4 py-2 text-xs font-semibold text-primary self-start md:self-auto"
                    >
                      <BookOpen className="h-3.5 w-3.5" /> Learn Concepts
                    </button>
                  )}
                </div>

                {/* Level Map Grid inside Topic */}
                <div className="mt-6 border-t border-border/60 pt-4">
                  <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-8 md:grid-cols-10">
                    {topic.levelIds.map((n) => {
                      const seed = LEVELS.find((l) => l.id === n);
                      const cleared = Boolean(progress.cleared[n]);
                      const allowed = seed && isUnlocked(n, progress);
                      const state = !seed ? "future" : cleared ? "cleared" : allowed ? "open" : "locked";
                      
                      return (
                        <LevelTile
                          key={n}
                          n={n}
                          state={state}
                          hasAccess={hasAccess && unlocked}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Learning Resources Drawer / Panel */}
      {activeLearnTopic && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-xl bg-surface h-full shadow-2xl flex flex-col border-l border-border animate-slide-in">
            {/* Drawer Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Learning Card</span>
                <h3 className="font-display text-xl font-bold mt-0.5">{activeLearnTopic.name}</h3>
              </div>
              <button
                onClick={() => setActiveLearnTopic(null)}
                className="h-8 w-8 rounded-full border border-border hover:bg-secondary grid place-items-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tab Selectors */}
            <div className="flex border-b border-border bg-secondary/30">
              {(["theory", "examples", "practice"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setLearnTab(t)}
                  className={`flex-1 py-3 text-center text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
                    learnTab === t
                      ? "border-primary text-primary bg-surface"
                      : "border-transparent text-muted-foreground hover:bg-secondary/40"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {learnTab === "theory" && (
                <div className="space-y-4">
                  <h4 className="font-display text-base font-bold">Theory Overview</h4>
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line bg-secondary/10 p-4 rounded-xl border border-border">
                    {activeLearnTopic.learningResources.theory}
                  </p>
                </div>
              )}

              {learnTab === "examples" && (
                <div className="space-y-5">
                  <h4 className="font-display text-base font-bold">SQL Query Examples</h4>
                  {activeLearnTopic.learningResources.examples.map((ex, idx) => (
                    <div key={idx} className="rounded-xl border border-border bg-background overflow-hidden">
                      <div className="bg-secondary/60 px-4 py-2 border-b border-border font-mono text-xs text-primary font-bold">
                        Example #{idx + 1}
                      </div>
                      <div className="p-4 space-y-3">
                        <pre className="font-mono text-xs text-foreground bg-secondary/30 p-3 rounded-lg overflow-x-auto select-all">
                          {ex.sql}
                        </pre>
                        <p className="text-xs text-muted-foreground">{ex.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {learnTab === "practice" && (
                <div className="space-y-5">
                  <h4 className="font-display text-base font-bold">Topic Challenge</h4>
                  <div className="p-4 rounded-xl border border-border bg-secondary/10 space-y-3">
                    <p className="text-sm font-semibold">{activeLearnTopic.learningResources.practice.question}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold">Write your query:</label>
                    <textarea
                      value={practiceInput}
                      onChange={(e) => setPracticeInput(e.target.value)}
                      placeholder="SELECT ... FROM ...;"
                      rows={4}
                      className="font-mono text-xs p-3 border border-border rounded-lg bg-background w-full focus:border-primary outline-none"
                    />
                  </div>

                  <div className="pt-2">
                    {showPracticeAnswer ? (
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                        <p className="text-xs font-bold text-primary">Model Solution:</p>
                        <pre className="font-mono text-xs text-foreground bg-surface p-2.5 rounded border border-border select-all">
                          {activeLearnTopic.learningResources.practice.sql}
                        </pre>
                        <p className="text-xs text-muted-foreground">
                          {activeLearnTopic.learningResources.practice.explanation}
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowPracticeAnswer(true)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
                      >
                        Show Explanation & Solution <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-border flex justify-end bg-secondary/10">
              <button
                onClick={() => setActiveLearnTopic(null)}
                className="rounded-full bg-black px-6 py-2.5 text-xs font-semibold text-white hover:opacity-90"
              >
                Close Lessons
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LevelTile({ n, state, hasAccess }: { n: number; state: "cleared" | "open" | "locked" | "future"; hasAccess: boolean }) {
  const cls = {
    cleared: "border-emerald-400/40 text-emerald-300 bg-emerald-400/10",
    open: "border-primary/50 text-primary bg-primary/10 hover:bg-primary/20",
    locked: "border-border text-muted-foreground bg-background/60",
    future: "border-border/60 text-muted-foreground/60 bg-background/40",
  }[state];
  
  const clickable = hasAccess && (state === "open" || state === "cleared");
  const inner = (
    <div className={`group aspect-square rounded-md border ${cls} grid place-items-center text-xs font-mono relative overflow-hidden ${clickable ? "cursor-pointer" : ""}`}>
      {state === "cleared" ? <Check className="h-3.5 w-3.5" /> : state === "locked" || state === "future" ? <Lock className="h-3.5 w-3.5 opacity-60" /> : <span>{n}</span>}
      {clickable && <span className="absolute inset-0 hidden items-center justify-center text-[10px] font-semibold uppercase tracking-wider group-hover:flex">Play</span>}
    </div>
  );

  if (!clickable) return inner;
  return (
    <Link to="/play/$levelId" params={{ levelId: String(n) }}>{inner}</Link>
  );
}

function LoaderComponent() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-20 font-mono text-sm text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span>Checking active timing access...</span>
    </div>
  );
}
