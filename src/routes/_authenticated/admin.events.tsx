import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EventCalendar } from "@/routes/events";


export const Route = createFileRoute("/_authenticated/admin/events")({
  component: AdminEvents,
});

type EventRow = {
  id: string; title: string; description: string | null; event_date: string | null;
  start_time: string | null; end_time: string | null; venue: string | null; category: string | null;
  registration_link: string | null; poster_url: string | null; organizer: string | null; status: string;
};

const empty: Omit<EventRow, "id"> = {
  title: "", description: "", event_date: "", start_time: "", end_time: "",
  venue: "", category: "", registration_link: "", poster_url: "", organizer: "", status: "upcoming",
};

function AdminEvents() {
  const [rows, setRows] = useState<EventRow[]>([]);
  const [editing, setEditing] = useState<EventRow | null>(null);
  const [form, setForm] = useState<Omit<EventRow, "id">>(empty);
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await supabase.from("events").select("*").order("event_date", { ascending: true });
    setRows((data as EventRow[]) || []);
  }
  useEffect(() => { load(); }, []);

  function editRow(r: EventRow) {
    setEditing(r);
    setForm({
      title: r.title, description: r.description ?? "", event_date: r.event_date ?? "",
      start_time: r.start_time ?? "", end_time: r.end_time ?? "", venue: r.venue ?? "",
      category: r.category ?? "", registration_link: r.registration_link ?? "",
      poster_url: r.poster_url ?? "", organizer: r.organizer ?? "", status: r.status,
    });
  }
  function reset() { setEditing(null); setForm(empty); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    // Convert empty strings to null for date/time columns
    const payload = {
      ...form,
      event_date: form.event_date || null,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
    };
    const q = editing
      ? supabase.from("events").update(payload).eq("id", editing.id)
      : supabase.from("events").insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Event updated" : "Event created");
    reset(); load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this event?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted"); load();
  }

  const [showPreview, setShowPreview] = useState(false);

  // Merge current form with existing rows so preview reflects live edits
  const previewEvents = useMemo(() => {
    const draftId = editing?.id ?? "__draft__";
    const draft: EventRow = { id: draftId, ...form, event_date: form.event_date || null, start_time: form.start_time || null, end_time: form.end_time || null };
    const others = rows.filter((r) => r.id !== draftId);
    const list = form.title && form.event_date ? [...others, draft] : rows;
    return list;
  }, [rows, form, editing]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">Events</h2>
          <p className="mt-1 text-sm text-muted-foreground">Create, edit, and delete events. Public visitors and members see them immediately.</p>
        </div>
        <button type="button" onClick={() => setShowPreview((v) => !v)} className="rounded-full border-[1.5px] border-black bg-white px-4 py-2 text-sm font-medium hover:bg-secondary">
          {showPreview ? "Hide calendar preview" : "Preview on calendar"}
        </button>
      </div>

      {showPreview && (
        <div className="mt-6 rounded-2xl border-[1.5px] border-dashed border-black/60 bg-white p-4">
          <div className="mb-2 text-[11px] font-mono uppercase tracking-widest text-accent">Admin Preview — how it will render on /events</div>
          <EventCalendar previewEvents={previewEvents} adminPreview />
        </div>
      )}


      <form onSubmit={save} className="mt-6 grid gap-3 rounded-xl border border-border bg-surface p-5 shadow-card">
        <div className="font-display text-lg font-semibold">{editing ? "Edit event" : "New event"}</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Title *" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
          <Input label="Category" value={form.category ?? ""} onChange={(v) => setForm({ ...form, category: v })} />
          <Input label="Date" type="date" value={form.event_date ?? ""} onChange={(v) => setForm({ ...form, event_date: v })} />
          <Input label="Venue" value={form.venue ?? ""} onChange={(v) => setForm({ ...form, venue: v })} />
          <Input label="Start time" type="time" value={form.start_time ?? ""} onChange={(v) => setForm({ ...form, start_time: v })} />
          <Input label="End time" type="time" value={form.end_time ?? ""} onChange={(v) => setForm({ ...form, end_time: v })} />
          <Input label="Organizer" value={form.organizer ?? ""} onChange={(v) => setForm({ ...form, organizer: v })} />
          <Select label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={["upcoming", "live", "completed"]} />
          <Input label="Registration link" value={form.registration_link ?? ""} onChange={(v) => setForm({ ...form, registration_link: v })} />
          <Input label="Poster URL" value={form.poster_url ?? ""} onChange={(v) => setForm({ ...form, poster_url: v })} />
        </div>
        <label className="block">
          <span className="text-sm font-medium">Description</span>
          <textarea rows={3} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input mt-1.5" />
        </label>
        <div className="flex gap-2">
          <button disabled={saving} className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">{saving ? "Saving…" : editing ? "Save changes" : "Create event"}</button>
          {editing && <button type="button" onClick={reset} className="rounded-full border border-border px-5 py-2 text-sm font-medium hover:bg-secondary">Cancel</button>}
        </div>
      </form>

      <div className="mt-8 rounded-xl border border-border bg-surface shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="p-3">Title</th><th className="p-3">Date</th><th className="p-3">Status</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No events yet.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-3 font-medium">{r.title}</td>
                <td className="p-3 text-muted-foreground">{r.event_date || "—"}</td>
                <td className="p-3"><span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{r.status}</span></td>
                <td className="p-3 text-right">
                  <button onClick={() => editRow(r)} className="mr-2 rounded-full border border-border px-3 py-1 text-xs hover:bg-secondary">Edit</button>
                  <button onClick={() => remove(r.id)} className="rounded-full border border-destructive/40 px-3 py-1 text-xs text-destructive hover:bg-destructive/10">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`.input{width:100%;border-radius:0.5rem;border:1px solid var(--color-border);background:#fff;padding:0.55rem 0.75rem;font-size:0.9rem;color:#111;outline:none}.input:focus{border-color:#111}`}</style>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} className="input mt-1.5" />
    </label>
  );
}
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input mt-1.5">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
