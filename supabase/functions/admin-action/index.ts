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
      console.log(`Admin ${user.id} initiating explicit deletion cleanup for user ${profile_id}`);

      // 1. Clean up storage receipt files from payment_screenshots bucket
      try {
        const { data: files, error: listError } = await adminClient.storage
          .from("payment_screenshots")
          .list(profile_id);

        if (listError) {
          console.error("Error listing storage receipt files:", listError);
        } else if (files && files.length > 0) {
          const filesToRemove = files.map((f) => `${profile_id}/${f.name}`);
          const { error: removeError } = await adminClient.storage
            .from("payment_screenshots")
            .remove(filesToRemove);
          if (removeError) {
            console.error("Error removing storage receipt files:", removeError);
          } else {
            console.log(`Cleaned up ${filesToRemove.length} storage files for user ${profile_id}`);
          }
        }
      } catch (storageErr) {
        console.error("Catastrophic storage cleanup error:", storageErr);
      }

      // 2. Delete user account from Supabase Auth first (this will trigger Postgres ON DELETE CASCADE)
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(profile_id);
      if (deleteError) {
        console.error("Error deleting user account from Auth:", deleteError);
        // Fallback: try deleting database rows directly even if auth deletion failed
        try {
          await adminClient.from("user_quest_progress").delete().eq("user_id", profile_id);
          await adminClient.from("payments").delete().eq("profile_id", profile_id);
          await adminClient.from("user_roles").delete().eq("user_id", profile_id);
          await adminClient.from("profiles").delete().eq("id", profile_id);
        } catch (dbErr) {
          console.error("Error running fallback database cleanup:", dbErr);
        }
        return new Response(JSON.stringify({ error: deleteError.message || "Failed to delete user account from Auth" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Admin ${user.id} successfully deleted user account ${profile_id} from Auth`);

      // 3. Cleanup database rows manually just in case cascade didn't catch something
      try {
        await adminClient.from("user_quest_progress").delete().eq("user_id", profile_id);
        await adminClient.from("payments").delete().eq("profile_id", profile_id);
        await adminClient.from("user_roles").delete().eq("user_id", profile_id);
        await adminClient.from("profiles").delete().eq("id", profile_id);
        console.log(`Explicit database table cleanup completed for user ${profile_id}`);
      } catch (dbErr) {
        console.error("Error running explicit database cleanup:", dbErr);
      }

      return new Response(JSON.stringify({ success: true, status: "deleted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const statusValue = action === "approve" ? "approved" : "rejected";
    const paymentStatusValue = action === "approve" ? "paid" : "failed";

    // Update target profile status and access expiration (1 year from approval)
    const accessExpiresAt = action === "approve" 
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() 
      : null;

    const { error: updateError } = await adminClient
      .from("profiles")
      .update({ 
        verification_status: statusValue,
        access_expires_at: accessExpiresAt
      })
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
