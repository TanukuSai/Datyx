import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Loader2, ArrowRight, Home } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/registration-complete")({
  head: () => ({
    meta: [
      { title: "Registration Complete — DATYX" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RegistrationComplete,
});

function RegistrationComplete() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    let active = true;
    let channel: any = null;

    async function initProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        
        if (active) {
          setProfile(prof);
          if (prof?.verification_status === "approved") {
            navigate({ to: "/dashboard", replace: true });
            return;
          }
        }

        // Subscribe to profile status updates in real-time
        channel = supabase
          .channel(`profile-status-${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "profiles",
              filter: `id=eq.${user.id}`,
            },
            (payload) => {
              if (active) {
                console.log("Realtime profile updated:", payload.new);
                setProfile(payload.new);
                if (payload.new.verification_status === "approved") {
                  toast.success("Profile approved! Redirecting...");
                  navigate({ to: "/dashboard", replace: true });
                }
              }
            }
          )
          .subscribe();
      } catch (err) {
        console.error("Failed to load profile details:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    
    initProfile();

    return () => {
      active = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isApproved = profile?.verification_status === "approved";
  const isCsds = profile?.is_csds;

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-4 py-16">
      <div className="w-full rounded-xl border border-border bg-surface p-8 shadow-card text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600 text-3xl shadow-[3px_3px_0_0_#111111] border-[1.5px] border-black">
          <CheckCircle2 />
        </div>

        {isApproved ? (
          <>
            <h1 className="mt-6 font-display text-3xl font-bold">Registration Complete!</h1>
            <p className="mt-3 text-sm text-muted-foreground font-sans">
              Your payment has been verified and your profile is approved. Welcome to the DATYX community!
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Link
                to="/game"
                className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90"
              >
                🎮 Start SQL Quest <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/dashboard"
                className="flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
              >
                <Home className="h-4 w-4" /> Go to Dashboard
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-6 font-display text-3xl font-bold">Payment Received</h1>
            <p className="mt-3 text-sm text-muted-foreground font-mono text-gradient">
              Verifying...
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Your payment has been received. We are currently verifying the signature and updating your access credentials.
            </p>
            <p className="mt-4 text-xs text-muted-foreground border-t border-dashed border-black/20 pt-4">
              This status page will update once the transaction is finalized. You can refresh in a few moments or visit the dashboard.
            </p>
            <div className="mt-8">
              <Link
                to="/dashboard"
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90"
              >
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
