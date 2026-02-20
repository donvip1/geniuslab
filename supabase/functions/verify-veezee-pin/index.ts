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
    // Placeholder for Veezee PIN verification API
    // Will be implemented in Phase 2 once API details are provided
    const { pin } = await req.json();

    console.log("Veezee PIN verification requested for:", pin);

    return new Response(
      JSON.stringify({
        error: "Veezee PIN verification is not yet implemented. Please use a manual PIN or subscribe via Paystack.",
        status: "not_implemented",
      }),
      {
        status: 501,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
