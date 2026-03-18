import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALOC_SUBJECTS: Record<string, string> = {
  "Physics": "physics",
  "Chemistry": "chemistry",
  "Biology": "biology",
  "Mathematics": "mathematics",
  "Economics": "economics",
  "Government": "government",
  "Commerce": "commerce",
  "Accounting": "accounting",
  "Literature in English": "englishlit",
  "Christian Religious Knowledge": "crk",
  "Islamic Religious Knowledge": "irk",
  "History": "history",
  "Geography": "geography",
  "Civic Education": "civiledu",
  "Use of English": "english",
};

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ALOC_API_KEY = Deno.env.get("ALOC_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!ALOC_API_KEY) throw new Error("ALOC_API_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseKey);

    let subjects = Object.keys(ALOC_SUBJECTS);
    let startYear = 2001;
    let endYear = 2025;

    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body.subject && ALOC_SUBJECTS[body.subject]) {
          subjects = [body.subject];
        }
        if (body.startYear) startYear = Number(body.startYear);
        if (body.endYear) endYear = Number(body.endYear);
      } catch {}
    }

    const deadline = Date.now() + 115000;
    let totalUpdated = 0;
    let totalChecked = 0;
    const results: Record<string, { checked: number; updated: number }> = {};

    for (const subject of subjects) {
      if (Date.now() > deadline - 5000) break;

      const alocParam = ALOC_SUBJECTS[subject];
      let subjectUpdated = 0;
      let subjectChecked = 0;

      for (let year = endYear; year >= startYear; year--) {
        if (Date.now() > deadline - 3000) break;

        try {
          const url = `https://questions.aloc.com.ng/api/v2/q/40?subject=${alocParam}&year=${year}&type=utme`;
          const res = await fetchWithTimeout(url, {
            headers: {
              "Accept": "application/json",
              "AccessToken": ALOC_API_KEY,
            },
          }, 15000);

          if (!res.ok) {
            if (res.status === 401 || res.status === 403) break;
            continue;
          }

          const json = await res.json();
          const questions = Array.isArray(json?.data) ? json.data : [];

          for (const q of questions) {
            const imageUrl = q?.image || q?.image_url || "";
            const questionText = (q?.question || "").trim();

            if (!imageUrl || !questionText || questionText.length < 6) continue;

            subjectChecked++;

            // Update matching cached question's image_url
            const { data, error } = await supabase
              .from("cached_api_questions")
              .update({ image_url: imageUrl })
              .eq("subject", subject)
              .eq("exam_level", "JAMB / UTME")
              .eq("question_text", questionText)
              .is("image_url", null)
              .select("id");

            if (!error && data && data.length > 0) {
              subjectUpdated += data.length;
            }
          }

          // Small delay between years
          await new Promise(r => setTimeout(r, 150));
        } catch (err: any) {
          console.error(`ALOC error ${subject} ${year}:`, err.message);
        }
      }

      results[subject] = { checked: subjectChecked, updated: subjectUpdated };
      totalChecked += subjectChecked;
      totalUpdated += subjectUpdated;
      console.log(`Backfill ${subject}: checked=${subjectChecked}, updated=${subjectUpdated}`);
    }

    console.log(`Backfill complete: checked=${totalChecked}, updated=${totalUpdated}`);

    return new Response(JSON.stringify({
      success: true,
      totalChecked,
      totalUpdated,
      results,
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
