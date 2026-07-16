import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Calendar, BookOpen } from "lucide-react";
import { TOPICS } from "@/lib/sql-quest/topics";

export const Route = createFileRoute("/_authenticated/admin/quest")({
  component: AdminQuestSettings,
});

// Converts a UTC ISO string to IST (UTC+5:30) string formatted for datetime-local input
function toIstDateTimeLocal(isoString: string | null): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  
  // IST is UTC + 5:30 (330 minutes)
  const istOffset = 330 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffset);
  const iso = istDate.toISOString(); // e.g. "2026-07-16T18:00:00.000Z"
  return iso.slice(0, 16); // Returns "2026-07-16T18:00"
}

// Converts a datetime-local input value (assumed in IST) to a UTC ISO string
function fromIstDateTimeLocal(istString: string): string | null {
  if (!istString) return null;
  // Append the IST timezone offset +05:30 to force correct parsing
  const parsedDate = new Date(istString + ":00+05:30");
  if (isNaN(parsedDate.getTime())) return null;
  return parsedDate.toISOString();
}

function AdminQuestSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [activeTopic, setActiveTopic] = useState("topic_1");
  const [currentDbTime, setCurrentDbTime] = useState<string | null>(null);

  // Fetch settings on mount
  async function loadSettings() {
    setLoading(true);
    try {
      // 1. Get settings row
      const { data: settings, error: settingsError } = await supabase
        .from("quest_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (settingsError) throw settingsError;

      if (settings) {
        setStartTime(toIstDateTimeLocal(settings.start_time));
        setEndTime(toIstDateTimeLocal(settings.end_time));
        setActiveTopic(settings.active_topic_id);
      }

      // 2. Fetch current database time from server using RPC or select
      const { data: timeRes, error: timeError } = await supabase.rpc("is_quest_active");
      // Fallback display
      setCurrentDbTime(new Date().toISOString());

    } catch (err: any) {
      console.error("Failed to load settings:", err);
      toast.error(err.message || "Failed to load SQL Quest settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const startUtc = fromIstDateTimeLocal(startTime);
      const endUtc = fromIstDateTimeLocal(endTime);

      if (startUtc && endUtc && new Date(startUtc) >= new Date(endUtc)) {
        toast.error("Start time must be strictly before end time.");
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from("quest_settings")
        .upsert({
          id: 1,
          start_time: startUtc,
          end_time: endUtc,
          active_topic_id: activeTopic,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success("SQL Quest settings updated successfully!");
      await loadSettings();
    } catch (err: any) {
      console.error("Failed to save settings:", err);
      toast.error(err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-mono">Loading Quest settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">SQL Quest Configuration</h2>
        <p className="mt-1 text-sm text-muted-foreground">Configure the active schedule (IST) and release topics for SQL Quest.</p>
      </div>

      <form onSubmit={handleSave} className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-border bg-surface p-6 shadow-card space-y-5">
          <h3 className="font-display text-lg font-bold flex items-center gap-2 border-b border-border pb-3">
            <Calendar className="h-5 w-5 text-primary" /> Timing Schedule (IST)
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Start Date & Time (IST)</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">End Date & Time (IST)</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="input w-full"
                required
              />
            </div>
          </div>

          <div className="mt-4 p-4 rounded-lg bg-secondary/40 border border-border text-xs text-muted-foreground space-y-1.5">
            <p><strong>Note on Timezones:</strong></p>
            <p>1. Timings entered above are treated as **Indian Standard Time (IST)**.</p>
            <p>2. They are parsed and saved in UTC in the database, preventing any regional daylight savings mishaps.</p>
            <p>3. Access is verified using the database server clock, not the student's device clock.</p>
          </div>
          
          <div className="pt-4 border-t border-border flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Configuration
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-card space-y-5">
          <h3 className="font-display text-lg font-bold flex items-center gap-2 border-b border-border pb-3">
            <BookOpen className="h-5 w-5 text-primary" /> Curriculum Pacing
          </h3>

          <div>
            <label className="mb-1.5 block text-sm font-semibold">Active Topic (Max Uncovered)</label>
            <select
              value={activeTopic}
              onChange={(e) => setActiveTopic(e.target.value)}
              className="select w-full"
            >
              {TOPICS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.levelsRange})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pacing Scope Preview</p>
            <div className="space-y-2.5">
              {TOPICS.map((t) => {
                const topicIndex = TOPICS.findIndex((x) => x.id === t.id);
                const activeIndex = TOPICS.findIndex((x) => x.id === activeTopic);
                const isUnlocked = topicIndex <= activeIndex;

                return (
                  <div
                    key={t.id}
                    className={`flex items-start gap-2.5 rounded-lg border p-3 transition-colors ${
                      isUnlocked
                        ? "border-primary/20 bg-primary/5 text-foreground"
                        : "border-border bg-secondary/20 text-muted-foreground opacity-60"
                    }`}
                  >
                    <div className="mt-0.5">
                      {isUnlocked ? (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">✓</span>
                      ) : (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-muted-foreground">🔒</span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{t.levelsRange} · {t.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </form>
      
      <style>{`
        .input, .select {
          border-radius: 9999px;
          border: 1px solid var(--color-border);
          background: var(--color-input);
          padding: 0.6rem 1rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s;
        }
        .input:focus, .select:focus {
          border-color: var(--color-primary);
        }
        .select {
          appearance: none;
          background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E");
          background-position: right 0.75rem center;
          background-repeat: no-repeat;
          background-size: 1.25rem;
          padding-right: 2rem;
        }
      `}</style>
    </div>
  );
}
