import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET") || "placeholder_webhook_secret";
    const signature = req.headers.get("x-razorpay-signature");

    const rawBody = await req.text();

    // Verify signature if not using placeholder
    if (secret && secret !== "placeholder_webhook_secret") {
      if (!signature) {
        console.error("Webhook signature header missing");
        return new Response("Missing signature", { status: 400 });
      }

      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const signatureBytes = await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(rawBody)
      );
      const computedSignature = Array.from(new Uint8Array(signatureBytes))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (computedSignature !== signature) {
        console.error("Webhook signature verification failed");
        return new Response("Signature mismatch", { status: 400 });
      }
    } else {
      console.log("Bypassing signature check due to placeholder webhook secret");
    }

    const body = JSON.parse(rawBody);
    console.log("Received webhook event:", body.event);

    if (body.event === "payment.captured") {
      const paymentEntity = body.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (!orderId) {
        console.error("Missing order ID in webhook payload");
        return new Response("Missing order ID", { status: 400 });
      }

      // Fetch payment record
      const { data: payment, error: fetchError } = await adminClient
        .from("payments")
        .select("*")
        .eq("razorpay_order_id", orderId)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching payment record:", fetchError);
        return new Response("Internal database error", { status: 500 });
      }

      if (!payment) {
        console.error("Payment record not found for order:", orderId);
        return new Response("Payment not found", { status: 200 }); // Stop retries
      }

      // Idempotency check
      if (payment.status === "paid") {
        console.log("Payment already processed and marked paid");
        return new Response("OK", { status: 200 });
      }

      // Update payment record to status 'paid'
      const { error: paymentUpdateError } = await adminClient
        .from("payments")
        .update({
          status: "paid",
          razorpay_payment_id: paymentId,
        })
        .eq("id", payment.id);

      if (paymentUpdateError) {
        console.error("Error updating payment status:", paymentUpdateError);
        return new Response("Database error updating payment", { status: 500 });
      }

      // Set user's profile verification_status to 'approved'
      const { error: profileUpdateError } = await adminClient
        .from("profiles")
        .update({
          verification_status: "approved",
        })
        .eq("id", payment.profile_id);

      if (profileUpdateError) {
        console.error("Error updating profile status:", profileUpdateError);
        return new Response("Database error updating profile", { status: 500 });
      }

      console.log(`Payment capture and profile approval completed successfully for user ${payment.profile_id}`);
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return new Response(err instanceof Error ? err.message : String(err), { status: 500 });
  }
});
