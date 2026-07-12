import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql as sqlLang } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Play as PlayIcon, Lightbulb, Trophy, Loader2, CheckCircle2, XCircle } from "lucide-react";

import { LEVELS, getLevel, type Level } from "@/lib/sql-quest/levels";
import { runQuery, type RunOutcome, type RunResult } from "@/lib/sql-quest/runner";
import { validate } from "@/lib/sql-quest/validate";
import { isUnlocked, loadProgress, markCleared, type Progress } from "@/lib/sql-quest/progress";

export const Route = createFileRoute("/_authenticated/play/$levelId")({
  head: ({ params }) => ({
    meta: [
      { title: `Level ${params.levelId} — SQL Quest · DATYX` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Play,
});

function Play() {
  const { levelId } = Route.useParams();
  const navigate = useNavigate();
  const id = Number(levelId);
  const level = getLevel(id);

  const [progress, setProgress] = useState<Progress>({ cleared: {}, xp: 0 });
  const [code, setCode] = useState<string>("");
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);
  const [expected, setExpected] = useState<RunResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState<{ correct: boolean; reason?: string } | null>(null);
  const [hintIdx, setHintIdx] = useState(0);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  useEffect(() => {
    if (!level) return;
    setCode(level.starter ?? "-- Write your SQL here\n");
    setOutcome(null);
    setExpected(null);
    setSubmitted(null);
    setHintIdx(0);
    setShowHint(false);
    // Precompute expected output once per level.
    runQuery(level.setup, level.solution).then((r) => {
      if (r.ok && r.result) setExpected(r.result);
    });
  }, [level]);

  const unlocked = level ? isUnlocked(level.id, progress) : false;

  if (!level) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Level not found</h1>
        <Link to="/game" className="mt-4 inline-flex text-primary underline">Back to SQL Quest</Link>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Locked</h1>
        <p className="mt-2 text-muted-foreground">Clear the previous level to unlock Level {level.id}.</p>
        <Link to="/game" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Back to level map</Link>
      </div>
    );
  }

  const alreadyCleared = Boolean(progress.cleared[level.id]);

  async function onRun() {
    setBusy(true);
    setSubmitted(null);
    const r = await runQuery(level!.setup, code);
    setOutcome(r);
    setBusy(false);
  }

  async function onSubmit() {
    if (!level) return;
    setBusy(true);
    setSubmitted(null);
    const r = await runQuery(level.setup, code);
    setOutcome(r);
    if (!r.ok || !r.result) {
      setSubmitted({ correct: false, reason: r.error ?? "Query error" });
      setBusy(false);
      return;
    }
    if (!expected) {
      setSubmitted({ correct: false, reason: "Expected output not ready — try again." });
      setBusy(false);
      return;
    }
    const v = validate(r.result, expected, { orderMatters: level.orderMatters !== false });
    setSubmitted(v);
    if (v.correct && !alreadyCleared) {
      const p = markCleared(level.id, level.xp);
      setProgress(p);
      toast.success(`Cleared! +${level.xp} XP`);
    } else if (v.correct) {
      toast.success("Correct again ✔");
    }
    setBusy(false);
  }

  function revealHint() {
    setShowHint(true);
    setHintIdx((i) => Math.min(i + 1, level!.hints.length - 1));
  }

  const nextId = level.id + 1;
  const nextExists = LEVELS.some((l) => l.id === nextId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/game" className="rounded-md border border-border p-2 hover:bg-secondary" aria-label="Back">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <TierBadge tier={level.tier} />
          <h1 className="font-display text-xl font-bold">Level {level.id} · {level.title}</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Trophy className="h-4 w-4 text-primary" /> +{level.xp} XP
          {alreadyCleared && <span className="ml-2 rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">Cleared</span>}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        {/* Problem panel */}
        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="font-display text-lg font-semibold">{level.brief}</h2>
          <p className="mt-3 text-sm text-muted-foreground">{level.task}</p>

          <SchemaPreview setup={level.setup} />

          <div className="mt-6 rounded-lg border border-border bg-background/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Hint</span>
              <button onClick={revealHint} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                <Lightbulb className="h-3.5 w-3.5" />
                {showHint ? "Next hint" : "Show hint"}
              </button>
            </div>
            {showHint ? (
              <p className="mt-2 text-sm">{level.hints[hintIdx]}</p>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">Stuck? Reveal a hint (no XP penalty).</p>
            )}
          </div>
        </div>

        {/* Editor + results */}
        <div className="flex min-h-[520px] flex-col overflow-hidden rounded-xl border border-border bg-background">
          <div className="border-b border-border">
            <CodeMirror
              value={code}
              onChange={(v) => setCode(v)}
              height="260px"
              theme={oneDark}
              extensions={[sqlLang()]}
              basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true }}
            />
          </div>
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <button onClick={onRun} disabled={busy} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:bg-secondary disabled:opacity-50">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayIcon className="h-3.5 w-3.5" />} Run
            </button>
            <button onClick={onSubmit} disabled={busy} className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-primary to-accent px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
              Submit
            </button>
            {outcome && (
              <span className="ml-auto text-xs text-muted-foreground">{outcome.elapsedMs.toFixed(0)} ms</span>
            )}
          </div>

          <div className="flex-1 overflow-auto p-4">
            {submitted && (
              <div className={`mb-3 flex items-start gap-2 rounded-md border p-3 text-sm ${submitted.correct ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" : "border-destructive/40 bg-destructive/10 text-destructive"}`}>
                {submitted.correct ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <XCircle className="mt-0.5 h-4 w-4" />}
                <div>
                  <div className="font-medium">{submitted.correct ? "Correct!" : "Not quite yet."}</div>
                  {submitted.reason && <div className="text-xs opacity-80">{submitted.reason}</div>}
                </div>
              </div>
            )}
            {!outcome ? (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">Run your query to see results.</div>
            ) : outcome.ok && outcome.result ? (
              <ResultTable r={outcome.result} />
            ) : (
              <pre className="whitespace-pre-wrap rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{outcome.error}</pre>
            )}
          </div>

          {submitted?.correct && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <Link to="/game" className="text-sm text-muted-foreground hover:text-foreground">All levels</Link>
              {nextExists ? (
                <button
                  onClick={() => navigate({ to: "/play/$levelId", params: { levelId: String(nextId) } })}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Next level <ChevronRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <span className="text-sm text-muted-foreground">You finished the seeded levels 🎉</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TierBadge({ tier }: { tier: Level["tier"] }) {
  const map: Record<Level["tier"], string> = {
    beginner: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10",
    intermediate: "text-yellow-300 border-yellow-400/30 bg-yellow-400/10",
    advanced: "text-orange-300 border-orange-400/30 bg-orange-400/10",
    expert: "text-red-300 border-red-400/30 bg-red-400/10",
  };
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${map[tier]}`}>{tier}</span>;
}

function ResultTable({ r }: { r: RunResult }) {
  if (r.columns.length === 0) return <div className="text-sm text-muted-foreground">Query executed. No rows returned.</div>;
  return (
    <div className="overflow-auto rounded-md border border-border">
      <table className="w-full border-collapse text-xs">
        <thead className="bg-surface">
          <tr>
            {r.columns.map((c) => (
              <th key={c} className="border-b border-border px-3 py-2 text-left font-mono font-medium">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {r.rows.map((row, i) => (
            <tr key={i} className="odd:bg-background even:bg-surface/40">
              {row.map((v, j) => (
                <td key={j} className="border-b border-border/60 px-3 py-1.5 font-mono">{v === null ? <span className="text-muted-foreground">NULL</span> : String(v)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SchemaPreview({ setup }: { setup: string }) {
  const tables = useMemo(() => extractTables(setup), [setup]);
  if (tables.length === 0) return null;
  return (
    <div className="mt-5">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Schema</div>
      <div className="mt-2 space-y-2">
        {tables.map((t) => (
          <div key={t.name} className="rounded-md border border-border bg-background/60 px-3 py-2 font-mono text-xs">
            <span className="text-primary">{t.name}</span>
            <span className="text-muted-foreground">({t.columns.join(", ")})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function extractTables(setup: string): { name: string; columns: string[] }[] {
  const re = /CREATE\s+TABLE\s+(\w+)\s*\(([^)]+)\)/gi;
  const out: { name: string; columns: string[] }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(setup)) !== null) {
    const name = m[1];
    const cols = m[2]
      .split(",")
      .map((c) => c.trim().split(/\s+/)[0])
      .filter(Boolean);
    out.push({ name, columns: cols });
  }
  return out;
}
