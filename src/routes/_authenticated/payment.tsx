import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreditCard, Loader2, ShieldCheck, Upload, AlertCircle, CheckCircle } from "lucide-react";

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
  
  // Manual Upload States
  const [utr, setUtr] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please upload a screenshot of the transaction.");
      return;
    }
    if (!utr.trim()) {
      toast.error("Please enter your transaction UTR / Reference number.");
      return;
    }

    setLoading(true);
    setLoadingMsg("Uploading receipt screenshot...");
    
    try {
      // 1. Upload file to Storage Bucket
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("payment_screenshots")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from("payment_screenshots")
        .getPublicUrl(filePath);

      setLoadingMsg("Submitting transaction details to admins...");

      // 3. Call submit-payment Edge Function
      const { error: fnError } = await supabase.functions.invoke("submit-payment", {
        body: { utr: utr.trim(), screenshot_url: publicUrl },
      });

      if (fnError) throw fnError;

      toast.success("Transaction submitted successfully! Waiting for verification.");
      navigate({ to: "/registration-complete", replace: true });
    } catch (err: any) {
      console.error("Manual payment verification error:", err);
      toast.error(err?.message || "Failed to submit verification request");
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
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="text-center mb-10">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent/15 text-accent text-2xl shadow-glow">
          <CreditCard />
        </div>
        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight">Membership Payment</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          Scan the QR Code to complete the one-time ₹300 membership fee, and upload transaction details below.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[1.1fr_1.2fr]">
        {/* Left Column: QR Code Card */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-full max-w-[280px] rounded-xl overflow-hidden border-2 border-primary/20 bg-white p-4 shadow-sm">
            <img
              src="/qr-code.png"
              alt="PhonePe Accepted Here QR Code"
              className="w-full object-contain"
            />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">Scan with PhonePe or any UPI App</p>
            <p className="text-xs text-muted-foreground">Account Holder: Maduri Sannith Reddy</p>
          </div>
          <div className="w-full rounded-xl bg-secondary/40 border border-border/60 p-4 text-left">
            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
              <span>Amount Due</span>
              <span className="text-foreground font-bold">₹300.00</span>
            </div>
            <div className="mt-2 border-t border-border/80 pt-2 flex justify-between text-xs text-muted-foreground font-mono">
              <span>Verification Type:</span>
              <span className="font-semibold text-accent uppercase tracking-wide">Manual Check</span>
            </div>
          </div>
        </div>

        {/* Right Column: Submission Form */}
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface p-6 shadow-card space-y-5">
          <h3 className="font-display text-xl font-bold flex items-center gap-2 border-b border-border pb-3">
            Submit Transaction Receipt
          </h3>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              UTR / UPI Reference ID
            </label>
            <input
              type="text"
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              placeholder="e.g. 619284710482"
              className="input w-full"
              required
            />
            <p className="text-[10px] text-muted-foreground">
              Provide the 12-digit transaction number (UTR) printed on your payment receipt receipt.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Transaction Screenshot
            </label>
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 bg-secondary/15"
              }`}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              {file ? (
                <div className="space-y-2">
                  <CheckCircle className="mx-auto h-8 w-8 text-emerald-500 animate-bounce" />
                  <p className="text-xs font-semibold text-foreground truncate max-w-xs mx-auto">
                    {file.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Click or drag new file to replace
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="text-xs font-medium text-foreground">
                    Click to upload or drag & drop screenshot
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Supports PNG, JPG, JPEG (Max 5MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> {loadingMsg}
              </>
            ) : (
              <>Submit Verification Details</>
            )}
          </button>

          <div className="flex items-start gap-2 rounded-lg bg-amber-500/5 border border-amber-500/10 p-3 text-[11px] text-amber-600 leading-relaxed">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              <strong>Note:</strong> Transaction verification is done manually by DATYX admins. It may take 1-2 hours for your account status to update. Submission of fraudulent receipts will result in profile deletion.
            </span>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground border-t border-border/40 pt-3">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Manual Payment Safety Check Active
          </div>
        </form>
      </div>

      <style>{`
        .input {
          border-radius: 9999px;
          border: 1px solid var(--color-border);
          background: var(--color-input);
          padding: 0.6rem 1rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s;
        }
        .input:focus {
          border-color: var(--color-primary);
        }
      `}</style>
    </div>
  );
}
