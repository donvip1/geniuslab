import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://studio--studio-6583429608-f6a92.us-central1.hosted.app/api/bank";
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

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const isEnglishSubject = (subject: string) => subject.toLowerCase().includes("english");
const hasVisualReference = (text: string) => /\b(diagram|figure|graph|table|chart|map|illustration|curve|pie chart|bar chart|line graph)\b/i.test(stripHtml(text || ""));
const hasPassageReference = (text: string) => /\b(comprehension|passage|extract|conversation|information below|statement below)\b/i.test(stripHtml(text || ""));
const hasEmbeddedPassage = (text: string) => {
  const plainText = stripHtml(text || "");
  const lowerText = plainText.toLowerCase();
  if (!hasPassageReference(plainText)) return false;
  return plainText.length >= 280 || /questions?\s*\d+\s*[-–]\s*\d+/i.test(plainText) || plainText.split(/\n+/).filter(Boolean).length >= 3 || lowerText.includes("read the passage") || lowerText.includes("read the extract");
};

const mapApiQuestionToCache = (q: any, level: string, subject: string) => {
  const questionText = (q.question || q.text || "").toString().trim();
  if (!questionText) return null;

  const optionA = (q.options?.[0] || q.option_a || "A").toString().trim();
  const optionB = (q.options?.[1] || q.option_b || "B").toString().trim();
  const optionC = (q.options?.[2] || q.option_c || "C").toString().trim();
  const optionD = (q.options?.[3] || q.option_d || "D").toString().trim();
  const imageUrl = (q.image || q.image_url || q.imageUrl || "").toString().trim();
  const explanation = (q.explanation || q.section || "").toString().trim();
  const year = (q.year || q.examyear || "").toString().trim();

  return {
    exam_level: level,
    subject,
    question_text: questionText,
    option_a: optionA,
    option_b: optionB,
    option_c: optionC,
    option_d: optionD,
    correct_answer_index: typeof q.correctAnswerIndex === "number"
      ? q.correctAnswerIndex
      : (typeof q.answer === "number" ? q.answer : 0),
    ...(year ? { year } : {}),
    ...(explanation ? { explanation } : {}),
    ...(imageUrl ? { image_url: imageUrl } : {}),
  };
};

async function upsertCacheRows(supabase: any, rows: any[]) {
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    await supabase
      .from("cached_api_questions")
      .upsert(chunk, { onConflict: "exam_level,subject,question_text" });
  }
}

async function fetchVeezeeRows(subject: string, level: string, questionsPerSubject: number, apiKey: string) {
  const fetchCount = Math.max(questionsPerSubject * 8, 2000);
  const apiUrl = `${BASE_URL}?level=${encodeURIComponent(level)}&subject=${encodeURIComponent(subject)}&count=${fetchCount}`;
  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Veezee API ${response.status}`);
  }

  const rawText = await response.text();
  const data = JSON.parse(rawText);
  const questionsArray = data?.questions || data?.data || data;
  if (!Array.isArray(questionsArray)) return [];

  return questionsArray
    .map((q: any) => mapApiQuestionToCache(q, level, subject))
    .filter((q: any) => q !== null);
}

async function fetchAlocRows(subject: string, level: string, apiKey: string, preferredYear?: string | null) {
  if (!level.includes("JAMB")) return [];
  const alocSubject = ALOC_SUBJECTS[subject];
  if (!alocSubject) return [];

  const years = preferredYear ? [Number(preferredYear)] : Array.from({ length: 25 }, (_, index) => 2025 - index);
  const rows: any[] = [];

  for (const year of years) {
    if (!Number.isFinite(year)) continue;
    const url = `https://questions.aloc.com.ng/api/v2/q/40?subject=${alocSubject}&year=${year}&type=utme`;
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "AccessToken": apiKey,
      },
    });

    if (!response.ok) continue;

    const data = await response.json();
    const questions = Array.isArray(data?.data)
      ? data.data
      : data?.data?.question
        ? [data.data]
        : Array.isArray(data)
          ? data
          : [];

    rows.push(
      ...questions
        .map((q: any) => mapApiQuestionToCache(q, level, subject))
        .filter((q: any) => q !== null)
    );

    if (preferredYear && rows.length > 0) break;
  }

  return rows;
}

const shouldRefreshForContext = (pool: any[], subject: string, requiredCount: number) => {
  const visualWithoutImage = pool.filter((q: any) => hasVisualReference(q.question_text || "") && !q.image_url).length;
  const passageWithoutContext = isEnglishSubject(subject)
    ? pool.filter((q: any) => hasPassageReference(q.question_text || "") && !hasEmbeddedPassage(q.question_text || "")).length
    : 0;
  const contextSafeCount = pool.filter((q: any) => {
    if (hasVisualReference(q.question_text || "")) return !!q.image_url;
    if (isEnglishSubject(subject) && hasPassageReference(q.question_text || "")) return hasEmbeddedPassage(q.question_text || "");
    return true;
  }).length;

  return visualWithoutImage > 0 || passageWithoutContext > 0 || contextSafeCount < requiredCount;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const VEEZEE_API_KEY = Deno.env.get("VEEZEE_API_KEY");
    const ALOC_API_KEY = Deno.env.get("ALOC_API_KEY");
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

      // Step 3: Enrich the cache when it is too small OR when context-heavy questions are missing images/passages
      const shouldRefresh = pool.length < questionsPerSubject || shouldRefreshForContext(pool, subject, questionsPerSubject);
      if (shouldRefresh) {
        console.log(`${subject}: refreshing cache for missing context/images...`);
        const fetchedRows: any[] = [];

        if (VEEZEE_API_KEY) {
          try {
            const veezeeRows = await fetchVeezeeRows(subject, level, questionsPerSubject, VEEZEE_API_KEY);
            fetchedRows.push(...veezeeRows);
            console.log(`${subject}: fetched ${veezeeRows.length} rows from Veezee`);
          } catch (fetchErr: any) {
            console.error(`Veezee fetch error for ${subject}:`, fetchErr.message);
          }
        }

        const stillNeedsContext = pool.length < questionsPerSubject || shouldRefreshForContext([...pool, ...fetchedRows], subject, questionsPerSubject);
        if (stillNeedsContext && ALOC_API_KEY) {
          try {
            const alocRows = await fetchAlocRows(subject, level, ALOC_API_KEY, year);
            fetchedRows.push(...alocRows);
            console.log(`${subject}: fetched ${alocRows.length} rows from ALOC`);
          } catch (fetchErr: any) {
            console.error(`ALOC fetch error for ${subject}:`, fetchErr.message);
          }
        }

        if (fetchedRows.length > 0) {
          await upsertCacheRows(supabase, fetchedRows);
          const { data: refreshed } = await supabase
            .from("cached_api_questions")
            .select("*")
            .eq("exam_level", level)
            .eq("subject", subject);

          if (refreshed && refreshed.length > 0) {
            pool = refreshed;
          }

          console.log(`${subject}: cache refreshed to ${pool.length}`);
        }
      }

      // Step 4: Filter out incomplete/malformed questions (strip HTML), then shuffle and pick
      const qualityPool = pool.filter((q: any) => {
        const rawText = (q.question_text || '').trim();
        const plainText = stripHtml(rawText);
        const wordCount = plainText.split(/\s+/).filter((w: string) => w.length > 0).length;
        if (plainText.length < 25 || wordCount < 5) return false;
        const opts = [q.option_a, q.option_b, q.option_c, q.option_d];
        const validOpts = opts.filter((o: string) => o && o.trim().length >= 1);
        if (validOpts.length < 4) return false;
        const unique = new Set(validOpts.map((o: string) => o.trim().toLowerCase()));
        if (unique.size < 2) return false;
        if (hasVisualReference(rawText) && !q.image_url) return false;
        if (isEnglishSubject(subject) && hasPassageReference(rawText) && !hasEmbeddedPassage(rawText)) return false;
        return true;
      });
      console.log(`${subject}: filtered ${pool.length - qualityPool.length} bad questions, quality pool=${qualityPool.length}`);

      // Keep original order whenever questions depend on shared context such as passages, tables or diagrams
      const preserveOrder = isEnglishSubject(subject) || qualityPool.some((q: any) => hasVisualReference(q.question_text || "") || hasPassageReference(q.question_text || ""));
      const ordered = preserveOrder ? qualityPool : qualityPool.sort(() => Math.random() - 0.5);
      const selected = ordered.slice(0, questionsPerSubject);

      const formatted = selected.map((q: any) => ({
        text: q.question_text,
        options: [q.option_a, q.option_b, q.option_c, q.option_d],
        correctAnswerIndex: q.correct_answer_index,
        year: year || q.year || "",
        explanation: q.explanation || "",
        subject: subject,
        image_url: q.image_url || null,
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
