import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Edit2, Trash2, X, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/team")({
  component: AdminTeam,
});

type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string;
  category: "faculty" | "track_lead" | "creative_lead";
  display_order: number;
  photo_url?: string | null;
  phone?: string | null;
  email?: string | null;
  linkedin?: string | null;
  created_at?: string;
};

const categories = [
  { value: "faculty", label: "Faculty Coordinator" },
  { value: "track_lead", label: "Student Track Lead" },
  { value: "creative_lead", label: "Creative & Marketing Lead" },
] as const;

const emptyForm = {
  name: "",
  role: "",
  bio: "",
  category: "track_lead" as const,
  display_order: 1,
  photo_url: "",
  phone: "",
  email: "",
  linkedin: "",
};

function AdminTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadTeam() {
    try {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("category", { ascending: true })
        .order("display_order", { ascending: true });

      if (error) {
        throw error;
      }
      setMembers((data as TeamMember[]) || []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load team members");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeam();
  }, []);

  function startEdit(m: TeamMember) {
    setEditing(m);
    setForm({
      name: m.name,
      role: m.role,
      bio: m.bio,
      category: m.category,
      display_order: m.display_order,
      photo_url: m.photo_url || "",
      phone: m.phone || "",
      email: m.email || "",
      linkedin: m.linkedin || "",
    });
    setPhotoFile(null);
  }

  function cancelEdit() {
    setEditing(null);
    setForm(emptyForm);
    setPhotoFile(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.role.trim() || !form.bio.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSaving(true);
    try {
      let photoUrl = form.photo_url;
      
      if (photoFile) {
        const cleanName = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const fileExt = photoFile.name.split(".").pop();
        const fileName = `${cleanName}-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("team-photos")
          .upload(fileName, photoFile, {
            cacheControl: "3600",
            upsert: true
          });
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from("team-photos")
          .getPublicUrl(fileName);
          
        photoUrl = publicUrl;
      }

      const payload = {
        name: form.name.trim(),
        role: form.role.trim(),
        bio: form.bio.trim(),
        category: form.category,
        display_order: form.display_order,
        photo_url: photoUrl || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        linkedin: form.linkedin.trim() || null,
      };

      const query = editing
        ? supabase.from("team_members").update(payload).eq("id", editing.id)
        : supabase.from("team_members").insert(payload);

      const { error } = await query;
      if (error) throw error;

      toast.success(editing ? "Team member updated!" : "Team member added!");
      cancelEdit();
      await loadTeam();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save team member");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Team member deleted!");
      await loadTeam();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete team member");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">Team Management</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage faculty coordinators and student leads rendered on the public team page.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.5fr] lg:items-start">
        {/* Editor Card */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
          <h3 className="font-display text-lg font-bold">{editing ? "Edit Member" : "Add New Member"}</h3>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. ASHOK VALLABHUNI"
                className="input w-full"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role / Position</label>
              <input
                type="text"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="e.g. Student Track Lead"
                className="input w-full"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                className="select w-full"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone Number (optional)</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="e.g. 9876543210"
                className="input w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email (optional)</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="e.g. name@email.com"
                className="input w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">LinkedIn Profile URL (optional)</label>
              <input
                type="url"
                value={form.linkedin}
                onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                placeholder="e.g. https://linkedin.com/in/username"
                className="input w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Profile Photo (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                className="input w-full text-xs"
              />
              {form.photo_url && (
                <div className="mt-2 flex items-center gap-2 bg-secondary/50 p-2 rounded-lg border border-dashed border-border/40">
                  <img src={form.photo_url} className="h-8 w-8 rounded object-cover" alt="Preview" />
                  <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">Current Photo Active</span>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, photo_url: "" })}
                    className="text-[10px] text-destructive hover:underline ml-auto font-semibold"
                  >
                    Clear Photo
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Display Order (Sorting)</label>
              <input
                type="number"
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value, 10) || 1 })}
                placeholder="1"
                className="input w-full"
                min={1}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bio / Track Contributions</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="List tracks or brief description of coordination work..."
                className="textarea w-full h-24"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editing ? "Update" : "Add Member"}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium hover:bg-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List Card */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
          <h3 className="font-display text-lg font-bold">Current Members</h3>
          {loading ? (
            <div className="mt-8 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground font-mono">Loading data...</span>
            </div>
          ) : members.length === 0 ? (
            <p className="mt-6 text-center text-sm text-muted-foreground italic">No team members in the database yet.</p>
          ) : (
            <div className="mt-6 space-y-4">
              {categories.map((cat) => {
                const list = members.filter((m) => m.category === cat.value);
                if (list.length === 0) return null;
                return (
                  <div key={cat.value} className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-accent border-b border-border pb-1">{cat.label}s</h4>
                    <div className="divide-y divide-border">
                      {list.map((m) => (
                        <div key={m.id} className="flex items-start gap-3 py-3 border-b border-border last:border-b-0">
                          {m.photo_url ? (
                            <img src={m.photo_url} className="h-10 w-10 rounded object-cover border border-border shrink-0 mt-0.5" alt={m.name} />
                          ) : (
                            <div className="h-10 w-10 rounded bg-secondary flex items-center justify-center text-xs font-bold border border-border shrink-0 mt-0.5 text-muted-foreground">
                              {m.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-foreground truncate">{m.name}</span>
                              <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">Order: {m.display_order}</span>
                            </div>
                            <div className="text-xs text-primary font-medium">{m.role}</div>
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{m.bio}</p>
                            
                            {/* Contact Details in List */}
                            {(m.email || m.phone || m.linkedin) && (
                              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground font-mono">
                                {m.email && <span className="truncate">📧 {m.email}</span>}
                                {m.phone && <span>📞 {m.phone}</span>}
                                {m.linkedin && <a href={m.linkedin} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">🔗 LinkedIn</a>}
                              </div>
                            )}
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <button
                              onClick={() => startEdit(m)}
                              className="rounded p-1.5 hover:bg-secondary text-muted-foreground hover:text-foreground"
                              title="Edit Member"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(m.id, m.name)}
                              className="rounded p-1.5 hover:bg-secondary text-muted-foreground hover:text-destructive"
                              title="Delete Member"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <style>{`
        .input, .select, .textarea {
          border-radius: 0.5rem;
          border: 1px solid var(--color-border);
          background: var(--color-input);
          padding: 0.55rem 0.75rem;
          font-size: 0.85rem;
          color: var(--color-foreground);
          outline: none;
          transition: border-color 0.15s;
        }
        .input:focus, .select:focus, .textarea:focus {
          border-color: var(--color-primary);
        }
      `}</style>
    </div>
  );
}
