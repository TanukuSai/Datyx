import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "https://esm.sh/resend@3.2.0";

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

    // Verify User JWT
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

    const { utr, screenshot_url } = await req.json();

    if (!utr || typeof utr !== "string" || utr.trim() === "") {
      return new Response(JSON.stringify({ error: "UTR is required and must be a string." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!screenshot_url || typeof screenshot_url !== "string" || screenshot_url.trim() === "") {
      return new Response(JSON.stringify({ error: "Screenshot URL is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Connect as Admin client to insert into database
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch existing payment for this user, if any
    const { data: existingPayment } = await adminClient
      .from("payments")
      .select("*")
      .eq("profile_id", user.id)
      .maybeSingle();

    let dbResult;
    if (existingPayment) {
      dbResult = await adminClient
        .from("payments")
        .update({
          utr: utr.trim(),
          screenshot_url,
          amount: 30000,
          status: "created" // keep status as created/pending, wait for admin verification
        })
        .eq("profile_id", user.id);
    } else {
      dbResult = await adminClient
        .from("payments")
        .insert({
          profile_id: user.id,
          utr: utr.trim(),
          screenshot_url,
          amount: 30000,
          status: "created"
        });
    }

    if (dbResult.error) {
      console.error("Database payment insert/update error:", dbResult.error);
      return new Response(JSON.stringify({ error: dbResult.error.message || "Failed to save payment record" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch details for email
    const { data: profile } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    // Send email using Resend if key is available
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const emailRes = await resend.emails.send({
          from: "DATYX Club <onboarding@resend.dev>",
          to: "datyxclub@gmail.com",
          subject: `Payment Verification: ${profile?.full_name || user.email} (${profile?.roll_no || "N/A"})`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #4F46E5;">DATYX Payment Submission</h2>
              <p>A student has submitted payment verification details for membership approval.</p>
              
              <h4 style="border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 24px;">Student Details</h4>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; width: 120px;">Name:</td>
                  <td style="padding: 6px 0;">${profile?.full_name || "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold;">Roll Number:</td>
                  <td style="padding: 6px 0;">${profile?.roll_no || "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold;">Branch Code:</td>
                  <td style="padding: 6px 0;">${profile?.branch_code || "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold;">Email:</td>
                  <td style="padding: 6px 0;">${user.email || "N/A"}</td>
                </tr>
              </table>

              <h4 style="border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 24px;">Transaction Details</h4>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; width: 120px;">UTR String:</td>
                  <td style="padding: 6px 0; font-family: monospace; font-size: 15px; color: #111;">${utr}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold;">Screenshot:</td>
                  <td style="padding: 6px 0;"><a href="${screenshot_url}" target="_blank" style="color: #4F46E5; text-decoration: underline;">View Uploaded Screenshot</a></td>
                </tr>
              </table>
              
              <div style="margin-top: 30px; text-align: center;">
                <a href="https://gkspofinzhhqiygzhtfu.supabase.co/dashboard" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">Go to Admin Dashboard</a>
              </div>
            </div>
          `,
        });
        console.log("Email dispatch completed:", emailRes);
      } catch (emailErr) {
        console.error("Email send failed:", emailErr);
      }
    } else {
      console.warn("RESEND_API_KEY is not defined. Database record updated but email notification skipped.");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in submit-payment function:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
