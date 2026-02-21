import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!VEEZEE_API_KEY) throw new Error("VEEZEE_API_KEY is not configured");
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

    console.log("Requested:", { subjects, questionsPerSubject, level });

    const subjectsToFetch = subjects.length > 0 ? subjects : ["English Language"];
    const allQuestions: any[] = [];

    for (const subject of subjectsToFetch) {
      // Step 1: Check cache first
      const { data: cached, error: cacheError } = await supabase
        .from("cached_api_questions")
        .select("*")
        .eq("exam_level", level)
        .eq("subject", subject);

      if (cacheError) {
        console.error(`Cache read error for ${subject}:`, cacheError.message);
      }

      const cachedCount = cached?.length || 0;
      console.log(`${subject}: ${cachedCount} cached questions, need ${questionsPerSubject}`);

      // Step 2: If not enough cached, fetch from API and cache
      if (cachedCount < questionsPerSubject) {
        const fetchCount = Math.max(questionsPerSubject, 100); // Fetch as many as possible
        const apiUrl = `https://studio--studio-6583429608-f6a92.us-central1.hosted.app/api/bank?level=${encodeURIComponent(level)}&subject=${encodeURIComponent(subject)}&count=${fetchCount}`;

        console.log(`Fetching ${subject} from API (need more): ${apiUrl}`);

        try {
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

            if (Array.isArray(questionsArray) && questionsArray.length > 0) {
              console.log(`API returned ${questionsArray.length} questions for ${subject}`);

              // Save to cache (upsert to avoid duplicates)
              const toCache = questionsArray.map((q: any) => ({
                exam_level: level,
                subject: subject,
                question_text: (q.question || q.text || "").toString().trim(),
                option_a: (q.options?.[0] || q.option_a || "A").toString().trim(),
                option_b: (q.options?.[1] || q.option_b || "B").toString().trim(),
                option_c: (q.options?.[2] || q.option_c || "C").toString().trim(),
                option_d: (q.options?.[3] || q.option_d || "D").toString().trim(),
                correct_answer_index: typeof q.correctAnswerIndex === "number" ? q.correctAnswerIndex : (q.answer || 0),
                year: (q.year || "").toString(),
                explanation: (q.explanation || "").toString(),
              })).filter((q: any) => q.question_text.length > 5);

              if (toCache.length > 0) {
                const { error: insertError } = await supabase
                  .from("cached_api_questions")
                  .upsert(toCache, { onConflict: "exam_level,subject,question_text", ignoreDuplicates: true });

                if (insertError) {
                  console.error(`Cache insert error for ${subject}:`, insertError.message);
                } else {
                  console.log(`Cached ${toCache.length} questions for ${subject}`);
                }
              }
            }
          } else {
            console.error(`API error for ${subject}: ${response.status}`);
          }
        } catch (fetchErr: any) {
          console.error(`API fetch failed for ${subject}:`, fetchErr.message);
        }
      }

      // Step 3: Read from cache (now includes newly cached questions)
      const { data: finalCached } = await supabase
        .from("cached_api_questions")
        .select("*")
        .eq("exam_level", level)
        .eq("subject", subject);

      const pool = finalCached || [];
      console.log(`${subject}: ${pool.length} total cached, serving ${Math.min(questionsPerSubject, pool.length)}`);

      // Shuffle and pick requested count
      const shuffled = pool.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, questionsPerSubject);

      // Convert to frontend format
      const formatted = selected.map((q: any) => ({
        text: q.question_text,
        options: [q.option_a, q.option_b, q.option_c, q.option_d],
        correctAnswerIndex: q.correct_answer_index,
        year: q.year || "",
        explanation: q.explanation || "",
        subject: q.subject,
      }));

      allQuestions.push(...formatted);
    }

    console.log("Total questions returned:", allQuestions.length);

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
