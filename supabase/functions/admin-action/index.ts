import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller JWT
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized user token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Connect as Admin client to check roles and update
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller is admin
    const { data: isAdmin, error: rpcError } = await adminClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (rpcError || !isAdmin) {
      console.error("Access denied or RPC error:", rpcError);
      return new Response(JSON.stringify({ error: "Access denied. Admin role required." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { profile_id, action } = await req.json();

    if (!profile_id || !action) {
      return new Response(JSON.stringify({ error: "Missing profile_id or action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action !== "approve" && action !== "reject" && action !== "delete") {
      return new Response(JSON.stringify({ error: "Invalid action. Must be 'approve', 'reject', or 'delete'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(profile_id);
      if (deleteError) {
        console.error("Error deleting user account:", deleteError);
        return new Response(JSON.stringify({ error: deleteError.message || "Failed to delete user account" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log(`Admin ${user.id} deleted user account ${profile_id}`);
      return new Response(JSON.stringify({ success: true, status: "deleted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const statusValue = action === "approve" ? "approved" : "rejected";
    const paymentStatusValue = action === "approve" ? "paid" : "failed";

    // Update target profile status
    const { error: updateError } = await adminClient
      .from("profiles")
      .update({ verification_status: statusValue })
      .eq("id", profile_id);

    // Synchronize payment status
    const { error: paymentError } = await adminClient
      .from("payments")
      .update({ status: paymentStatusValue })
      .eq("profile_id", profile_id);

    if (paymentError) {
      console.warn("Warning: failed to update payment status sync:", paymentError);
    }

    if (updateError) {
      console.error("Error updating profile status:", updateError);
      return new Response(JSON.stringify({ error: updateError.message || "Failed to update profile status" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Admin ${user.id} updated profile ${profile_id} status to ${statusValue}`);

    return new Response(JSON.stringify({ success: true, status: statusValue }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Catastrophic error in admin-action edge function:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
