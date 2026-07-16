import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — DATYX" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getUser();
      if (!sess.user) { navigate({ to: "/auth", replace: true }); return; }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", sess.user.id);
      const admin = roles?.some((r) => r.role === "admin") ?? false;
      if (!admin) {
        toast.error("Admin access required.");
        navigate({ to: "/dashboard", replace: true });
        return;
      }
      setIsAdmin(true);
      setChecking(false);
    })();
  }, [navigate]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (checking || !isAdmin) return <div className="min-h-[60vh] px-6 py-20 text-sm text-muted-foreground">Checking admin access…</div>;

  const nav: { to: string; label: string; exact?: boolean }[] = [
    { to: "/admin", label: "Dashboard", exact: true },
    { to: "/admin/quest", label: "SQL Quest Settings" },
    { to: "/admin/events", label: "Events" },
    { to: "/admin/team", label: "Team" },
    { to: "/admin/messages", label: "Contact Messages" },
    { to: "/admin/announcements", label: "Announcements" },
    { to: "/admin/gallery", label: "Gallery" },
    { to: "/admin/users", label: "Users" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-sm font-medium text-accent">Admin Console</span>
          <h1 className="mt-1 font-display text-3xl font-bold">DATYX Admin</h1>
        </div>
        <button onClick={signOut} className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">Logout</button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-xl border border-border bg-surface p-3 shadow-card lg:sticky lg:top-24 lg:self-start">
          <nav className="flex flex-wrap gap-1 lg:flex-col">
            {nav.map((n) => {
              const active = n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to);
              return (
                <Link key={n.to} to={n.to as "/admin"} className={`rounded-full px-3 py-1.5 text-sm font-medium ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div><Outlet /></div>
      </div>
    </div>
  );
}
