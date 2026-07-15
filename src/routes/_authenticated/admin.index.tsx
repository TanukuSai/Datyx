import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Check, X, Shield, RefreshCw } from "lucide-react";

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

function AdminDashboard() {
  const [profiles, setProfiles] = useState<ProfileWithPayments[]>([]);
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
          verification_status,
          access_expires_at,
          created_at,
          payments (status)
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

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleAction = async (profileId: string, action: "approve" | "reject") => {
    setActionId(profileId);
    try {
      const { data, error } = await supabase.functions.invoke("admin-action", {
        body: { profile_id: profileId, action },
      });

      if (error) {
        throw error;
      }

      toast.success(`Profile status successfully updated to ${data.status}!`);
      await loadProfiles();
    } catch (err: any) {
      console.error("Admin action failed:", err);
      toast.error(err?.message || `Failed to ${action} profile`);
    } finally {
      setActionId(null);
    }
  };

  const getPaymentStatus = (p: ProfileWithPayments) => {
    if (p.is_csds) {
      return <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 px-2 py-0.5 text-xs font-semibold">CSDS (Free)</span>;
    }
    const payList = p.payments || [];
    const hasPaid = payList.some((pay) => pay.status === "paid");
    if (hasPaid) {
      return <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-300 px-2 py-0.5 text-xs font-semibold">Paid</span>;
    }
    const hasCreated = payList.some((pay) => pay.status === "created");
    if (hasCreated) {
      return <span className="rounded-full bg-yellow-50 text-yellow-700 border border-yellow-300 px-2 py-0.5 text-xs font-medium">Unpaid (Created)</span>;
    }
    return <span className="rounded-full bg-red-50 text-red-700 border border-red-300 px-2 py-0.5 text-xs font-medium">Unpaid</span>;
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
        <button
          onClick={loadProfiles}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold hover:bg-secondary disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
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
                          <span className="rounded-md border border-border bg-background px-2 py-0.5 text-xs font-mono">
                            {p.branch_code}
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
                          {p.verification_status === "pending" && (
                            <div className="inline-flex gap-1.5">
                              <button
                                onClick={() => handleAction(p.id, "approve")}
                                disabled={isBusy || loading}
                                className="inline-flex items-center gap-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 px-2.5 py-1 text-xs font-semibold disabled:opacity-50"
                                title="Approve Registration"
                              >
                                <Check className="h-3 w-3" /> Approve
                              </button>
                              <button
                                onClick={() => handleAction(p.id, "reject")}
                                disabled={isBusy || loading}
                                className="inline-flex items-center gap-1 rounded-full bg-red-600 hover:bg-red-700 text-white border border-red-700 px-2.5 py-1 text-xs font-semibold disabled:opacity-50"
                                title="Reject Registration"
                              >
                                <X className="h-3 w-3" /> Reject
                              </button>
                            </div>
                          )}
                          {p.verification_status !== "pending" && (
                            <span className="text-xs text-muted-foreground italic font-medium">Finalized</span>
                          )}
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
    </div>
  );
}
