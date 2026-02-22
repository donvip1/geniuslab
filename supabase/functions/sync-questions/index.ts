import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LEVELS = [
  { level: "JAMB / UTME", subjects: [
    "English Language", "Mathematics", "Physics", "Chemistry", "Biology",
    "Agricultural Science", "Economics", "Commerce", "Accounting",
    "Government", "Literature in English", "Christian Religious Knowledge",
    "Islamic Religious Knowledge", "History", "Geography", "Civic Education", "Computer Studies"
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
    const VEEZEE_API_KEY = Deno.env.get("VEEZEE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!VEEZEE_API_KEY || !supabaseUrl || !supabaseKey) {
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

    const results: { level: string; subject: string; fetched: number; cached: number; error?: string }[] = [];

    for (const levelConfig of LEVELS) {
      if (targetLevel && levelConfig.level !== targetLevel) continue;

      for (const subject of levelConfig.subjects) {
        if (targetSubject && subject !== targetSubject) continue;

        try {
          // Target: enough questions for exams (English=200, others=100)
          const target = subject === "English Language" ? 200 : 100;

          // Check current cache count
          const { count: currentCount } = await supabase
            .from("cached_api_questions")
            .select("*", { count: "exact", head: true })
            .eq("exam_level", levelConfig.level)
            .eq("subject", subject);

          if ((currentCount || 0) >= target) {
            console.log(`${levelConfig.level} - ${subject}: already at ${currentCount}/${target}, skipping`);
            results.push({ level: levelConfig.level, subject, fetched: 0, cached: currentCount || 0 });
            continue;
          }

          // Fetch a large batch directly - API now supports returning many questions
          const fetchCount = target * 2; // Request more to account for possible duplicates
          const apiUrl = `${BASE_URL}?level=${encodeURIComponent(levelConfig.level)}&subject=${encodeURIComponent(subject)}&count=${fetchCount}`;

          console.log(`${levelConfig.level} - ${subject}: cache=${currentCount || 0}/${target}, fetching ${fetchCount}...`);

          const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
              "X-API-KEY": VEEZEE_API_KEY,
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
          });

          if (!response.ok) {
            const errText = await response.text();
            console.error(`API ${response.status} for ${subject}: ${errText}`);
            results.push({ level: levelConfig.level, subject, fetched: 0, cached: currentCount || 0, error: `API ${response.status}` });
            continue;
          }

          const rawText = await response.text();
          const data = JSON.parse(rawText);
          let questionsArray = data?.questions || data?.data || data;
          if (!Array.isArray(questionsArray)) {
            console.error(`Non-array response for ${subject}`);
            results.push({ level: levelConfig.level, subject, fetched: 0, cached: currentCount || 0, error: "Non-array response" });
            continue;
          }

          const toCache = questionsArray
            .map((q: any) => ({
              exam_level: levelConfig.level,
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

          console.log(`${subject}: parsed ${toCache.length} valid questions from API`);

          if (toCache.length > 0) {
            // Batch upsert in chunks of 500 to avoid payload limits
            for (let i = 0; i < toCache.length; i += 500) {
              const chunk = toCache.slice(i, i + 500);
              await supabase
                .from("cached_api_questions")
                .upsert(chunk, { onConflict: "exam_level,subject,question_text", ignoreDuplicates: true });
            }
          }

          // Final count
          const { count: newCount } = await supabase
            .from("cached_api_questions")
            .select("*", { count: "exact", head: true })
            .eq("exam_level", levelConfig.level)
            .eq("subject", subject);

          console.log(`${subject}: cache now at ${newCount}/${target}`);
          results.push({ level: levelConfig.level, subject, fetched: toCache.length, cached: newCount || 0 });

        } catch (err: any) {
          console.error(`Error syncing ${levelConfig.level} - ${subject}:`, err.message);
          results.push({ level: levelConfig.level, subject, fetched: 0, cached: 0, error: err.message });
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
