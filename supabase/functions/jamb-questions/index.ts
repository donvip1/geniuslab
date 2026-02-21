import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
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

    console.log("Serving from cache:", { subjects, questionsPerSubject, level });

    const subjectsToFetch = subjects.length > 0 ? subjects : ["English Language"];
    const allQuestions: any[] = [];

    for (const subject of subjectsToFetch) {
      // Serve directly from cache
      const { data: cached, error } = await supabase
        .from("cached_api_questions")
        .select("*")
        .eq("exam_level", level)
        .eq("subject", subject);

      if (error) {
        console.error(`Cache read error for ${subject}:`, error.message);
        continue;
      }

      const pool = cached || [];
      console.log(`${subject}: ${pool.length} cached, serving ${Math.min(questionsPerSubject, pool.length)}`);

      // Shuffle and pick requested count
      const shuffled = pool.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, questionsPerSubject);

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
