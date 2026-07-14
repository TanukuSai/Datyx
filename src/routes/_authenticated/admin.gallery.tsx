import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/gallery")({
  component: AdminGallery,
});

type Row = { id: string; title: string | null; caption: string | null; image_url: string; created_at: string };

function AdminGallery() {
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState({ title: "", caption: "", image_url: "" });

  async function load() {
    const { data } = await supabase.from("gallery").select("*").order("created_at", { ascending: false });
    setRows((data as Row[]) || []);
  }
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("gallery").insert(form);
    if (error) { toast.error(error.message); return; }
    setForm({ title: "", caption: "", image_url: "" });
    load();
  }
  async function remove(id: string) {
    if (!confirm("Delete?")) return;
    await supabase.from("gallery").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-bold">Gallery</h2>
      <p className="mt-1 text-sm text-muted-foreground">Add images via URL. (Upload to a host and paste the URL.)</p>
      <form onSubmit={add} className="mt-6 grid gap-3 rounded-xl border border-border bg-surface p-5 shadow-card sm:grid-cols-2">
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" />
        <input placeholder="Image URL *" required value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="input" />
        <input placeholder="Caption" value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} className="input sm:col-span-2" />
        <button className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 w-fit sm:col-span-2">Add image</button>
      </form>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <div key={r.id} className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
            <img src={r.image_url} alt={r.title || ""} className="h-48 w-full object-cover" />
            <div className="p-3">
              <div className="text-sm font-semibold">{r.title || "Untitled"}</div>
              <div className="text-xs text-muted-foreground">{r.caption}</div>
              <button onClick={() => remove(r.id)} className="mt-2 rounded-full border border-destructive/40 px-3 py-1 text-xs text-destructive hover:bg-destructive/10">Delete</button>
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">No gallery items yet.</div>}
      </div>
      <style>{`.input{width:100%;border-radius:0.5rem;border:1px solid var(--color-border);background:#fff;padding:0.55rem 0.75rem;font-size:0.9rem;color:#111;outline:none}.input:focus{border-color:#111}`}</style>
    </div>
  );
}
