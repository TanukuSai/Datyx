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
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const { full_name, roll_no, phone, section } = await req.json();

    // 1. Validate full_name
    if (!full_name || typeof full_name !== "string" || full_name.trim() === "") {
      return new Response(JSON.stringify({ error: "Full Name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Validate and format roll_no
    if (!roll_no || typeof roll_no !== "string") {
      return new Response(JSON.stringify({ error: "Roll Number is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upperRollNo = roll_no.trim().toUpperCase();
    const rollNoRegex = /^[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{2}[A-Z0-9]{2}$/;
    if (!rollNoRegex.test(upperRollNo)) {
      return new Response(JSON.stringify({ error: "Invalid Roll Number format. Expected format: 24R91A6760 or 25R91A05B5" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Compute branch_code and is_csds (classification remains)
    const branchCode = upperRollNo.substring(6, 8);
    const isCsds = branchCode === "67";

    // 4. Clean and normalize section (default to N/A)
    let finalSection = "N/A";
    if (section && typeof section === "string" && section.trim() !== "") {
      const cleanSec = section.trim().toUpperCase();
      if (cleanSec !== "N/A") {
        finalSection = cleanSec;
      }
    }

    // 5. Connect as Admin client to query/write profiles
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if roll number already exists
    const { data: existingProfile, error: checkError } = await adminClient
      .from("profiles")
      .select("id")
      .eq("roll_no", upperRollNo)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking roll number duplication:", checkError);
    }

    if (existingProfile) {
      return new Response(JSON.stringify({ error: "This Roll Number is already registered." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. Insert the profile (TRIAL ACCESS: auto-approve everyone until July 26, 2026)
    const trialExpires = "2026-07-26T18:30:00.000Z";
    const { error: insertError } = await adminClient.from("profiles").insert({
      id: user.id,
      roll_no: upperRollNo,
      full_name: full_name.trim(),
      email: user.email || null,
      phone: phone ? phone.trim() : null,
      branch_code: branchCode,
      is_csds: isCsds,
      section: finalSection,
      access_expires_at: trialExpires,
      verification_status: "approved",
    });

    if (!insertError) {
      // Create Paid Trial Payment record
      await adminClient.from("payments").insert({
        profile_id: user.id,
        amount: 0,
        status: "paid",
        utr: "TRIAL-ACCESS",
        screenshot_url: null
      });
    }

    if (insertError) {
      console.error("Error inserting profile:", insertError);
      return new Response(JSON.stringify({ error: insertError.message || "Failed to save profile registration" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Assign default 'member' role for the user
    const { error: roleError } = await adminClient.from("user_roles").insert({
      user_id: user.id,
      role: "member",
    });

    if (roleError) {
      console.error("Error assigning default user role:", roleError);
    }

    return new Response(JSON.stringify({ is_csds: isCsds }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Catastrophic error in submit-registration edge function:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
