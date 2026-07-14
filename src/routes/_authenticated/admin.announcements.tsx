import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/announcements")({
  component: AdminAnnouncements,
});

type Row = { id: string; title: string; body: string; published: boolean; created_at: string };

function AdminAnnouncements() {
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState({ title: "", body: "", published: true });
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    setRows((data as Row[]) || []);
  }
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("announcements").insert(form);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Announcement posted");
    setForm({ title: "", body: "", published: true });
    load();
  }
  async function remove(id: string) {
    if (!confirm("Delete this announcement?")) return;
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    load();
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-bold">Announcements</h2>
      <form onSubmit={submit} className="mt-6 grid gap-3 rounded-xl border border-border bg-surface p-5 shadow-card">
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="input" />
        <textarea placeholder="Body" rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required className="input" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Published</label>
        <button disabled={saving} className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 w-fit">{saving ? "Posting…" : "Post announcement"}</button>
      </form>
      <ul className="mt-6 space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="rounded-xl border border-border bg-surface p-5 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{r.title} {!r.published && <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs">draft</span>}</div>
                <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
              </div>
              <button onClick={() => remove(r.id)} className="rounded-full border border-destructive/40 px-3 py-1 text-xs text-destructive hover:bg-destructive/10">Delete</button>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm">{r.body}</p>
          </li>
        ))}
        {rows.length === 0 && <li className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">No announcements yet.</li>}
      </ul>
      <style>{`.input{width:100%;border-radius:0.5rem;border:1px solid var(--color-border);background:#fff;padding:0.55rem 0.75rem;font-size:0.9rem;color:#111;outline:none}.input:focus{border-color:#111}`}</style>
    </div>
  );
}
