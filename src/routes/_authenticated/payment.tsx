import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreditCard, Loader2, ShieldCheck, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/payment")({
  head: () => ({
    meta: [
      { title: "Membership Payment — DATYX" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Payment,
});

function Payment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

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
        
        // If is_csds, redirect away immediately
        if (prof?.is_csds) {
          navigate({ to: "/registration-complete", replace: true });
        }
      }
    }
    loadData();
  }, [navigate]);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);
    setLoadingMsg("Initializing payment order...");
    
    try {
      const { data, error } = await supabase.functions.invoke("create-order");
      if (error || !data) {
        throw error || new Error("Failed to initialize payment");
      }

      const { orderId, keyId } = data;

      // Handle mock/placeholder checkout simulator
      if (keyId === "rzp_test_placeholder_key_id" || orderId.startsWith("order_mock_")) {
        toast.info("Using Test Mode (Simulator).");
        setLoadingMsg("Simulating payment...");
        await simulateWebhookCall(orderId);
        return;
      }

      // Load Real Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Razorpay SDK failed to load. Are you offline?");
        setLoading(false);
        return;
      }

      setLoadingMsg("Opening checkout modal...");

      const options = {
        key: keyId,
        amount: 30000,
        currency: "INR",
        name: "DATYX Club",
        description: "One-time Membership Fee",
        order_id: orderId,
        handler: function (response: any) {
          toast.success("Payment successful!");
          navigate({ to: "/registration-complete", replace: true });
        },
        prefill: {
          name: profile?.full_name || "",
          email: user?.email || "",
          contact: profile?.phone || "",
        },
        theme: {
          color: "#E85D3C",
        },
        modal: {
          ondismiss: function () {
            toast.error("Payment modal dismissed.");
            setLoading(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to initiate payment");
      setLoading(false);
    }
  };

  // Helper function to call the webhook locally and simulate successful payment
  const simulateWebhookCall = async (orderId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/razorpay-webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-razorpay-signature": "mock_sig", // webhook will bypass check
        },
        body: JSON.stringify({
          event: "payment.captured",
          payload: {
            payment: {
              entity: {
                id: `pay_mock_${Math.random().toString(36).substring(2, 15)}`,
                amount: 30000,
                currency: "INR",
                status: "captured",
                order_id: orderId,
              },
            },
          },
        }),
      });

      if (response.ok) {
        toast.success("Mock payment captured successfully!");
        navigate({ to: "/registration-complete", replace: true });
      } else {
        toast.error("Mock payment capture failed.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Simulation error:", err);
      toast.error("Error simulating checkout.");
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
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-4 py-16">
      <div className="w-full rounded-xl border border-border bg-surface p-8 shadow-card text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent/15 text-accent text-3xl shadow-glow">
          <CreditCard />
        </div>
        
        <h1 className="mt-6 font-display text-3xl font-bold">Membership Fee</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Grants lifelong DATYX club access, workshops, game levels, and hackathons.
        </p>

        <div className="my-6 rounded-xl border border-border bg-background p-5 text-left">
          <div className="flex justify-between text-sm font-medium">
            <span>DATYX Membership</span>
            <span>₹300.00</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">One-time payment</div>
          <div className="mt-3 border-t border-dashed border-black/20 pt-3 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-accent">₹300.00</span>
          </div>
        </div>

        <button
          onClick={handlePayment}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> {loadingMsg}
            </>
          ) : (
            <>Pay ₹300</>
          )}
        </button>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Secure Checkout via Razorpay
        </div>
      </div>
    </div>
  );
}
