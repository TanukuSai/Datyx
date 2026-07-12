// Local-first progress store. Swap to Supabase later without changing callers.

export interface Progress {
  cleared: Record<number, { xp: number; clearedAt: number }>;
  xp: number;
}

const KEY = "datyx.sqlquest.progress.v1";

function empty(): Progress {
  return { cleared: {}, xp: 0 };
}

export function loadProgress(): Progress {
  if (typeof window === "undefined") return empty();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Progress;
    if (!parsed || typeof parsed !== "object") return empty();
    return { cleared: parsed.cleared ?? {}, xp: parsed.xp ?? 0 };
  } catch {
    return empty();
  }
}

export function markCleared(levelId: number, xp: number): Progress {
  const p = loadProgress();
  if (p.cleared[levelId]) return p; // No double XP.
  p.cleared[levelId] = { xp, clearedAt: Date.now() };
  p.xp += xp;
  window.localStorage.setItem(KEY, JSON.stringify(p));
  return p;
}

export function isUnlocked(levelId: number, p: Progress): boolean {
  if (levelId <= 1) return true;
  return Boolean(p.cleared[levelId - 1]);
}

export function highestUnlocked(p: Progress): number {
  const ids = Object.keys(p.cleared).map(Number);
  if (ids.length === 0) return 1;
  return Math.max(...ids) + 1;
}
