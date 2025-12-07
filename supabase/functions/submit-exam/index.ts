import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubmitExamRequest {
  subjectId: string;
  answers: Record<string, string>;
  questionIds: string[];
  timeTakenSeconds: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("submit-exam: Starting exam submission");

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("submit-exam: No authorization header");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } }
      }
    );

    // Get the user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error("submit-exam: User auth error", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log("submit-exam: User authenticated", user.id);

    // Parse request body
    const { subjectId, answers, questionIds, timeTakenSeconds }: SubmitExamRequest = await req.json();
    console.log("submit-exam: Processing submission for subject", subjectId, "with", questionIds.length, "questions");

    if (!subjectId || !questionIds || questionIds.length === 0) {
      console.error("submit-exam: Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role to fetch correct answers (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch the questions with correct answers using admin client
    const { data: questionsData, error: questionsError } = await supabaseAdmin
      .from('questions')
      .select('id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation')
      .in('id', questionIds);

    if (questionsError) {
      console.error("submit-exam: Error fetching questions", questionsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch questions" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!questionsData || questionsData.length === 0) {
      console.error("submit-exam: No questions found for provided IDs");
      return new Response(
        JSON.stringify({ error: "Questions not found" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("submit-exam: Found", questionsData.length, "questions");

    // Create a map for quick lookup and preserve original order
    const questionsMap = new Map(questionsData.map(q => [q.id, q]));
    
    // Build results in the order of questionIds (preserves shuffle order)
    let correctCount = 0;
    const questionResults = questionIds.map(qId => {
      const question = questionsMap.get(qId);
      if (!question) {
        return null;
      }
      
      const userAnswer = answers[qId] || "";
      const isCorrect = userAnswer === question.correct_answer;
      if (isCorrect) correctCount++;

      return {
        id: question.id,
        question_text: question.question_text,
        option_a: question.option_a,
        option_b: question.option_b,
        option_c: question.option_c,
        option_d: question.option_d,
        correct_answer: question.correct_answer,
        explanation: question.explanation,
        user_answer: userAnswer,
        is_correct: isCorrect,
      };
    }).filter(Boolean);

    console.log("submit-exam: Score calculated -", correctCount, "/", questionResults.length);

    // Save exam attempt using user's client (respects RLS)
    const { error: insertError } = await supabaseClient.from("exam_attempts").insert([
      {
        user_id: user.id,
        subject_id: subjectId,
        score: correctCount,
        total_questions: questionResults.length,
        time_taken_seconds: timeTakenSeconds,
        answers: answers,
      },
    ]);

    if (insertError) {
      console.error("submit-exam: Error saving exam attempt", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save exam attempt" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("submit-exam: Exam attempt saved successfully");

    // Return results with correct answers (only revealed after submission)
    return new Response(
      JSON.stringify({
        success: true,
        score: correctCount,
        totalQuestions: questionResults.length,
        questions: questionResults,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("submit-exam: Unexpected error", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
