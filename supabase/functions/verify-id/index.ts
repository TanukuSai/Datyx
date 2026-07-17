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

    const { back } = await req.json();
    if (!back) {
      return new Response(JSON.stringify({ error: "Missing ID card back image" }), {
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

    const backUri = ensureDataUri(back);

    // Call Mistral Pixtral-12B for back image
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

    const backPrompt = `You are an AI assistant analyzing the BACK side of a student ID card.
Extract the student's roll number (which is usually a 10-character code matching a pattern like 25R91A6626, printed below a barcode) and their contact phone number (which is printed after "CONTACT NO").
Return ONLY raw JSON, with no prose, explanation, or markdown fences. The JSON must match the following structure:
{
  "roll_no": string or null,
  "phone": string or null
}`;

    const res = await callMistral(backUri, backPrompt);

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

    const parsedData = res.content ? cleanAndParseJson(res.content) : null;

    if (!parsedData) {
      console.error("Call failed or returned unparseable JSON.", { res });
      return new Response(
        JSON.stringify({
          error: "Could not read ID details from back image",
          details: { error: res.error },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const responsePayload = {
      full_name: null,
      roll_no: parsedData.roll_no || null,
      phone: parsedData.phone || null,
      valid_until: null,
    };

    return new Response(JSON.stringify(responsePayload), {
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
