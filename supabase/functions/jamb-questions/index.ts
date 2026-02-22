import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://studio--studio-6583429608-f6a92.us-central1.hosted.app/api/bank";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const VEEZEE_API_KEY = Deno.env.get("VEEZEE_API_KEY");
    if (!supabaseUrl || !supabaseKey) throw new Error("Supabase config missing");

    const supabase = createClient(supabaseUrl, supabaseKey);

    let subjects: string[] = [];
    let questionsPerSubject = 10;
    let level = "JAMB / UTME";

    if (req.method === "POST") {
      try {
        const body = await req.json();
        subjects = body.subjects || [];
        questionsPerSubject = body.questionsPerSubject || 10;
        level = body.level || "JAMB / UTME";
      } catch { /* ignore */ }
    }

    console.log("Request:", { subjects, questionsPerSubject, level });

    const subjectsToFetch = subjects.length > 0 ? subjects : ["English Language"];
    const allQuestions: any[] = [];

    for (const subject of subjectsToFetch) {
      // First try cache
      const { data: cached, error } = await supabase
        .from("cached_api_questions")
        .select("*")
        .eq("exam_level", level)
        .eq("subject", subject);

      if (error) {
        console.error(`Cache read error for ${subject}:`, error.message);
      }

      let pool = cached || [];
      console.log(`${subject}: ${pool.length} cached, need ${questionsPerSubject}`);

      // If cache doesn't have enough, fetch directly from API
      if (pool.length < questionsPerSubject && VEEZEE_API_KEY) {
        console.log(`${subject}: cache insufficient (${pool.length}/${questionsPerSubject}), fetching from API...`);
        try {
          // Fetch exact amount needed plus buffer for dedup
          const fetchCount = Math.max(questionsPerSubject * 2, 200);
          const apiUrl = `${BASE_URL}?level=${encodeURIComponent(level)}&subject=${encodeURIComponent(subject)}&count=${fetchCount}`;
          
          const response = await fetch(apiUrl, {
            method: "GET",
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
                  exam_level: level,
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

              console.log(`${subject}: fetched ${toCache.length} from API`);

              // Cache the new questions
              if (toCache.length > 0) {
                for (let i = 0; i < toCache.length; i += 500) {
                  const chunk = toCache.slice(i, i + 500);
                  await supabase
                    .from("cached_api_questions")
                    .upsert(chunk, { onConflict: "exam_level,subject,question_text", ignoreDuplicates: true });
                }

                // Re-read the full cache after insert
                const { data: refreshed } = await supabase
                  .from("cached_api_questions")
                  .select("*")
                  .eq("exam_level", level)
                  .eq("subject", subject);
                
                pool = refreshed || pool;
                console.log(`${subject}: cache refreshed to ${pool.length}`);
              }

              // If cache still not enough, use API results directly (don't just rely on cache)
              if (pool.length < questionsPerSubject && toCache.length > 0) {
                console.log(`${subject}: cache still short, merging API results directly`);
                // Deduplicate by question_text
                const existingTexts = new Set(pool.map((q: any) => q.question_text));
                for (const q of toCache) {
                  if (!existingTexts.has(q.question_text)) {
                    pool.push(q);
                    existingTexts.add(q.question_text);
                  }
                }
                console.log(`${subject}: merged pool now ${pool.length}`);
              }
            }
          } else {
            console.error(`API ${response.status} for ${subject}`);
          }
        } catch (fetchErr: any) {
          console.error(`API fetch error for ${subject}:`, fetchErr.message);
        }
      }

      // Shuffle and pick exact requested count
      const shuffled = pool.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, questionsPerSubject);

      const formatted = selected.map((q: any) => ({
        text: q.question_text,
        options: [q.option_a, q.option_b, q.option_c, q.option_d],
        correctAnswerIndex: q.correct_answer_index,
        year: q.year || "",
        explanation: q.explanation || "",
        subject: subject,
      }));

      allQuestions.push(...formatted);
      console.log(`${subject}: serving ${formatted.length}/${questionsPerSubject}`);
    }

    console.log("Total questions served:", allQuestions.length);

    return new Response(JSON.stringify({ questions: allQuestions, status: "OK" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to fetch questions" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
