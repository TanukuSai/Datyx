import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/messages")({
  component: AdminMessages,
});

type Msg = { id: string; name: string; email: string; subject: string; message: string; submitted_at: string };

function AdminMessages() {
  const [rows, setRows] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("contact_messages").select("*").order("submitted_at", { ascending: false });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setRows((data as Msg[]) || []);
  }
  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    if (!confirm("Delete this message?")) return;
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted"); load();
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-bold">Contact Messages</h2>
      <p className="mt-1 text-sm text-muted-foreground">All submissions from the public contact form.</p>
      {loading ? (
        <div className="mt-6 text-sm text-muted-foreground">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">No messages yet.</div>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((m) => (
            <li key={m.id} className="rounded-xl border border-border bg-surface p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{m.subject}</div>
                  <div className="text-xs text-muted-foreground">{m.name} · <a href={`mailto:${m.email}`} className="text-accent hover:underline">{m.email}</a> · {new Date(m.submitted_at).toLocaleString()}</div>
                </div>
                <button onClick={() => remove(m.id)} className="rounded-full border border-destructive/40 px-3 py-1 text-xs text-destructive hover:bg-destructive/10">Delete</button>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
