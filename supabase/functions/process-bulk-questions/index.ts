import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { text, subjectId, userId } = await req.json();
    console.log("Processing bulk questions for subject:", subjectId);
    console.log("Text length:", text.length);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use AI to extract questions from the pasted text
    const questions = await extractQuestions(text);
    console.log("Questions extracted:", questions.length);

    if (questions.length === 0) {
      throw new Error("No questions could be extracted from the text. Please check the format.");
    }

    // Save questions to database
    const { error: insertError } = await supabase
      .from("questions")
      .insert(
        questions.map((q: any) => ({
          subject_id: subjectId,
          question_text: q.question,
          option_a: q.options[0] || "Option A",
          option_b: q.options[1] || "Option B",
          option_c: q.options[2] || "Option C",
          option_d: q.options[3] || "Option D",
          correct_answer: q.correct_answer || "A",
          explanation: q.explanation || "",
          is_active: true,
          created_by: userId,
        }))
      );

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error(`Failed to save questions: ${insertError.message}`);
    }

    console.log("Questions saved successfully");

    return new Response(
      JSON.stringify({
        success: true,
        questionsCreated: questions.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error processing bulk questions:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function extractQuestions(text: string): Promise<any[]> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  console.log("Extracting questions from text using AI...");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `You are an expert at extracting exam questions from text. Your job is to EXTRACT the EXACT questions from the text - DO NOT create new questions or modify the existing ones.

CRITICAL RULES:
1. Extract questions EXACTLY as they appear in the text
2. If a question already has options (A, B, C, D), keep them exactly as written
3. If a question doesn't have options, you may add plausible options BUT the question text must remain unchanged
4. Preserve the original wording, numbers, formulas, and formatting
5. The correct answer should be identified from the text if marked (e.g., "Answer: B", "*B", "B (correct)"), otherwise set to "A"
6. DO NOT paraphrase, summarize, or modify the questions in any way
7. Extract ALL questions from the text, not just a few

Common formats to recognize:
- Numbered questions: "1. Question text"
- Questions with A/B/C/D options
- Questions with answer marked as "Answer: X" or "Ans: X"
- Questions with correct answer indicated by asterisk (*) or bold

Output format - return a JSON object with a "questions" array:
{
  "questions": [
    {
      "question": "The exact question text",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correct_answer": "A",
      "explanation": "Brief explanation if available"
    }
  ]
}

Rules for correct_answer:
- Must be exactly "A", "B", "C", or "D"
- Match it to the correct option in the options array`,
        },
        {
          role: "user",
          content: `Extract ALL exam questions from this text. Keep them EXACTLY as written. Do not skip any questions:\n\n${text}`,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI question extraction error:", errorText);
    throw new Error(`AI API error: ${errorText}`);
  }

  const result = await response.json();
  const content = result.choices[0].message.content;

  console.log("AI response for questions:", content.substring(0, 500));

  try {
    const parsed = JSON.parse(content);
    const questions = parsed.questions || parsed;
    console.log("Parsed questions count:", questions.length);
    return questions;
  } catch (e) {
    console.error("Failed to parse questions JSON:", content);
    throw new Error("Failed to parse extracted questions");
  }
}
