import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VEEZEE_BASE = "https://studio--studio-6583429608-f6a92.us-central1.hosted.app/api/bank";
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/wisdom209/jamb_questions/main";

const TARGET_MIN_DEFAULT = 2000;
const MAX_EXECUTION_MS = 115000;

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
  "Insurance": "insurance",
  "Current Affairs": "currentaffairs",
};

const GITHUB_SUBJECTS: Record<string, string> = {
  "Mathematics": "mathematics",
  "Physics": "physics",
  "Chemistry": "chemistry",
  "Biology": "biology",
  "Government": "government",
  "Literature in English": "literature-in-english",
  "Christian Religious Knowledge": "crs",
};

type CachedQuestion = {
  exam_level: string;
  subject: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer_index: number;
  year?: string;
  explanation?: string;
  image_url?: string;
};

function cleanText(value: unknown, fallback = ""): string {
  const text = (value ?? fallback).toString().trim();
  return text.length > 0 ? text : fallback;
}

function mapAnswerLetter(answer: unknown): number | null {
  const map: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };
  const key = cleanText(answer, "").toLowerCase();
  return key in map ? map[key] : null;
}

function mapVeezeeQuestion(q: any, examLevel: string, subject: string): CachedQuestion | null {
  const questionText = cleanText(q?.question ?? q?.text, "");
  if (questionText.length < 6) return null;

  const options = Array.isArray(q?.options) ? q.options : null;
  const optionA = cleanText(options?.[0] ?? q?.option_a, "A");
  const optionB = cleanText(options?.[1] ?? q?.option_b, "B");
  const optionC = cleanText(options?.[2] ?? q?.option_c, "C");
  const optionD = cleanText(options?.[3] ?? q?.option_d, "D");

  let correctIndex: number | null = null;
  if (typeof q?.correctAnswerIndex === "number" && q.correctAnswerIndex >= 0 && q.correctAnswerIndex <= 3) {
    correctIndex = q.correctAnswerIndex;
  } else if (typeof q?.answer === "number" && q.answer >= 0 && q.answer <= 3) {
    correctIndex = q.answer;
  } else {
    correctIndex = mapAnswerLetter(q?.answer);
  }

  const year = cleanText(q?.year, "");
  const explanation = cleanText(q?.explanation, "");
  const imageUrl = cleanText(q?.image ?? q?.image_url ?? q?.imageUrl, "");

  return {
    exam_level: examLevel,
    subject,
    question_text: questionText,
    option_a: optionA,
    option_b: optionB,
    option_c: optionC,
    option_d: optionD,
    correct_answer_index: correctIndex ?? 0,
    ...(year ? { year } : {}),
    ...(explanation ? { explanation } : {}),
    ...(imageUrl ? { image_url: imageUrl } : {}),
  };
}

function mapAlocQuestion(q: any, examLevel: string, subject: string, year: number): CachedQuestion | null {
  const questionText = cleanText(q?.question, "");
  if (questionText.length < 6 || !q?.option) return null;

  const correct = mapAnswerLetter(q?.answer);
  if (correct === null) return null;

  const examYear = cleanText(q?.examyear ?? year, year.toString());
  const explanation = cleanText(q?.section, "");
  const imageUrl = cleanText(q?.image ?? q?.image_url, "");

  return {
    exam_level: examLevel,
    subject,
    question_text: questionText,
    option_a: cleanText(q?.option?.a, "A"),
    option_b: cleanText(q?.option?.b, "B"),
    option_c: cleanText(q?.option?.c, "C"),
    option_d: cleanText(q?.option?.d, "D"),
    correct_answer_index: correct,
    ...(examYear ? { year: examYear } : {}),
    ...(explanation ? { explanation } : {}),
    ...(imageUrl ? { image_url: imageUrl } : {}),
  };
}

function mapGithubQuestions(payload: any, examLevel: string, subject: string): CachedQuestion[] {
  const mapped: CachedQuestion[] = [];
  const years = payload?.questions;
  if (!years || typeof years !== "object") return mapped;

  for (const [yearKey, yearQuestions] of Object.entries(years as Record<string, unknown>)) {
    if (!yearQuestions || typeof yearQuestions !== "object") continue;

    for (const item of Object.values(yearQuestions as Record<string, any>)) {
      const questionText = cleanText(item?.question, "");
      if (questionText.length < 6) continue;

      const correct = mapAnswerLetter(item?.answer);
      if (correct === null) continue;

      const year = cleanText(item?.year, yearKey);

      mapped.push({
        exam_level: examLevel,
        subject,
        question_text: questionText,
        option_a: cleanText(item?.a, "A"),
        option_b: cleanText(item?.b, "B"),
        option_c: cleanText(item?.c, "C"),
        option_d: cleanText(item?.d, "D"),
        correct_answer_index: correct,
        ...(year ? { year } : {}),
      });
    }
  }

  return mapped;
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function upsertInChunks(supabase: any, rows: CachedQuestion[]) {
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const { error } = await supabase
      .from("cached_api_questions")
      .upsert(chunk, { onConflict: "exam_level,subject,question_text", ignoreDuplicates: true });

    if (error) {
      console.error(`Upsert error chunk ${i}-${i + chunk.length}:`, error.message);
    }
  }
}

async function getCount(supabase: any, examLevel: string, subject: string): Promise<number> {
  const { count } = await supabase
    .from("cached_api_questions")
    .select("*", { count: "exact", head: true })
    .eq("exam_level", examLevel)
    .eq("subject", subject);

  return count || 0;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const VEEZEE_API_KEY = Deno.env.get("VEEZEE_API_KEY");
    const ALOC_API_KEY = Deno.env.get("ALOC_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let subject = "Use of English";
    let examLevel = "JAMB / UTME";
    let startYear = 2001;
    let endYear = 2025;
    let targetMin = TARGET_MIN_DEFAULT;

    if (req.method === "POST") {
      try {
        const body = await req.json();
        subject = body.subject || subject;
        examLevel = body.level || examLevel;
        startYear = Number(body.startYear) || startYear;
        endYear = Number(body.endYear) || endYear;
        targetMin = Math.max(1, Number(body.targetMin) || targetMin);
      } catch {
        // ignore invalid body
      }
    }

    const startedAt = Date.now();
    const deadline = startedAt + MAX_EXECUTION_MS;

    console.log(`Bulk fetch: ${subject} (${examLevel}) years ${startYear}-${endYear} target=${targetMin}`);

    const beforeCount = await getCount(supabase, examLevel, subject);
    let currentCount = beforeCount;

    let totalFetched = 0;
    let veezeeFetched = 0;
    let alocFetched = 0;
    let githubFetched = 0;

    // ===== SOURCE 1: VEEZEE (PRIMARY) =====
    if (VEEZEE_API_KEY && Date.now() < deadline) {
      try {
        const veezeeUrl = `${VEEZEE_BASE}?level=${encodeURIComponent(examLevel)}&subject=${encodeURIComponent(subject)}&count=10000`;
        console.log(`Veezee: Fetching ${subject} (up to 10000)`);

        const res = await fetchWithTimeout(veezeeUrl, {
          headers: {
            "X-API-KEY": VEEZEE_API_KEY,
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
        }, 60000);

        if (res.ok) {
          const payload = JSON.parse(await res.text());
          const raw = Array.isArray(payload) ? payload : (payload?.questions || payload?.data || []);
          const rows = (Array.isArray(raw) ? raw : [])
            .map((item) => mapVeezeeQuestion(item, examLevel, subject))
            .filter((item): item is CachedQuestion => item !== null);

          if (rows.length > 0) {
            await upsertInChunks(supabase, rows);
            veezeeFetched = rows.length;
            totalFetched += rows.length;
          }

          currentCount = await getCount(supabase, examLevel, subject);
          console.log(`Veezee total for ${subject}: ${veezeeFetched}, bank=${currentCount}`);
        } else {
          console.log(`Veezee ${res.status} for ${subject}`);
        }
      } catch (err: any) {
        console.error(`Veezee error ${subject}:`, err.message);
      }
    }

    // ===== SOURCE 2: ALOC (FAST-FALLBACK WITH CIRCUIT BREAKER) =====
    const alocParam = ALOC_SUBJECTS[subject];
    if (currentCount < targetMin && alocParam && ALOC_API_KEY && Date.now() < deadline) {
      const alocType = examLevel.includes("JAMB") ? "utme" : "wassce";
      let consecutiveAborts = 0;
      let consecutiveEmptyYears = 0;

      console.log(`ALOC fallback: ${subject} (${alocType})`);

      for (let year = endYear; year >= startYear; year--) {
        if (Date.now() > deadline - 3000) {
          console.log("ALOC stopped early due to execution deadline");
          break;
        }

        try {
          const url = `https://questions.aloc.com.ng/api/v2/q/40?subject=${alocParam}&year=${year}&type=${alocType}`;
          const res = await fetchWithTimeout(url, {
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json",
              "AccessToken": ALOC_API_KEY,
            },
          }, 12000);

          if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
              console.error("ALOC auth failed, stopping fallback");
              break;
            }
            continue;
          }

          const json = await res.json();
          const questions = Array.isArray(json?.data)
            ? json.data
            : json?.data?.question
              ? [json.data]
              : Array.isArray(json)
                ? json
                : [];

          const rows = questions
            .map((q: any) => mapAlocQuestion(q, examLevel, subject, year))
            .filter((q: CachedQuestion | null): q is CachedQuestion => q !== null);

          if (rows.length > 0) {
            await upsertInChunks(supabase, rows);
            alocFetched += rows.length;
            totalFetched += rows.length;
            consecutiveEmptyYears = 0;
            currentCount = await getCount(supabase, examLevel, subject);
            console.log(`ALOC ${subject} ${year}: +${rows.length}, bank=${currentCount}`);

            if (currentCount >= targetMin) {
              break;
            }
          } else {
            consecutiveEmptyYears += 1;
            if (consecutiveEmptyYears >= 8 && alocFetched === 0) {
              console.log("ALOC returned empty for many years, stopping fallback");
              break;
            }
          }

          consecutiveAborts = 0;
          await sleep(120);
        } catch (err: any) {
          const message = String(err?.message || "");
          const aborted = err?.name === "AbortError" || message.toLowerCase().includes("aborted");

          if (aborted) {
            consecutiveAborts += 1;
            console.error(`ALOC timeout ${subject} ${year}: ${message}`);
            if (consecutiveAborts >= 3) {
              console.error("ALOC circuit breaker triggered after repeated timeouts");
              break;
            }
          } else {
            console.error(`ALOC error ${subject} ${year}:`, message);
          }
        }
      }
    }

    if (currentCount < targetMin) {
      currentCount = await getCount(supabase, examLevel, subject);
    }

    // ===== SOURCE 3: GITHUB JAMB DATASET (WEB FALLBACK) =====
    const githubFolder = GITHUB_SUBJECTS[subject];
    if (currentCount < targetMin && githubFolder && Date.now() < deadline) {
      try {
        const githubUrl = `${GITHUB_RAW_BASE}/${githubFolder}/jambquestions.json`;
        console.log(`GitHub fallback: ${subject} from ${githubFolder}`);

        const res = await fetchWithTimeout(githubUrl, {
          headers: {
            "Accept": "application/json,text/plain,*/*",
            "User-Agent": "Lovable-QuestionBank-Sync/1.0",
          },
        }, 25000);

        if (res.ok) {
          const payload = JSON.parse(await res.text());
          const rows = mapGithubQuestions(payload, examLevel, subject);

          if (rows.length > 0) {
            await upsertInChunks(supabase, rows);
            githubFetched = rows.length;
            totalFetched += rows.length;
          }

          currentCount = await getCount(supabase, examLevel, subject);
          console.log(`GitHub total for ${subject}: ${githubFetched}, bank=${currentCount}`);
        } else {
          console.log(`GitHub fallback ${res.status} for ${subject}`);
        }
      } catch (err: any) {
        console.error(`GitHub fallback error ${subject}:`, err.message);
      }
    }

    const afterCount = await getCount(supabase, examLevel, subject);
    const newStored = afterCount - beforeCount;

    console.log(`DONE ${subject}: veezee=${veezeeFetched}, aloc=${alocFetched}, github=${githubFetched}, fetched=${totalFetched}, new=${newStored}, bank=${afterCount}`);

    return new Response(JSON.stringify({
      success: true,
      subject,
      fetched: totalFetched,
      veezeeFetched,
      alocFetched,
      githubFetched,
      newStored,
      totalCached: afterCount,
      targetMin,
      reachedTarget: afterCount >= targetMin,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Bulk fetch error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
