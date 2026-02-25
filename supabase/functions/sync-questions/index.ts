import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALOC_SUBJECTS: Record<string, string> = {
  "Use of English": "english",
  "English Language": "english",
  "Mathematics": "mathematics",
  "Physics": "physics",
  "Chemistry": "chemistry",
  "Biology": "biology",
  "Economics": "economics",
  "Commerce": "commerce",
  "Accounting": "accounting",
  "Government": "government",
  "Literature in English": "englishlit",
  "Christian Religious Knowledge": "crk",
  "Islamic Religious Knowledge": "irk",
  "History": "history",
  "Geography": "geography",
  "Civic Education": "civiledu",
};

function mapAlocAnswer(answer: string): number {
  const map: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };
  return map[answer?.toLowerCase()] ?? 0;
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

const VEEZEE_BASE = "https://studio--studio-6583429608-f6a92.us-central1.hosted.app/api/bank";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ALOC_API_KEY = Deno.env.get("ALOC_API_KEY");
    const VEEZEE_API_KEY = Deno.env.get("VEEZEE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process ONE subject at a time
    let subject = "Use of English";
    let examLevel = "JAMB / UTME";
    if (req.method === "POST") {
      try {
        const body = await req.json();
        subject = body.subject || "Use of English";
        examLevel = body.level || "JAMB / UTME";
      } catch { /* ignore */ }
    }

    console.log(`Sync: ${subject} (${examLevel})`);

    const { count: beforeCount } = await supabase
      .from("cached_api_questions")
      .select("*", { count: "exact", head: true })
      .eq("exam_level", examLevel)
      .eq("subject", subject);

    let totalFetched = 0;
    const alocParam = ALOC_SUBJECTS[subject];

    // ALOC: fetch recent 5 years for sync (quick refresh)
    if (alocParam && ALOC_API_KEY) {
      const alocType = examLevel.includes("JAMB") ? "utme" : "wassce";
      for (let year = 2020; year <= 2025; year++) {
        try {
          const url = `https://questions.aloc.com.ng/api/v2/q/40?subject=${alocParam}&year=${year}&type=${alocType}`;
          const res = await fetchWithTimeout(url, {
            headers: { "Accept": "application/json", "AccessToken": ALOC_API_KEY },
          }, 15000);

          if (!res.ok) continue;
          const json = await res.json();

          let questions = [];
          if (Array.isArray(json.data)) questions = json.data;
          else if (json.data?.question) questions = [json.data];
          if (questions.length === 0) continue;

          const toCache = questions
            .filter((q: any) => q.question && q.option)
            .map((q: any) => ({
              exam_level: examLevel,
              subject,
              question_text: (q.question || "").toString().trim(),
              option_a: (q.option?.a || "A").toString().trim(),
              option_b: (q.option?.b || "B").toString().trim(),
              option_c: (q.option?.c || "C").toString().trim(),
              option_d: (q.option?.d || "D").toString().trim(),
              correct_answer_index: mapAlocAnswer(q.answer),
              year: (q.examyear || year).toString(),
              explanation: (q.section || "").toString(),
            }))
            .filter((q: any) => q.question_text.length > 5);

          if (toCache.length > 0) {
            await supabase
              .from("cached_api_questions")
              .upsert(toCache, { onConflict: "exam_level,subject,question_text", ignoreDuplicates: true });
            totalFetched += toCache.length;
          }
          await new Promise(r => setTimeout(r, 100));
        } catch (err: any) {
          console.error(`ALOC error ${subject} ${year}:`, err.message);
        }
      }
    }

    // Veezee fallback
    if (VEEZEE_API_KEY) {
      try {
        const veezeeUrl = `${VEEZEE_BASE}?level=${encodeURIComponent(examLevel)}&subject=${encodeURIComponent(subject)}&count=2000`;
        const res = await fetchWithTimeout(veezeeUrl, {
          headers: { "X-API-KEY": VEEZEE_API_KEY, "Content-Type": "application/json", "Accept": "application/json" },
        }, 30000);

        if (res.ok) {
          const data = JSON.parse(await res.text());
          let questionsArray = data?.questions || data?.data || data;
          if (Array.isArray(questionsArray)) {
            const toCache = questionsArray
              .map((q: any) => ({
                exam_level: examLevel,
                subject,
                question_text: (q.question || q.text || "").toString().trim(),
                option_a: (q.options?.[0] || q.option_a || "A").toString().trim(),
                option_b: (q.options?.[1] || q.option_b || "B").toString().trim(),
                option_c: (q.options?.[2] || q.option_c || "C").toString().trim(),
                option_d: (q.options?.[3] || q.option_d || "D").toString().trim(),
                correct_answer_index: typeof q.correctAnswerIndex === "number" ? q.correctAnswerIndex : (typeof q.answer === "number" ? q.answer : 0),
                year: (q.year || "").toString(),
                explanation: (q.explanation || "").toString(),
              }))
              .filter((q: any) => q.question_text.length > 5);

            for (let i = 0; i < toCache.length; i += 500) {
              await supabase
                .from("cached_api_questions")
                .upsert(toCache.slice(i, i + 500), { onConflict: "exam_level,subject,question_text", ignoreDuplicates: true });
            }
            totalFetched += toCache.length;
          }
        }
      } catch (err: any) {
        console.error(`Veezee error ${subject}:`, err.message);
      }
    }

    const { count: afterCount } = await supabase
      .from("cached_api_questions")
      .select("*", { count: "exact", head: true })
      .eq("exam_level", examLevel)
      .eq("subject", subject);

    const newStored = (afterCount || 0) - (beforeCount || 0);
    console.log(`${subject}: fetched=${totalFetched}, new=${newStored}, total=${afterCount}`);

    return new Response(JSON.stringify({
      success: true,
      subject,
      fetched: totalFetched,
      newStored,
      totalCached: afterCount || 0,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
