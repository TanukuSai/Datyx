import { createFileRoute, Outlet, redirect, useNavigate, useLocation, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);

  const pathname = location.pathname;
  const isBypassed =
    pathname === "/register/id" ||
    pathname === "/payment" ||
    pathname === "/registration-complete" ||
    pathname.startsWith("/admin");

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if admin
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);
        const admin = roles?.some((r: any) => r.role === "admin") ?? false;
        if (active) {
          setIsAdmin(admin);
        }

        if (admin) {
          if (active) {
            setLoading(false);
          }
          return;
        }

        // Check profile
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (active) {
          setProfile(prof);
        }

        if (prof) {
          // Check payment status
          const { data: payment } = await supabase
            .from("payments")
            .select("status")
            .eq("profile_id", user.id)
            .in("status", ["paid", "created"])
            .maybeSingle();

          if (active) {
            setHasPaid(!!payment);
          }
        }
      } catch (err) {
        console.error("Failed to load gating status:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadStatus();

    return () => {
      active = false;
    };
  }, [pathname]);

  // Listen for real-time auth state changes (e.g. sign outs) to redirect immediately
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        navigate({ to: "/auth", replace: true });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    if (isAdmin && (
      pathname === "/register/id" ||
      pathname === "/payment" ||
      pathname === "/registration-complete" ||
      pathname === "/dashboard"
    )) {
      navigate({ to: "/admin", replace: true });
    }
  }, [isAdmin, pathname, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-mono">Verifying access status...</p>
      </div>
    );
  }

  // Admins bypass all gates
  if (isAdmin) {
    return <Outlet />;
  }

  // Bypassed routes bypass gating
  if (isBypassed) {
    return <Outlet />;
  }

  // 1. Check if profile exists
  if (!profile) {
    navigate({ to: "/register/id", replace: true });
    return null;
  }

  // 2. Check if rejected
  if (profile.verification_status === "rejected") {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-20">
        <div className="w-full rounded-xl border border-border bg-surface p-8 text-center shadow-card">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-destructive/15 text-destructive text-2xl">❌</div>
          <h1 className="mt-4 font-display text-2xl font-bold">Registration Rejected</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your student ID verification was rejected. Please contact the coordinators for assistance.</p>
          <Link to="/contact" className="mt-6 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
            Contact Support
          </Link>
        </div>
      </div>
    );
  }

  // 3. Check if expired
  const isExpired = profile.access_expires_at && new Date(profile.access_expires_at) <= new Date();
  if (isExpired) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-20">
        <div className="w-full rounded-xl border border-border bg-surface p-8 text-center shadow-card">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-destructive/15 text-destructive text-2xl">⚠️</div>
          <h1 className="mt-4 font-display text-2xl font-bold">Access Expired</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your membership access has expired. Please contact DATYX coordinators to renew your access.</p>
        </div>
      </div>
    );
  }

  // 4. Unpaid users must go to payment page (everyone must pay 300 INR)
  // If the profile is already approved by the admin, we bypass this check so they are never locked out of gameplay.
  if (!hasPaid && profile.verification_status !== "approved") {
    navigate({ to: "/payment", replace: true });
    return null;
  }

  // 5. User is paid/CSD but still pending admin approval
  if (profile.verification_status === "pending") {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-20">
        <div className="w-full rounded-xl border border-border bg-surface p-8 text-center shadow-card">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent/15 text-accent text-2xl">⏳</div>
          <h1 className="mt-4 font-display text-2xl font-bold">Awaiting Verification</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your registration is awaiting verification by the DATYX administrators.</p>
          <p className="mt-4 text-xs text-muted-foreground">This process usually takes 24-48 hours. We will notify you once access is granted.</p>
        </div>
      </div>
    );
  }

  // Approved and active access -> normal page render
  return <Outlet />;
}
