import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// All subjects and levels to pre-fetch
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

    // Optionally accept specific level/subject to sync
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
    let totalNewCached = 0;

    for (const levelConfig of LEVELS) {
      if (targetLevel && levelConfig.level !== targetLevel) continue;

      for (const subject of levelConfig.subjects) {
        if (targetSubject && subject !== targetSubject) continue;

        try {
          // Check current cache count
          const { count: existingCount } = await supabase
            .from("cached_api_questions")
            .select("*", { count: "exact", head: true })
            .eq("exam_level", levelConfig.level)
            .eq("subject", subject);

          const currentCount = existingCount || 0;

          // Fetch from API - request maximum questions
          const fetchCount = 200;
          const apiUrl = `${BASE_URL}?level=${encodeURIComponent(levelConfig.level)}&subject=${encodeURIComponent(subject)}&count=${fetchCount}`;

          console.log(`Syncing ${levelConfig.level} - ${subject} (${currentCount} cached)...`);

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
            console.error(`API error for ${subject}: ${response.status} - ${errText.substring(0, 100)}`);
            results.push({ level: levelConfig.level, subject, fetched: 0, cached: currentCount, error: `API ${response.status}` });
            continue;
          }

          const rawText = await response.text();
          const data = JSON.parse(rawText);
          let questionsArray = data?.questions || data?.data || data;

          if (!Array.isArray(questionsArray)) {
            results.push({ level: levelConfig.level, subject, fetched: 0, cached: currentCount, error: "No array returned" });
            continue;
          }

          console.log(`API returned ${questionsArray.length} questions for ${levelConfig.level} - ${subject}`);

          // Prepare for cache insertion
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

          if (toCache.length > 0) {
            // Insert in batches of 100
            let newCount = 0;
            for (let i = 0; i < toCache.length; i += 100) {
              const batch = toCache.slice(i, i + 100);
              const { error: insertError } = await supabase
                .from("cached_api_questions")
                .upsert(batch, { onConflict: "exam_level,subject,question_text", ignoreDuplicates: true });

              if (insertError) {
                console.error(`Insert error for ${subject} batch ${i}:`, insertError.message);
              } else {
                newCount += batch.length;
              }
            }
            totalNewCached += newCount;
          }

          // Get final count
          const { count: finalCount } = await supabase
            .from("cached_api_questions")
            .select("*", { count: "exact", head: true })
            .eq("exam_level", levelConfig.level)
            .eq("subject", subject);

          results.push({
            level: levelConfig.level,
            subject,
            fetched: questionsArray.length,
            cached: finalCount || 0,
          });

          // Small delay to avoid rate limiting the external API
          await new Promise(r => setTimeout(r, 300));

        } catch (err: any) {
          console.error(`Error syncing ${levelConfig.level} - ${subject}:`, err.message);
          results.push({ level: levelConfig.level, subject, fetched: 0, cached: 0, error: err.message });
        }
      }
    }

    console.log(`Sync complete. Total new questions cached: ${totalNewCached}`);

    return new Response(JSON.stringify({
      success: true,
      totalNewCached,
      results,
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
