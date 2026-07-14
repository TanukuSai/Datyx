import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import logoAsset from "@/assets/datyx-logo.png.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — DATYX" },
      { name: "description", content: "Sign in or create your DATYX account. Email verification and Google sign-in." },
      { property: "og:title", content: "Sign in — DATYX" },
      { property: "og:description", content: "Sign in or create your DATYX account." },
    ],
  }),
  component: Auth,
});

const emailSchema = z.string().trim().email("Enter a valid email").max(200);
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password is too long")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[0-9]/, "Include a number");
const nameSchema = z.string().trim().min(2, "Name is too short").max(80);

type Mode = "signin" | "signup";

function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [verifySent, setVerifySent] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.session.user.id);
      const isAdmin = roles?.some((r) => r.role === "admin");
      navigate({ to: isAdmin ? "/admin" : "/dashboard", replace: true });
    });
  }, [navigate]);

  async function afterLogin() {
    const { data: sess } = await supabase.auth.getUser();
    if (!sess.user) return;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", sess.user.id);
    const isAdmin = roles?.some((r) => r.role === "admin");
    navigate({ to: isAdmin ? "/admin" : "/dashboard", replace: true });
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    const em = emailSchema.safeParse(form.email);
    if (!em.success) errs.email = em.error.issues[0].message;
    const pw = passwordSchema.safeParse(form.password);
    if (!pw.success) errs.password = pw.error.issues[0].message;
    if (mode === "signup") {
      const nm = nameSchema.safeParse(form.name);
      if (!nm.success) errs.name = nm.error.issues[0].message;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: form.name },
          },
        });
        if (error) throw error;
        setVerifySent(form.email);
        toast.success("Verification email sent — please check your inbox.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
        await afterLogin();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message || "Google sign-in failed");
        setLoading(false);
        return;
      }
      if (result.redirected) return; // browser redirects
      // popup flow — session already set
      navigate({ to: "/dashboard", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  if (verifySent) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-20">
        <div className="w-full rounded-xl border border-border bg-surface p-8 text-center shadow-card">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-primary text-2xl">✉️</div>
          <h1 className="mt-4 font-display text-2xl font-bold">Verify your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">We sent a confirmation link to <strong className="text-foreground">{verifySent}</strong>. Click it to activate your DATYX account.</p>
          <button onClick={() => { setVerifySent(null); setMode("signin"); }} className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-4 py-16">
      <div className="w-full rounded-xl border border-border bg-surface p-8 shadow-card">
        <Link to="/" className="mb-6 flex items-center gap-2.5 font-display text-lg font-bold">
          <img src={logoAsset.url} alt="DATYX" className="h-10 w-10 rounded-full bg-white ring-1 ring-primary/40" />
          DATYX
        </Link>
        <h1 className="font-display text-2xl font-bold">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signin" ? "Sign in to continue your SQL Quest." : "Join the DATYX community — takes 30 seconds."}
        </p>

        <button onClick={google} disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-secondary disabled:opacity-50">
          <GoogleIcon /> Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <Field label="Full name" error={errors.name}>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={80} className="input" autoComplete="name" />
            </Field>
          )}
          <Field label="Email" error={errors.email}>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={200} className="input" autoComplete="email" />
          </Field>
          <Field label="Password" error={errors.password} hint={mode === "signup" ? "8+ chars, upper, lower & number" : undefined}>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} maxLength={100} className="input" autoComplete={mode === "signin" ? "current-password" : "new-password"} />
          </Field>
          <button disabled={loading} className="w-full rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-60">
            {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>New to DATYX? <button onClick={() => { setMode("signup"); setErrors({}); }} className="font-medium text-primary hover:underline">Create an account</button></>
          ) : (
            <>Already a member? <button onClick={() => { setMode("signin"); setErrors({}); }} className="font-medium text-primary hover:underline">Sign in</button></>
          )}
        </p>
      </div>

      <style>{`.input{width:100%;border-radius:0.5rem;border:1px solid var(--color-border);background:var(--color-input);padding:0.6rem 0.8rem;font-size:0.9rem;color:var(--color-foreground);outline:none;transition:border-color .15s}.input:focus{border-color:var(--color-primary)}`}</style>
    </div>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.8-2 13.3-5.2l-6.1-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.6-3.4-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.6l6.1 5.2C40.7 35.5 44 30.2 44 24c0-1.3-.1-2.3-.4-3.5z"/>
    </svg>
  );
}
