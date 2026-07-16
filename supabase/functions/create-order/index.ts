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

    // Verify JWT
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

    // Connect as Admin client to fetch profile & payments
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch caller's profile
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found. Please register first." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Reject if CSD
    if (profile.is_csds) {
      return new Response(JSON.stringify({ error: "CSD members do not require payment." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Reject if a paid payment already exists
    const { data: existingPaidPayment, error: paymentError } = await adminClient
      .from("payments")
      .select("id")
      .eq("profile_id", user.id)
      .eq("status", "paid")
      .maybeSingle();

    if (existingPaidPayment) {
      return new Response(JSON.stringify({ error: "You have already paid for registration." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Create Razorpay order (₹300 -> 30000 paise)
    const keyId = Deno.env.get("RAZORPAY_KEY_ID") || "rzp_test_placeholder_key_id";
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET") || "rzp_test_placeholder_key_secret";

    let orderId = `order_mock_${Math.random().toString(36).substring(2, 15)}`;

    if (
      keyId &&
      keySecret &&
      keyId !== "rzp_test_placeholder_key_id" &&
      keySecret !== "rzp_test_placeholder_key_secret"
    ) {
      try {
        const basicAuth = btoa(`${keyId}:${keySecret}`);
        const response = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${basicAuth}`,
          },
          body: JSON.stringify({
            amount: 30000,
            currency: "INR",
            receipt: `receipt_${user.id}`,
          }),
        });

        if (response.ok) {
          const order = await response.json();
          orderId = order.id;
        } else {
          const errText = await response.text();
          console.error("Razorpay order creation failed:", errText);
        }
      } catch (err) {
        console.error("Failed to connect to Razorpay, using mock order:", err);
      }
    } else {
      console.log("Using mock Razorpay order creation due to placeholder credentials.");
    }

    // 5. Insert payment row with status 'created'
    const { error: insertError } = await adminClient.from("payments").insert({
      profile_id: user.id,
      razorpay_order_id: orderId,
      amount: 30000,
      status: "created",
    });

    if (insertError) {
      console.error("Error inserting payment record:", insertError);
      return new Response(JSON.stringify({ error: "Failed to create order record" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ orderId, keyId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Catastrophic error in create-order edge function:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
