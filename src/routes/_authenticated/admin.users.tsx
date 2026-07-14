import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: Users,
});

type Profile = { id: string; email: string | null; full_name: string | null; provider: string | null; created_at: string };

function Users() {
  const [rows, setRows] = useState<Profile[]>([]);
  useEffect(() => {
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setRows((data as Profile[]) || []);
    });
  }, []);
  return (
    <div>
      <h2 className="font-display text-2xl font-bold">Users</h2>
      <p className="mt-1 text-sm text-muted-foreground">All registered DATYX members.</p>
      <div className="mt-6 rounded-xl border border-border bg-surface shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Provider</th><th className="p-3">Joined</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No users yet.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-3 font-medium">{r.full_name || "—"}</td>
                <td className="p-3 text-muted-foreground">{r.email}</td>
                <td className="p-3 text-xs"><span className="rounded-full bg-secondary px-2 py-0.5">{r.provider || "email"}</span></td>
                <td className="p-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
