import { supabase } from "@/integrations/supabase/client";
import { LEVELS } from "./levels";

export interface Progress {
  cleared: Record<number, { xp: number; clearedAt: number }>;
  xp: number;
}

const KEY = "datyx.sqlquest.progress.v2";

function empty(): Progress {
  return { cleared: {}, xp: 0 };
}

// Loads local cache
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

// Saves to local cache
export function saveLocalProgress(p: Progress) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(p));
}

// Fetch user progress from Supabase DB and sync to local cache
export async function fetchUserProgress(userId: string): Promise<Progress> {
  try {
    const { data, error } = await supabase
      .from("user_quest_progress")
      .select("level_id, completed_at")
      .eq("user_id", userId);

    if (error) throw error;

    const progress: Progress = empty();
    if (data && data.length > 0) {
      data.forEach((row) => {
        const lvl = LEVELS.find((l) => l.id === row.level_id);
        const xp = lvl ? lvl.xp : 10;
        progress.cleared[row.level_id] = {
          xp,
          clearedAt: new Date(row.completed_at).getTime(),
        };
        progress.xp += xp;
      });
    }

    saveLocalProgress(progress);
    return progress;
  } catch (err) {
    console.error("Failed to fetch progress from Supabase:", err);
    return loadProgress(); // Fallback to local cache if offline/error
  }
}

// Record level completion in Supabase DB and sync locally
export async function recordLevelCompletion(userId: string, levelId: number, xp: number): Promise<Progress> {
  const p = loadProgress();
  
  // Try to insert in Supabase
  try {
    const { error } = await supabase
      .from("user_quest_progress")
      .insert({
        user_id: userId,
        level_id: levelId
      });

    if (error && error.code !== "23505") { // Ignore unique constraint violation
      throw error;
    }
  } catch (err) {
    console.error("Failed to persist progress to Supabase:", err);
  }

  // Update local cache state
  if (!p.cleared[levelId]) {
    p.cleared[levelId] = { xp, clearedAt: Date.now() };
    p.xp += xp;
    saveLocalProgress(p);
  }

  return p;
}

export function isUnlocked(levelId: number, p: Progress): boolean {
  return true;
}

export function highestUnlocked(p: Progress): number {
  const ids = Object.keys(p.cleared).map(Number);
  if (ids.length === 0) return 1;
  return Math.max(...ids) + 1;
}
