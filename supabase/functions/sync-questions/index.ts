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

function mapAlocAnswer(answer: string): number {
  const map: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };
  return map[answer?.toLowerCase()] ?? 0;
}

const LEVELS = [
  { level: "JAMB / UTME", subjects: [
    "Use of English", "Mathematics", "Physics", "Chemistry", "Biology",
    "Agricultural Science", "Economics", "Commerce", "Accounting",
    "Government", "Literature in English", "Christian Religious Knowledge",
    "Islamic Religious Knowledge", "History", "Geography", "Civic Education", "Computer Studies",
    "Igbo Language", "Yoruba Language", "Hausa Language", "French", "Arabic", "Fine Arts", "Technical Drawing"
  ]},
  { level: "WAEC / SSCE", subjects: [
    "English Language", "Mathematics", "Physics", "Chemistry", "Biology",
    "Agricultural Science", "Further Mathematics", "Computer Studies", "Geography",
    "Commerce", "Accounting", "Economics", "Business Methods", "Insurance",
    "Office Practice", "Marketing", "Government", "Literature in English",
    "History", "Christian Religious Knowledge", "Islamic Religious Knowledge",
    "Fine Arts", "Yoruba", "Igbo", "Hausa", "Civic Education"
  ]},
  { level: "NECO / SSCE", subjects: [
    "English Language", "Mathematics", "Physics", "Chemistry", "Biology",
    "Agricultural Science", "Further Mathematics", "Computer Studies", "Geography",
    "Commerce", "Accounting", "Economics", "Government", "Literature in English",
    "History", "Christian Religious Knowledge", "Islamic Religious Knowledge",
    "Civic Education"
  ]},
  { level: "NABTEB / SSCE", subjects: [
    "English Language", "Mathematics", "Physics", "Chemistry", "Biology",
    "Economics", "Commerce", "Accounting", "Government"
  ]},
];

const BASE_URL = "https://studio--studio-6583429608-f6a92.us-central1.hosted.app/api/bank";

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

    let targetLevel: string | null = null;
    let targetSubject: string | null = null;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        targetLevel = body.level || null;
        targetSubject = body.subject || null;
      } catch { /* ignore */ }
    }

    const results: { level: string; subject: string; fetched: number; newStored: number; totalCached: number; error?: string }[] = [];

    for (const levelConfig of LEVELS) {
      if (targetLevel && levelConfig.level !== targetLevel) continue;

      for (const subject of levelConfig.subjects) {
        if (targetSubject && subject !== targetSubject) continue;

        try {
          // Check current cache count
          const { count: currentCount } = await supabase
            .from("cached_api_questions")
            .select("*", { count: "exact", head: true })
            .eq("exam_level", levelConfig.level)
            .eq("subject", subject);

          const cached = currentCount || 0;

          // Strategy 1: ALOC API (primary)
          const alocParam = ALOC_SUBJECTS[subject];
          let alocFetched = 0;
          
          if (alocParam && ALOC_API_KEY) {
            const alocType = levelConfig.level.includes("JAMB") ? "utme" : "wassce";
            // Fetch from recent years (last 15 years)
            for (let year = 2010; year <= 2025; year++) {
              try {
                const url = `https://questions.aloc.com.ng/api/v2/q/40?subject=${alocParam}&year=${year}&type=${alocType}`;
                const res = await fetch(url, {
                  headers: { "Accept": "application/json", "AccessToken": ALOC_API_KEY },
                });
                
                if (!res.ok) continue;
                const json = await res.json();
                
                let questions = [];
                if (Array.isArray(json.data)) questions = json.data;
                else if (json.data?.question) questions = [json.data];
                
                if (questions.length === 0) continue;

                const toCache = questions
                  .filter((q: any) => q.question && q.option)
                  .map((q: any) => ({
                    exam_level: levelConfig.level,
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
                  alocFetched += toCache.length;
                }
                
                await new Promise(r => setTimeout(r, 150));
              } catch (err: any) {
                console.error(`ALOC error ${subject} ${year}:`, err.message);
              }
            }
          }

          // Strategy 2: Veezee fallback (if ALOC got fewer than 50)
          if (alocFetched < 50 && VEEZEE_API_KEY) {
            const fetchCount = 1000;
            const apiUrl = `${BASE_URL}?level=${encodeURIComponent("JAMB / UTME")}&subject=${encodeURIComponent(subject)}&count=${fetchCount}`;
            console.log(`Veezee fallback for ${subject}...`);

            try {
              const response = await fetch(apiUrl, {
                headers: {
                  "X-API-KEY": VEEZEE_API_KEY,
                  "Content-Type": "application/json",
                  "Accept": "application/json",
                },
              });

              if (response.ok) {
                const rawText = await response.text();
                const data = JSON.parse(rawText);
                let questionsArray = data?.questions || data?.data || data;
                
                if (Array.isArray(questionsArray)) {
                  const toCache = questionsArray
                    .map((q: any) => ({
                      exam_level: levelConfig.level,
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
                    const chunk = toCache.slice(i, i + 500);
                    await supabase
                      .from("cached_api_questions")
                      .upsert(chunk, { onConflict: "exam_level,subject,question_text", ignoreDuplicates: true });
                  }
                }
              }
            } catch (err: any) {
              console.error(`Veezee error for ${subject}:`, err.message);
            }
          }

          // Final count
          const { count: newCount } = await supabase
            .from("cached_api_questions")
            .select("*", { count: "exact", head: true })
            .eq("exam_level", levelConfig.level)
            .eq("subject", subject);

          const newStored = (newCount || 0) - cached;
          console.log(`${subject}: ${newStored} new, total=${newCount}`);
          results.push({ level: levelConfig.level, subject, fetched: alocFetched, newStored, totalCached: newCount || 0 });

        } catch (err: any) {
          console.error(`Error syncing ${levelConfig.level} - ${subject}:`, err.message);
          results.push({ level: levelConfig.level, subject, fetched: 0, newStored: 0, totalCached: 0, error: err.message });
        }
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
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
