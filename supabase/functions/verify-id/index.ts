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

    const { front, back } = await req.json();
    if (!front || !back) {
      return new Response(JSON.stringify({ error: "Missing front or back image" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("MISTRAL_API_KEY") || "VD0k51Ee5OtMTMg0LFWX8c9U5Pbsltlh";
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Mistral API Key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Helper to format base64 as Data URI
    const ensureDataUri = (b64: string) => {
      if (b64.startsWith("data:")) return b64;
      return `data:image/jpeg;base64,${b64}`;
    };

    const frontUri = ensureDataUri(front);
    const backUri = ensureDataUri(back);

    // Call Mistral Pixtral-12B for front image
    const callMistral = async (imageUrl: string, promptText: string) => {
      try {
        const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "pixtral-12b",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: promptText },
                  { type: "image_url", image_url: { url: imageUrl } },
                ],
              },
            ],
            response_format: { type: "json_object" },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error("Mistral API error response:", errText);
          return { error: `Mistral status ${response.status}: ${errText}` };
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
          return { error: "Empty response from Mistral" };
        }

        return { content };
      } catch (err) {
        console.error("Error calling Mistral:", err);
        return { error: err instanceof Error ? err.message : String(err) };
      }
    };

    const frontPrompt = `You are an AI assistant analyzing the FRONT side of a student ID card. Extract the student's full name and roll number if present.
Return ONLY raw JSON, with no prose, explanation, or markdown fences. The JSON must match the following structure:
{
  "full_name": string or null,
  "roll_no": string or null,
  "phone": null,
  "valid_until": string or null
}
For roll_no, it is usually a 10-character code matching a pattern like 24R91A6760. Ensure all fields are extracted accurately.`;

    const backPrompt = `You are an AI assistant analyzing the BACK side of a student ID card. Extract the student's phone number and the validity/expiry year if present.
Return ONLY raw JSON, with no prose, explanation, or markdown fences. The JSON must match the following structure:
{
  "full_name": null,
  "roll_no": null,
  "phone": string or null,
  "valid_until": string or null
}
For valid_until, extract the 4-digit expiry/validity year (e.g. 2028). Ensure all fields are extracted accurately.`;

    // Execute API calls in parallel
    const [frontRes, backRes] = await Promise.all([
      callMistral(frontUri, frontPrompt),
      callMistral(backUri, backPrompt),
    ]);

    const cleanAndParseJson = (text: string) => {
      let cleaned = text.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(json)?/i, "").replace(/```$/i, "").trim();
      }
      try {
        return JSON.parse(cleaned);
      } catch (err) {
        console.error("Failed to parse JSON directly:", cleaned, err);
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            return JSON.parse(match[0]);
          } catch (innerErr) {
            console.error("Regex match JSON parse failed:", innerErr);
          }
        }
        return null;
      }
    };

    const frontData = frontRes.content ? cleanAndParseJson(frontRes.content) : null;
    const backData = backRes.content ? cleanAndParseJson(backRes.content) : null;

    if (!frontData && !backData) {
      console.error("Both calls failed or returned unparseable JSON.", { frontRes, backRes });
      return new Response(
        JSON.stringify({
          error: "Could not read ID details",
          details: { frontError: frontRes.error, backError: backRes.error },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Merge results preferring non-null values
    const merged = {
      full_name: frontData?.full_name || backData?.full_name || null,
      roll_no: frontData?.roll_no || backData?.roll_no || null,
      phone: frontData?.phone || backData?.phone || null,
      valid_until: frontData?.valid_until || backData?.valid_until || null,
    };

    return new Response(JSON.stringify(merged), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Catastrophic error in verify-id edge function:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
