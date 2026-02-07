import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const VEEZEE_API_KEY = Deno.env.get("VEEZEE_API_KEY");
    
    if (!VEEZEE_API_KEY) {
      throw new Error("VEEZEE_API_KEY is not configured");
    }

    const apiUrl = "https://studio--studio-6583429608-f6a92.us-central1.hosted.app/api/bank?level=JAMB%20/%20UTME";
    
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "X-API-KEY": VEEZEE_API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", response.status, errorText);
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching JAMB questions:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to fetch questions" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
