import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;

    if (!razorpayKeySecret) {
      return new Response(JSON.stringify({ error: "Razorpay secret not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user JWT
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await req.json();

    // Validate required fields
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return new Response(JSON.stringify({ error: "Missing required payment fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify HMAC-SHA256 signature: order_id + "|" + payment_id
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(razorpayKeySecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(`${razorpay_order_id}|${razorpay_payment_id}`)
    );
    const generatedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (generatedSignature !== razorpay_signature) {
      console.error("Signature mismatch — potential fraud attempt", {
        user_id: user.id,
        generated: generatedSignature,
        received: razorpay_signature,
      });
      return new Response(JSON.stringify({ error: "Payment signature verification failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Signature valid — record payment and auto-approve profile
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check for existing payment record
    const { data: existingPayment } = await adminClient
      .from("payments")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();

    let paymentError;
    if (existingPayment) {
      const { error } = await adminClient
        .from("payments")
        .update({
          status: "paid",
          amount: 30000,
          razorpay_payment_id,
          razorpay_order_id,
          razorpay_signature,
          utr: null,
          screenshot_url: null,
        })
        .eq("profile_id", user.id);
      paymentError = error;
    } else {
      const { error } = await adminClient
        .from("payments")
        .insert({
          profile_id: user.id,
          status: "paid",
          amount: 30000,
          razorpay_payment_id,
          razorpay_order_id,
          razorpay_signature,
        });
      paymentError = error;
    }

    if (paymentError) {
      console.error("Failed to record payment:", paymentError);
      return new Response(JSON.stringify({ error: "Failed to record payment in database" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auto-approve the profile — Razorpay payments are cryptographically verified
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ verification_status: "approved" })
      .eq("id", user.id);

    if (profileError) {
      console.error("Failed to auto-approve profile:", profileError);
      // Don't fail the whole request — payment is recorded, admin can manually approve
    } else {
      console.log(`Auto-approved profile for user ${user.id} after successful Razorpay payment ${razorpay_payment_id}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in verify-razorpay-payment:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
