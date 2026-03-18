import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// This function receives pre-fetched image data from the client
// and updates cached_api_questions with image_url values
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { updates } = await req.json();
    // updates: Array of { question_text, image_url, subject, exam_level }

    if (!Array.isArray(updates) || updates.length === 0) {
      return new Response(JSON.stringify({ success: true, updated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalUpdated = 0;

    for (const item of updates) {
      if (!item.question_text || !item.image_url) continue;

      const { data, error } = await supabase
        .from("cached_api_questions")
        .update({ image_url: item.image_url })
        .eq("subject", item.subject || "Physics")
        .eq("exam_level", item.exam_level || "JAMB / UTME")
        .eq("question_text", item.question_text)
        .is("image_url", null)
        .select("id");

      if (!error && data && data.length > 0) {
        totalUpdated += data.length;
      }
    }

    console.log(`Backfill: received ${updates.length} updates, applied ${totalUpdated}`);

    return new Response(JSON.stringify({
      success: true,
      received: updates.length,
      updated: totalUpdated,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Backfill error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
