import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, UserMinus, Check, HelpCircle, Loader2, RefreshCw, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: Users,
});

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  roll_no?: string;
  section?: string;
  phone?: string;
  created_at: string;
};

type AuthOrphanUser = {
  id: string;
  email: string;
  created_at: string;
};

function Users() {
  const [activeTab, setActiveTab] = useState<"registered" | "incomplete">("registered");
  const [registered, setRegistered] = useState<Profile[]>([]);
  const [incomplete, setIncomplete] = useState<AuthOrphanUser[]>([]);
  const [loading, setLoading] = useState(false);

  // Incomplete User Modal State
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [selectedOrphan, setSelectedOrphan] = useState<AuthOrphanUser | null>(null);
  const [fullName, setFullName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [section, setSection] = useState("");
  const [phone, setPhone] = useState("");
  const [markAsPaid, setMarkAsPaid] = useState(true);
  const [savingIncomplete, setSavingIncomplete] = useState(false);

  // Scratch Onboard Modal State
  const [showScratchModal, setShowScratchModal] = useState(false);
  const [scratchEmail, setScratchEmail] = useState("");
  const [scratchFullName, setScratchFullName] = useState("");
  const [scratchRollNo, setScratchRollNo] = useState("");
  const [scratchSection, setScratchSection] = useState("");
  const [scratchPhone, setScratchPhone] = useState("");
  const [savingScratch, setSavingScratch] = useState(false);

  // Action Loading states
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      // 1. Load profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;
      setRegistered((profilesData as any) || []);

      // 2. Load auth users without profiles
      const { data: orphansData, error: orphansError } = await supabase
        .rpc("get_auth_users_without_profiles");

      if (orphansError) throw orphansError;
      setIncomplete((orphansData as any) || []);
    } catch (err: any) {
      console.error("Failed to load user lists:", err);
      toast.error(err.message || "Failed to load user lists");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const openIncompleteModal = (user: AuthOrphanUser) => {
    setSelectedOrphan(user);
    setFullName("");
    setRollNo("");
    setSection("");
    setPhone("");
    setMarkAsPaid(true);
    setShowIncompleteModal(true);
  };

  const handleIncompleteRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrphan) return;
    if (!fullName.trim()) {
      toast.error("Full Name is required");
      return;
    }

    const upperRoll = rollNo.trim().toUpperCase();
    const rollNoRegex = /^[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{2}[A-Z0-9]{2}$/;
    if (!upperRoll) {
      toast.error("Roll Number is required");
      return;
    } else if (!rollNoRegex.test(upperRoll)) {
      toast.error("Roll Number must match format (e.g. 24R91A6760 or 25R91A05B5)");
      return;
    }

    setSavingIncomplete(true);
    try {
      const branchCode = upperRoll.substring(6, 8);
      const isCsds = branchCode === "67";
      const finalSection = section.trim() === "" ? "N/A" : section.trim().toUpperCase();

      // 1. Insert Profile
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: selectedOrphan.id,
          roll_no: upperRoll,
          full_name: fullName.trim(),
          email: selectedOrphan.email,
          phone: phone.trim() || null,
          branch_code: branchCode,
          is_csds: isCsds,
          section: finalSection,
          verification_status: markAsPaid ? "approved" : "pending",
          access_expires_at: markAsPaid
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            : null,
        });

      if (profileError) throw profileError;

      // 2. Insert User Role
      await supabase.from("user_roles").upsert({
        user_id: selectedOrphan.id,
        role: "member",
      });

      // 3. If marked as paid, insert Payment record
      if (markAsPaid) {
        await supabase.from("payments").insert({
          profile_id: selectedOrphan.id,
          amount: 300,
          status: "paid",
          utr: "MANUAL-ADMIN",
          screenshot_url: null,
        });
      }

      toast.success("Profile created successfully!");
      setShowIncompleteModal(false);
      await loadData();
    } catch (err: any) {
      console.error("Manual registration failed:", err);
      toast.error(err.message || "Failed to create profile");
    } finally {
      setSavingIncomplete(false);
    }
  };

  const handleScratchOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scratchEmail.trim() || !scratchFullName.trim() || !scratchRollNo.trim()) {
      toast.error("Email, Name, and Roll Number are required");
      return;
    }

    const upperRoll = scratchRollNo.trim().toUpperCase();
    const rollNoRegex = /^[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{2}[A-Z0-9]{2}$/;
    if (!rollNoRegex.test(upperRoll)) {
      toast.error("Roll Number must match format (e.g. 24R91A6760 or 25R91A05B5)");
      return;
    }

    setSavingScratch(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-action", {
        body: {
          action: "onboard_student_scratch",
          email: scratchEmail.trim(),
          full_name: scratchFullName.trim(),
          roll_no: upperRoll,
          section: scratchSection.trim(),
          phone: scratchPhone.trim(),
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || "Failed to onboard user");
      }

      toast.success(`Successfully onboarded and approved ${scratchFullName}!`);
      setShowScratchModal(false);
      // Reset fields
      setScratchEmail("");
      setScratchFullName("");
      setScratchRollNo("");
      setScratchSection("");
      setScratchPhone("");
      await loadData();
    } catch (err: any) {
      console.error("Scratch onboarding failed:", err);
      toast.error(err.message || "Failed to onboard student");
    } finally {
      setSavingScratch(false);
    }
  };

  const handleRemoveUser = async (userId: string, name: string) => {
    const confirmDelete = window.confirm(
      `⚠️ WARNING:\nAre you sure you want to permanently remove and delete student "${name}"?\n\nThis will delete their login credentials, progress, payment logs, and profiles completely. They will need to register again from scratch.`
    );
    if (!confirmDelete) return;

    setDeletingUserId(userId);
    try {
      const { data, error } = await supabase.functions.invoke("admin-action", {
        body: {
          action: "delete",
          profile_id: userId,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || "Failed to delete user");
      }

      toast.success(`Successfully removed student "${name}"`);
      await loadData();
    } catch (err: any) {
      console.error("Failed to remove user:", err);
      toast.error(err.message || "Failed to remove user");
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">User Management</h2>
          <p className="mt-1 text-sm text-muted-foreground">Monitor, onboard, or remove student registrations.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowScratchModal(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 shadow-glow"
          >
            <UserPlus className="h-3.5 w-3.5" /> Onboard student
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold hover:bg-secondary disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("registered")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "registered"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Registered Members ({registered.length})
        </button>
        <button
          onClick={() => setActiveTab("incomplete")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "incomplete"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Incomplete Signups ({incomplete.length})
        </button>
      </div>

      {loading && registered.length === 0 && incomplete.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-mono">Loading user lists...</p>
        </div>
      ) : activeTab === "registered" ? (
        <div className="rounded-xl border border-border bg-surface shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-3.5 font-bold">Name</th>
                  <th className="p-3.5 font-bold">Roll Number</th>
                  <th className="p-3.5 font-bold">Section</th>
                  <th className="p-3.5 font-bold">Email</th>
                  <th className="p-3.5 font-bold">Phone</th>
                  <th className="p-3.5 font-bold">Joined</th>
                  <th className="p-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {registered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted-foreground">
                      No registered members found.
                    </td>
                  </tr>
                ) : (
                  registered.map((r) => (
                    <tr key={r.id} className="hover:bg-secondary/15 transition-colors">
                      <td className="p-3.5 font-semibold text-foreground">{r.full_name || "—"}</td>
                      <td className="p-3.5 font-mono text-xs text-primary">{r.roll_no || "—"}</td>
                      <td className="p-3.5 font-mono text-xs">{r.section || "—"}</td>
                      <td className="p-3.5 text-muted-foreground">{r.email || "—"}</td>
                      <td className="p-3.5 text-muted-foreground font-mono text-xs">{r.phone || "—"}</td>
                      <td className="p-3.5 text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleRemoveUser(r.id, r.full_name || r.roll_no || "Student")}
                          disabled={deletingUserId === r.id}
                          className="inline-flex items-center gap-1 rounded bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/15 px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                        >
                          <Trash2 className="h-3 w-3" />
                          {deletingUserId === r.id ? "Removing..." : "Remove"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-3.5 font-bold">Email</th>
                  <th className="p-3.5 font-bold">Created At</th>
                  <th className="p-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {incomplete.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-muted-foreground">
                      No incomplete signups found. All logged in users have profiles.
                    </td>
                  </tr>
                ) : (
                  incomplete.map((i) => (
                    <tr key={i.id} className="hover:bg-secondary/15 transition-colors">
                      <td className="p-3.5 font-medium text-foreground">{i.email}</td>
                      <td className="p-3.5 text-muted-foreground">
                        {new Date(i.created_at).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => openIncompleteModal(i)}
                          className="inline-flex items-center gap-1 rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 shadow-glow"
                        >
                          <UserPlus className="h-3 w-3" /> Complete Profile
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Incomplete User Modal */}
      {showIncompleteModal && selectedOrphan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-glow relative animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-display text-lg font-bold">Manually Create Profile</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Email: <span className="font-mono text-primary font-semibold">{selectedOrphan.email}</span>
            </p>

            <form onSubmit={handleIncompleteRegister} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input w-full"
                  placeholder="e.g. D. SAI KRISHNA"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold">Roll Number</label>
                <input
                  type="text"
                  required
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  className="input w-full uppercase"
                  placeholder="e.g. 24R91A6760"
                  maxLength={10}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold">Section</label>
                  <input
                    type="text"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="input w-full uppercase"
                    placeholder="e.g. A, B or N/A"
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold">Phone (optional)</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input w-full"
                    placeholder="e.g. 9876543210"
                    maxLength={15}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-border pt-4">
                <input
                  type="checkbox"
                  id="markPaid"
                  checked={markAsPaid}
                  onChange={(e) => setMarkAsPaid(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="markPaid" className="text-sm font-semibold select-none flex items-center gap-1 cursor-pointer">
                  Approve & Mark as Paid (300 INR) <Check className="h-3.5 w-3.5 text-emerald-500" />
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIncompleteModal(false)}
                  disabled={savingIncomplete}
                  className="rounded-lg border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingIncomplete}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 shadow-glow disabled:opacity-50 inline-flex items-center gap-1"
                >
                  {savingIncomplete ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Onboard Student From Scratch Modal */}
      {showScratchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-glow relative animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-display text-lg font-bold">Onboard Student from Scratch</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              This registers their credentials and activates their database profiles instantly.
            </p>

            <form onSubmit={handleScratchOnboard} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold">Email Address</label>
                <input
                  type="email"
                  required
                  value={scratchEmail}
                  onChange={(e) => setScratchEmail(e.target.value)}
                  className="input w-full"
                  placeholder="student@gmail.com"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold">Full Name</label>
                <input
                  type="text"
                  required
                  value={scratchFullName}
                  onChange={(e) => setScratchFullName(e.target.value)}
                  className="input w-full"
                  placeholder="e.g. SANNITH REDDY"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold">Roll Number</label>
                <input
                  type="text"
                  required
                  value={scratchRollNo}
                  onChange={(e) => setScratchRollNo(e.target.value)}
                  className="input w-full uppercase"
                  placeholder="e.g. 25R91A6759"
                  maxLength={10}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold">Section</label>
                  <input
                    type="text"
                    value={scratchSection}
                    onChange={(e) => setScratchSection(e.target.value)}
                    className="input w-full uppercase"
                    placeholder="e.g. A, B or N/A"
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold">Phone (optional)</label>
                  <input
                    type="text"
                    value={scratchPhone}
                    onChange={(e) => setScratchPhone(e.target.value)}
                    className="input w-full"
                    placeholder="e.g. 9876543210"
                    maxLength={15}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowScratchModal(false)}
                  disabled={savingScratch}
                  className="rounded-lg border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingScratch}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 shadow-glow disabled:opacity-50 inline-flex items-center gap-1"
                >
                  {savingScratch ? "Onboarding..." : "Onboard Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`.input{width:100%;border-radius:0.5rem;border:1px solid var(--color-border);background:var(--color-input);padding:0.5rem 0.75rem;font-size:0.85rem;color:var(--color-foreground);outline:none;transition:border-color .15s}.input:focus{border-color:var(--color-primary)}`}</style>
    </div>
  );
}
