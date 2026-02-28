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
    let year: string | null = null;

    if (req.method === "POST") {
      try {
        const body = await req.json();
        subjects = body.subjects || [];
        questionsPerSubject = body.questionsPerSubject || 10;
        level = body.level || "JAMB / UTME";
        year = body.year || null;
      } catch { /* ignore */ }
    }

    console.log("Request:", { subjects, questionsPerSubject, level, year });

    const subjectsToFetch = subjects.length > 0 ? subjects : ["Use of English"];
    const allQuestions: any[] = [];

    for (const subject of subjectsToFetch) {
      let pool: any[] = [];

      if (year) {
        // Year-specific: first get questions for that year
        const { data: yearCached, error: yearErr } = await supabase
          .from("cached_api_questions")
          .select("*")
          .eq("exam_level", level)
          .eq("subject", subject)
          .eq("year", year);

        if (yearErr) console.error(`Year cache error for ${subject}:`, yearErr.message);
        pool = yearCached || [];
        console.log(`${subject}: year=${year} found ${pool.length}, need=${questionsPerSubject}`);

        // Backfill from full pool if not enough
        if (pool.length < questionsPerSubject) {
          const existingTexts = new Set(pool.map((q: any) => q.question_text));
          const { data: backfill } = await supabase
            .from("cached_api_questions")
            .select("*")
            .eq("exam_level", level)
            .eq("subject", subject)
            .neq("year", year);

          if (backfill && backfill.length > 0) {
            const shuffledBackfill = backfill.sort(() => Math.random() - 0.5);
            for (const q of shuffledBackfill) {
              if (!existingTexts.has(q.question_text)) {
                pool.push(q);
                existingTexts.add(q.question_text);
                if (pool.length >= questionsPerSubject) break;
              }
            }
          }
          console.log(`${subject}: after backfill pool=${pool.length}`);
        }
      } else {
        // No year filter: existing behavior - check cache for requested level
        const { data: cached, error } = await supabase
          .from("cached_api_questions")
          .select("*")
          .eq("exam_level", level)
          .eq("subject", subject);

        if (error) console.error(`Cache read error for ${subject}:`, error.message);
        pool = cached || [];

        // If not enough in requested level, also check JAMB cache
        if (pool.length < questionsPerSubject && level !== "JAMB / UTME") {
          console.log(`${subject}: ${level} cache has ${pool.length}, checking JAMB cache...`);
          const { data: jambCached } = await supabase
            .from("cached_api_questions")
            .select("*")
            .eq("exam_level", "JAMB / UTME")
            .eq("subject", subject);
          
          if (jambCached && jambCached.length > 0) {
            const existingTexts = new Set(pool.map((q: any) => q.question_text));
            for (const q of jambCached) {
              if (!existingTexts.has(q.question_text)) {
                pool.push(q);
                existingTexts.add(q.question_text);
              }
            }
            console.log(`${subject}: merged JAMB cache, pool now ${pool.length}`);
          }
        }
      }

      console.log(`${subject}: cache pool=${pool.length}, need=${questionsPerSubject}`);

      // Step 3: If cache still insufficient, fetch from Veezee API AND store in cache
      if (pool.length < questionsPerSubject && VEEZEE_API_KEY) {
        console.log(`${subject}: cache insufficient, fetching from Veezee API...`);
        try {
          const fetchCount = Math.max(questionsPerSubject * 5, 1000);
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
                .filter((q: any) => {
                  const text = q.question_text;
                  if (text.length < 15) return false;
                  const wordCount = text.split(/\s+/).filter((w: string) => w.length > 0).length;
                  if (wordCount < 3) return false;
                  return true;
                });

              console.log(`${subject}: fetched ${toCache.length} from API, storing in cache...`);

              // Store ALL fetched questions in our question bank (ignore duplicates)
              if (toCache.length > 0) {
                for (let i = 0; i < toCache.length; i += 500) {
                  const chunk = toCache.slice(i, i + 500);
                  await supabase
                    .from("cached_api_questions")
                    .upsert(chunk, { onConflict: "exam_level,subject,question_text", ignoreDuplicates: true });
                }

                // Re-read the full cache after storing
                const { data: refreshed } = await supabase
                  .from("cached_api_questions")
                  .select("*")
                  .eq("exam_level", level)
                  .eq("subject", subject);
                
                if (refreshed && refreshed.length > 0) {
                  pool = refreshed;
                } else {
                  // Merge API results directly into pool as fallback
                  const existingTexts = new Set(pool.map((q: any) => q.question_text));
                  for (const q of toCache) {
                    if (!existingTexts.has(q.question_text)) {
                      pool.push(q);
                      existingTexts.add(q.question_text);
                    }
                  }
                }
                console.log(`${subject}: cache refreshed to ${pool.length}`);
              }
            }
          } else {
            console.error(`API ${response.status} for ${subject}`);
          }
        } catch (fetchErr: any) {
          console.error(`API fetch error for ${subject}:`, fetchErr.message);
        }
      }

      // Step 4: Filter out incomplete/malformed questions, then shuffle and pick
      const qualityPool = pool.filter((q: any) => {
        const text = (q.question_text || '').trim();
        const wordCount = text.split(/\s+/).filter((w: string) => w.length > 0).length;
        if (text.length < 15 || wordCount < 3) return false;
        const opts = [q.option_a, q.option_b, q.option_c, q.option_d];
        const validOpts = opts.filter((o: string) => o && o.trim().length >= 1);
        if (validOpts.length < 4) return false;
        const unique = new Set(validOpts.map((o: string) => o.trim().toLowerCase()));
        if (unique.size < 2) return false;
        return true;
      });
      console.log(`${subject}: filtered ${pool.length - qualityPool.length} bad questions, quality pool=${qualityPool.length}`);

      const shuffled = qualityPool.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, questionsPerSubject);

      const formatted = selected.map((q: any) => ({
        text: q.question_text,
        options: [q.option_a, q.option_b, q.option_c, q.option_d],
        correctAnswerIndex: q.correct_answer_index,
        year: year || q.year || "",
        explanation: q.explanation || "",
        subject: subject,
      }));

      allQuestions.push(...formatted);
      console.log(`${subject}: serving ${formatted.length}/${questionsPerSubject} (bank has ${pool.length})`);
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
