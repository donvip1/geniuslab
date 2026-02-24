import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ALOC API subject mapping
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

const VEEZEE_BASE = "https://studio--studio-6583429608-f6a92.us-central1.hosted.app/api/bank";

const ALL_SUBJECTS = [
  "Use of English", "Mathematics", "Physics", "Chemistry", "Biology",
  "Agricultural Science", "Economics", "Commerce", "Accounting",
  "Government", "Literature in English", "Christian Religious Knowledge",
  "Islamic Religious Knowledge", "History", "Geography", "Civic Education",
  "Computer Studies", "Igbo Language", "Yoruba Language", "Hausa Language",
  "French", "Arabic", "Fine Arts", "Technical Drawing"
];

function mapAlocAnswer(answer: string): number {
  const map: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };
  return map[answer?.toLowerCase()] ?? 0;
}

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
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let targetSubject: string | null = null;
    let examLevel = "JAMB / UTME";
    if (req.method === "POST") {
      try {
        const body = await req.json();
        targetSubject = body.subject || null;
        examLevel = body.level || "JAMB / UTME";
      } catch { /* ignore */ }
    }

    const subjectsToFetch = targetSubject 
      ? ALL_SUBJECTS.filter(s => s === targetSubject)
      : ALL_SUBJECTS;

    const results: any[] = [];
    const startYear = 2010;
    const endYear = 2025;

    for (const subject of subjectsToFetch) {
      let totalFetched = 0;
      let totalStored = 0;

      // Get current count
      const { count: beforeCount } = await supabase
        .from("cached_api_questions")
        .select("*", { count: "exact", head: true })
        .eq("exam_level", examLevel)
        .eq("subject", subject);

      const alocParam = ALOC_SUBJECTS[subject];

      // Strategy 1: ALOC API (primary) - iterate years
      if (alocParam && ALOC_API_KEY) {
        const alocType = examLevel.includes("JAMB") ? "utme" : "wassce";
        
        for (let year = startYear; year <= endYear; year++) {
          try {
            const url = `https://questions.aloc.com.ng/api/v2/q/40?subject=${alocParam}&year=${year}&type=${alocType}`;
            console.log(`ALOC: Fetching ${subject} ${year} ${alocType}...`);
            
            const res = await fetch(url, {
              headers: { "Accept": "application/json", "AccessToken": ALOC_API_KEY },
            });

            if (!res.ok) {
              console.log(`ALOC ${res.status} for ${subject} ${year}`);
              continue;
            }

            const json = await res.json();
            
            // ALOC returns { data: [...questions] } or { data: {single question} }
            let questions = [];
            if (Array.isArray(json.data)) {
              questions = json.data;
            } else if (json.data && typeof json.data === "object" && json.data.question) {
              questions = [json.data];
            }

            if (questions.length === 0) continue;

            const toCache = questions
              .filter((q: any) => q.question && q.option)
              .map((q: any) => ({
                exam_level: examLevel,
                subject: subject,
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
              const { error } = await supabase
                .from("cached_api_questions")
                .upsert(toCache, { onConflict: "exam_level,subject,question_text", ignoreDuplicates: true });
              
              if (error) console.error(`Upsert error ${subject} ${year}:`, error.message);
              totalFetched += toCache.length;
            }

            // Small delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 200));
          } catch (err: any) {
            console.error(`ALOC error ${subject} ${year}:`, err.message);
          }
        }
      }

      // Strategy 2: Veezee API (fallback) - if ALOC didn't cover this subject or got few questions
      if (totalFetched < 50 && VEEZEE_API_KEY) {
        try {
          const veezeeUrl = `${VEEZEE_BASE}?level=${encodeURIComponent("JAMB / UTME")}&subject=${encodeURIComponent(subject)}&count=1000`;
          console.log(`Veezee fallback: Fetching ${subject}...`);
          
          const res = await fetch(veezeeUrl, {
            headers: {
              "X-API-KEY": VEEZEE_API_KEY,
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
          });

          if (res.ok) {
            const rawText = await res.text();
            const data = JSON.parse(rawText);
            let questionsArray = data?.questions || data?.data || data;
            
            if (Array.isArray(questionsArray)) {
              const toCache = questionsArray
                .map((q: any) => ({
                  exam_level: examLevel,
                  subject: subject,
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

              if (toCache.length > 0) {
                for (let i = 0; i < toCache.length; i += 500) {
                  const chunk = toCache.slice(i, i + 500);
                  await supabase
                    .from("cached_api_questions")
                    .upsert(chunk, { onConflict: "exam_level,subject,question_text", ignoreDuplicates: true });
                }
                totalFetched += toCache.length;
              }
            }
          }
        } catch (err: any) {
          console.error(`Veezee error ${subject}:`, err.message);
        }
      }

      // Final count
      const { count: afterCount } = await supabase
        .from("cached_api_questions")
        .select("*", { count: "exact", head: true })
        .eq("exam_level", examLevel)
        .eq("subject", subject);

      totalStored = (afterCount || 0) - (beforeCount || 0);
      console.log(`${subject}: fetched=${totalFetched}, newStored=${totalStored}, total=${afterCount}`);
      
      results.push({
        subject,
        fetched: totalFetched,
        newStored: totalStored,
        totalCached: afterCount || 0,
      });
    }

    const grandTotal = results.reduce((sum, r) => sum + r.totalCached, 0);
    const totalNew = results.reduce((sum, r) => sum + r.newStored, 0);

    return new Response(JSON.stringify({ 
      success: true, 
      totalNew,
      grandTotal,
      results 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Bulk fetch error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
