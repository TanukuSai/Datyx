import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — DATYX" },
      { name: "description", content: "Get in touch with DATYX Club — partnerships, talks and general questions." },
      { property: "og:title", content: "Contact — DATYX" },
      { property: "og:description", content: "Get in touch with the DATYX team." },
    ],
  }),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  email: z.string().trim().email("Enter a valid email").max(200),
  message: z.string().trim().min(10, "Please write a bit more").max(1000),
});

function Contact() {
  const [state, setState] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = schema.safeParse(state);
    if (!r.success) {
      const errs: Record<string, string> = {};
      r.error.issues.forEach((i) => (errs[i.path[0] as string] = i.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    toast.success("Message received! We'll get back within 48h.");
    setState({ name: "", email: "", message: "" });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <span className="text-sm font-medium text-primary">Contact</span>
      <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Talk to us</h1>
      <p className="mt-4 text-muted-foreground">Partnerships, guest talks, sponsorships or just saying hi — we love it all.</p>

      <form onSubmit={submit} className="mt-10 space-y-5 rounded-xl border border-border bg-surface p-8">
        <Field label="Name" error={errors.name}>
          <input value={state.name} onChange={(e) => setState({ ...state, name: e.target.value })} maxLength={80} className="input" />
        </Field>
        <Field label="Email" error={errors.email}>
          <input type="email" value={state.email} onChange={(e) => setState({ ...state, email: e.target.value })} maxLength={200} className="input" />
        </Field>
        <Field label="Message" error={errors.message}>
          <textarea rows={5} value={state.message} onChange={(e) => setState({ ...state, message: e.target.value })} maxLength={1000} className="input resize-y" />
        </Field>
        <button className="rounded-lg bg-gradient-to-r from-primary to-accent px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90">
          Send message
        </button>
      </form>

      <style>{`.input{width:100%;border-radius:0.5rem;border:1px solid var(--color-border);background:var(--color-input);padding:0.6rem 0.8rem;font-size:0.9rem;color:var(--color-foreground);outline:none;transition:border-color .15s}.input:focus{border-color:var(--color-primary)}`}</style>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
