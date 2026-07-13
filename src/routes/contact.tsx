import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";


export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — DATYX" },
      { name: "description", content: "Reach the DATYX faculty coordinators and student track leads." },
      { property: "og:title", content: "Contact — DATYX" },
      { property: "og:description", content: "Get in touch with the DATYX team." },
    ],
  }),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(100),
  email: z.string().trim().email("Enter a valid email").max(200),
  subject: z.string().trim().min(2, "Subject is too short").max(200),
  message: z.string().trim().min(10, "Please write a bit more").max(2000),
});

const faculty = [
  { n: "CH Sai Priya", r: "Faculty Coordinator" },
  { n: "Marthineni Shilpa", r: "Faculty Coordinator" },
];

const leads = [
  { n: "Sai Pournami", r: "Tech Track" },
  { n: "Sannith Reddy", r: "Workshops & Hackathons" },
  { n: "Ashok Vallabhuni", r: "Innovation, Entrepreneurship & Cyber Security" },
  { n: "Balu Shalini", r: "Data Science Track" },
];

const club = [
  { label: "Club Email", value: "datyxclub@gmail.com" },
];

function Contact() {
  const [state, setState] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = schema.safeParse(state);
    if (!r.success) {
      const errs: Record<string, string> = {};
      r.error.issues.forEach((i) => (errs[i.path[0] as string] = i.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const { error } = await supabase.from("contact_messages").insert(r.data);
    setSubmitting(false);
    if (error) {
      toast.error("Could not send message. Please try again.");
      return;
    }
    toast.success("Thank you for contacting DATYX. Your message has been received successfully. Our team will get back to you as soon as possible.");
    setState({ name: "", email: "", subject: "", message: "" });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
      <span className="text-sm font-medium text-primary">Contact</span>
      <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Talk to us</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Partnerships, guest talks, sponsorships or general questions — reach a coordinator, a track lead, or send us a message.
      </p>

      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="font-display text-lg font-semibold">Faculty Coordinators</h2>
          <ul className="mt-4 space-y-3">
            {faculty.map((f) => (
              <li key={f.n} className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{f.n}</div>
                  <div className="text-xs text-muted-foreground">{f.r}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="font-display text-lg font-semibold">Student Track Leads</h2>
          <ul className="mt-4 space-y-3">
            {leads.map((l) => (
              <li key={l.n} className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{l.n}</div>
                  <div className="text-xs text-muted-foreground">{l.r}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-semibold">Club Details</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          {club.map((c) => (
            <div key={c.label}>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</dt>
              <dd className="mt-1 text-sm font-medium">{c.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <form onSubmit={submit} className="mt-10 space-y-5 rounded-xl border border-border bg-surface p-8">
        <h2 className="font-display text-lg font-semibold">Send us a message</h2>
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
