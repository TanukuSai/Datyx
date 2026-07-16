import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreditCard, Loader2, ShieldCheck, Zap, Lock } from "lucide-react";

// Extend window with Razorpay type
declare global {
  interface Window {
    Razorpay: any;
  }
}

export const Route = createFileRoute("/_authenticated/payment")({
  head: () => ({
    meta: [
      { title: "Membership Payment — DATYX" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Payment,
});

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function Payment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        setProfile(prof);
        if (prof?.is_csds) {
          navigate({ to: "/registration-complete", replace: true });
        }
      }
    }
    loadData();

    // Pre-load Razorpay script
    loadRazorpayScript().then(setScriptReady);
  }, [navigate]);

  const handlePay = async () => {
    if (!scriptReady) {
      toast.error("Payment gateway is still loading. Please try again.");
      return;
    }

    setLoading(true);
    setLoadingMsg("Creating secure order...");

    try {
      // Step 1: Create Razorpay order via Edge Function
      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        "create-razorpay-order",
        { body: {} }
      );

      if (orderError || !orderData?.order_id) {
        throw new Error(orderError?.message || "Failed to create payment order");
      }

      setLoading(false);

      // Step 2: Open Razorpay checkout modal
      const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;

      const options = {
        key: razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "DATYX Club",
        description: "One-time Membership Fee",
        image: "/logo.png",
        order_id: orderData.order_id,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          // Step 3: Verify payment signature on backend
          setLoading(true);
          setLoadingMsg("Verifying payment...");
          try {
            const { error: verifyError } = await supabase.functions.invoke(
              "verify-razorpay-payment",
              { body: response }
            );

            if (verifyError) {
              throw new Error(verifyError.message || "Payment verification failed");
            }

            toast.success("Payment successful! Welcome to DATYX! 🎉");
            navigate({ to: "/dashboard", replace: true });
          } catch (err: any) {
            toast.error(err?.message || "Payment verification failed. Please contact support.");
            setLoading(false);
          }
        },
        prefill: {
          name: profile?.full_name || "",
          email: user?.email || "",
        },
        notes: {
          roll_no: profile?.roll_no || "",
          branch: profile?.branch_code || "",
        },
        theme: {
          color: "#4F46E5",
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast.info("Payment cancelled. You can retry when ready.");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        console.error("Razorpay payment failed:", response.error);
        toast.error(`Payment failed: ${response.error.description || "Unknown error"}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error("Payment initiation error:", err);
      toast.error(err?.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-lg items-center px-4 py-16">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary shadow-glow mb-4">
            <CreditCard className="h-8 w-8" />
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Membership Fee</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Complete your one-time payment to unlock full DATYX access
          </p>
        </div>

        {/* Payment Card */}
        <div className="rounded-2xl border border-border bg-surface shadow-card overflow-hidden">
          {/* Amount row */}
          <div className="bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">One-time fee</p>
                <p className="mt-1 font-display text-4xl font-bold text-foreground">₹300</p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-600 uppercase tracking-wide">
                Lifetime Access
              </div>
            </div>
          </div>

          {/* Features list */}
          <div className="p-6 space-y-3">
            {[
              "Full SQL Quest access with all levels",
              "DATYX event registrations",
              "Member dashboard & progress tracking",
              "Club announcements & resources",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2.5 text-sm text-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                {feature}
              </div>
            ))}
          </div>

          {/* Student info preview */}
          <div className="border-t border-border/60 bg-secondary/20 px-6 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Paying as</p>
            <p className="text-sm font-semibold text-foreground">{profile.full_name}</p>
            <p className="text-xs text-muted-foreground font-mono">{profile.roll_no} · {profile.branch_code}</p>
          </div>

          {/* Pay button */}
          <div className="p-6 pt-4">
            <button
              onClick={handlePay}
              disabled={loading || !scriptReady}
              className="relative flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-primary to-accent py-4 text-base font-bold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {loadingMsg}
                </>
              ) : !scriptReady ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading payment gateway...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  Pay ₹300 with Razorpay
                </>
              )}
            </button>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" /> 256-bit SSL
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Powered by Razorpay
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-500" /> Instant activation
          </span>
        </div>

        <p className="text-center text-[11px] text-muted-foreground px-4">
          By paying, you agree to DATYX membership terms. Supports UPI, cards, netbanking & wallets.
        </p>
      </div>
    </div>
  );
}
