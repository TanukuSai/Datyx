import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Check, X, Shield, RefreshCw, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

type ProfileWithPayments = {
  id: string;
  full_name: string;
  roll_no: string;
  branch_code: string;
  is_csds: boolean;
  verification_status: "pending" | "approved" | "rejected";
  access_expires_at: string | null;
  created_at: string;
  payments: Array<{ status: string }> | null;
};

function getDepartmentName(branchCode: string): string {
  switch (branchCode) {
    case "02": return "EEE";
    case "04": return "ECE";
    case "05": return "CSE";
    case "66": return "CSM";
    case "67": return "CSD";
    case "12": return "IT";
    default: return `DEPT-${branchCode}`;
  }
}

function AdminDashboard() {
  const [profiles, setProfiles] = useState<ProfileWithPayments[]>([]);
  const [mappings, setMappings] = useState<Array<{ batch_code: string; current_year: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  async function loadProfiles() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          roll_no,
          branch_code,
          is_csds,
          section,
          phone,
          email,
          verification_status,
          access_expires_at,
          created_at,
          payments (status, utr, screenshot_url)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setProfiles((data as any) || []);
    } catch (err: any) {
      console.error("Failed to load profiles:", err);
      toast.error(err?.message || "Failed to load profiles");
    } finally {
      setLoading(false);
    }
  }

  async function loadMappings() {
    try {
      const { data, error } = await supabase
        .from("batch_year_mappings")
        .select("*")
        .order("current_year", { ascending: true });
      if (error) throw error;
      setMappings(data || []);
    } catch (err: any) {
      console.error("Failed to load batch mappings:", err);
    }
  }

  useEffect(() => {
    loadProfiles();
    loadMappings();
  }, []);

  const handleAction = async (profileId: string, action: "approve" | "reject" | "delete") => {
    if (action === "delete") {
      const confirmDelete = window.confirm(
        "Are you sure you want to permanently delete this user profile? This will remove all their data from the authentication database and profiles."
      );
      if (!confirmDelete) return;
    }

    setActionId(profileId);
    try {
      const { data, error } = await supabase.functions.invoke("admin-action", {
        body: { profile_id: profileId, action },
      });

      if (error) {
        throw error;
      }

      toast.success(
        action === "delete"
          ? "User account deleted successfully."
          : `Profile status successfully updated to ${data.status}!`
      );
      await loadProfiles();
    } catch (err: any) {
      console.error("Admin action failed:", err);
      toast.error(err?.message || `Failed to ${action} profile`);
    } finally {
      setActionId(null);
    }
  };

  const handleGraduate = async (batchCode: string, currentYear: number) => {
    const nextYear = currentYear + 1;
    const yearLabels = ["", "1st Year", "2nd Year", "3rd Year", "4th Year", "Graduated (Alumni)"];
    const yearLabel = nextYear === 5 ? "Alumni" : yearLabels[nextYear];
    const confirmGrad = window.confirm(
      `Are you sure you want to graduate Batch '${batchCode}' (currently ${yearLabels[currentYear]}) to ${yearLabel}?`
    );
    if (!confirmGrad) return;

    try {
      const { error } = await supabase
        .from("batch_year_mappings")
        .update({ current_year: nextYear })
        .eq("batch_code", batchCode);

      if (error) throw error;
      toast.success(`Batch ${batchCode} successfully graduated to ${yearLabel}!`);
      await loadMappings();
      await loadProfiles();
    } catch (err: any) {
      console.error("Failed to graduate batch:", err);
      toast.error(err.message || "Failed to graduate batch");
    }
  };

  const handleExportCsv = () => {
    const headers = ["Roll number", "Name", "Contact Number", "Email", "Department", "Year of education"];
    
    const escapeCsv = (val: string | null | undefined) => {
      if (val === null || val === undefined) return '""';
      const clean = String(val).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = profiles.map((p) => {
      const deptName = getDepartmentName(p.branch_code);
      const section = (p as any).section || "N/A";
      const departmentFormatted = section === "N/A" ? deptName : `${deptName}-${section}`;

      const batchCode = p.roll_no.substring(0, 2);
      const mapping = mappings.find((m) => m.batch_code === batchCode);
      const yearLabels = ["", "1st Year", "2nd Year", "3rd Year", "4th Year", "Graduated"];
      const yearLabel = mapping ? yearLabels[mapping.current_year] : "Unknown";

      const contactNum = (p as any).phone || "N/A";
      const email = (p as any).email || "N/A";

      return [
        escapeCsv(p.roll_no),
        escapeCsv(p.full_name),
        escapeCsv(contactNum),
        escapeCsv(email),
        escapeCsv(departmentFormatted),
        escapeCsv(yearLabel),
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `DATYX_Enrolled_Students_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export downloaded successfully!");
  };

  const getPaymentStatus = (p: any) => {
    const payList = p.payments || [];
    
    // Find manual payment details if they exist
    const manualPay = payList.find((pay: any) => pay.utr || pay.screenshot_url);
    const hasPaid = payList.some((pay: any) => pay.status === "paid");
    
    return (
      <div className="flex flex-col items-center gap-1.5">
        {hasPaid ? (
          <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-300 px-2 py-0.5 text-xs font-semibold">Paid</span>
        ) : manualPay ? (
          <span className="rounded-full bg-amber-50 text-amber-700 border border-amber-300 px-2 py-0.5 text-xs font-medium">Pending Check</span>
        ) : (
          <span className="rounded-full bg-red-50 text-red-700 border border-red-300 px-2 py-0.5 text-xs font-medium">Unpaid</span>
        )}
        
        {manualPay && (
          <div className="text-[11px] text-muted-foreground border-t border-border/50 pt-1 text-center font-mono mt-1 space-y-0.5">
            <div>UTR: {manualPay.utr || "N/A"}</div>
            {manualPay.screenshot_url && (
              <div>
                <a
                  href={manualPay.screenshot_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-semibold"
                >
                  View Screenshot ↗
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 text-xs font-semibold">Approved</span>;
      case "rejected":
        return <span className="rounded-full bg-red-100 text-red-800 border border-red-300 px-2.5 py-0.5 text-xs font-semibold">Rejected</span>;
      default:
        return <span className="rounded-full bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 text-xs font-semibold animate-pulse">Pending</span>;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Profile Registrations</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage and verify membership profiles.</p>
        </div>
        <div className="inline-flex gap-2">
          <button
            onClick={handleExportCsv}
            disabled={loading || profiles.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/10 px-4 py-2 text-xs font-semibold text-primary disabled:opacity-50 transition-colors"
          >
            📥 Export CSV
          </button>
          <button
            onClick={loadProfiles}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold hover:bg-secondary disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {loading && profiles.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-mono">Loading profiles...</p>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-border bg-surface shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-secondary text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-3.5 font-bold">Name</th>
                  <th className="p-3.5 font-bold">Roll No</th>
                  <th className="p-3.5 font-bold text-center">Branch</th>
                  <th className="p-3.5 font-bold text-center">Payment</th>
                  <th className="p-3.5 font-bold text-center">Status</th>
                  <th className="p-3.5 font-bold">Expires At</th>
                  <th className="p-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {profiles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground font-medium">
                      No student profiles registered yet.
                    </td>
                  </tr>
                ) : (
                  profiles.map((p) => {
                    const isBusy = actionId === p.id;
                    return (
                      <tr key={p.id} className="hover:bg-secondary/15 transition-colors">
                        <td className="p-3.5 font-semibold text-foreground">{p.full_name}</td>
                        <td className="p-3.5 font-mono text-xs">{p.roll_no}</td>
                        <td className="p-3.5 text-center">
                          <span className="rounded-md border border-border bg-background px-2.5 py-0.5 text-xs font-semibold">
                            {getDepartmentName(p.branch_code)}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">{getPaymentStatus(p)}</td>
                        <td className="p-3.5 text-center">{getStatusBadge(p.verification_status)}</td>
                        <td className="p-3.5 text-muted-foreground font-mono text-xs">
                          {p.access_expires_at
                            ? new Date(p.access_expires_at).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {p.verification_status !== "approved" ? (
                              <button
                                onClick={() => handleAction(p.id, "approve")}
                                disabled={isBusy || loading}
                                className="inline-flex items-center gap-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 px-2.5 py-1 text-xs font-semibold disabled:opacity-50 transition-colors"
                                title="Approve Registration"
                              >
                                <Check className="h-3 w-3" /> Approve
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAction(p.id, "reject")}
                                disabled={isBusy || loading}
                                className="inline-flex items-center gap-1 rounded-full bg-amber-500 hover:bg-amber-600 text-white border border-amber-600 px-2.5 py-1 text-xs font-semibold disabled:opacity-50 transition-colors"
                                title="Remove Approval (Reject)"
                              >
                                <X className="h-3 w-3" /> Remove Approval
                              </button>
                            )}
                            <button
                              onClick={() => handleAction(p.id, "delete")}
                              disabled={isBusy || loading}
                              className="inline-flex items-center gap-1 rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2.5 py-1 text-xs font-semibold disabled:opacity-50 transition-colors"
                              title="Delete User Account"
                            >
                              <Trash2 className="h-3 w-3" /> Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Year of Education Panel */}
      <div className="mt-8 rounded-xl border border-border bg-surface p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-bold">Year of Education Management</h3>
            <p className="text-xs text-muted-foreground mt-0.5 font-sans">Graduate batches of students as they progress through their academic years.</p>
          </div>
          
          {/* Form to add a new batch if needed */}
          <AddBatchForm onAdd={loadMappings} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {mappings.map((m) => {
            const yearLabels = ["", "1st Year", "2nd Year", "3rd Year", "4th Year", "Graduated (Alumni)"];
            const label = yearLabels[m.current_year] || "Unknown";
            return (
              <div key={m.batch_code} className="rounded-lg border border-border bg-secondary/10 p-4 flex flex-col justify-between gap-3 shadow-sm">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-primary/15 text-primary font-mono font-bold">
                    Batch {m.batch_code}
                  </span>
                  <p className="text-sm font-semibold mt-2 text-foreground">Current: {label}</p>
                </div>
                {m.current_year < 5 ? (
                  <button
                    onClick={() => handleGraduate(m.batch_code, m.current_year)}
                    className="w-full text-center rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 shadow-glow transition-all"
                  >
                    Graduate to {yearLabels[m.current_year + 1]}
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground italic text-center block pt-1.5">Batch Completed</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AddBatchForm({ onAdd }: { onAdd: () => void }) {
  const [newBatchCode, setNewBatchCode] = useState("");
  const [newBatchYear, setNewBatchYear] = useState(1);
  const [adding, setAdding] = useState(false);

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchCode.trim() || newBatchCode.trim().length !== 2) {
      toast.error("Batch code must be 2 characters (e.g. 26)");
      return;
    }
    
    setAdding(true);
    try {
      const { error } = await supabase
        .from("batch_year_mappings")
        .insert({
          batch_code: newBatchCode.trim(),
          current_year: newBatchYear
        });
        
      if (error) throw error;
      toast.success(`Batch ${newBatchCode} added successfully!`);
      setNewBatchCode("");
      onAdd();
    } catch (err: any) {
      console.error("Failed to add batch mapping:", err);
      toast.error(err.message || "Failed to add batch mapping");
    } finally {
      setAdding(false);
    }
  };

  return (
    <form onSubmit={handleAddBatch} className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        placeholder="Batch (e.g. 26)"
        value={newBatchCode}
        onChange={(e) => setNewBatchCode(e.target.value)}
        maxLength={2}
        className="rounded border border-border bg-white px-2.5 py-1.5 text-xs font-mono w-28 uppercase outline-none focus:border-primary"
      />
      <select
        value={newBatchYear}
        onChange={(e) => setNewBatchYear(Number(e.target.value))}
        className="rounded border border-border bg-white px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-primary"
      >
        <option value={1}>1st Year</option>
        <option value={2}>2nd Year</option>
        <option value={3}>3rd Year</option>
        <option value={4}>4th Year</option>
        <option value={5}>Graduated</option>
      </select>
      <button
        type="submit"
        disabled={adding}
        className="rounded border border-border bg-white px-3 py-1.5 text-xs font-semibold hover:bg-secondary disabled:opacity-50 transition-colors"
      >
        + Add Batch
      </button>
    </form>
  );
}
