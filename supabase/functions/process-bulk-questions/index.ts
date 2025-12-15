import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Maximum characters per chunk to stay within AI token limits
const MAX_CHUNK_SIZE = 15000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const { text, subjectId, userId } = body;
    
    // Validate required fields
    if (!text || typeof text !== "string") {
      console.error("process-bulk-questions: Missing or invalid 'text' field");
      return new Response(
        JSON.stringify({ 
          error: "Missing or invalid text content. Please provide the questions text.",
          code: "INVALID_TEXT" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!subjectId) {
      console.error("process-bulk-questions: Missing 'subjectId' field");
      return new Response(
        JSON.stringify({ 
          error: "Please select a subject before importing questions.",
          code: "MISSING_SUBJECT" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!userId) {
      console.error("process-bulk-questions: Missing 'userId' field");
      return new Response(
        JSON.stringify({ 
          error: "User authentication required. Please log in again.",
          code: "MISSING_USER" 
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("process-bulk-questions: Starting processing");
    console.log("process-bulk-questions: Subject ID:", subjectId);
    console.log("process-bulk-questions: Text length:", text.length, "characters");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("process-bulk-questions: Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error. Please contact support.",
          code: "CONFIG_ERROR" 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Split text into chunks if it's too large
    const chunks = splitTextIntoChunks(text, MAX_CHUNK_SIZE);
    console.log("process-bulk-questions: Split into", chunks.length, "chunk(s)");

    let allQuestions: any[] = [];
    let chunkErrors: string[] = [];

    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`process-bulk-questions: Processing chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`);
      
      try {
        const questions = await extractQuestions(chunk, i + 1, chunks.length);
        console.log(`process-bulk-questions: Chunk ${i + 1} extracted ${questions.length} questions`);
        allQuestions = allQuestions.concat(questions);
      } catch (chunkError: any) {
        console.error(`process-bulk-questions: Chunk ${i + 1} failed:`, chunkError.message);
        chunkErrors.push(`Chunk ${i + 1}: ${chunkError.message}`);
      }
    }

    if (allQuestions.length === 0) {
      const errorMsg = chunkErrors.length > 0 
        ? `Failed to extract questions. Errors: ${chunkErrors.join("; ")}`
        : "No questions could be extracted from the text. Please check the format and ensure questions are clearly numbered or structured.";
      
      console.error("process-bulk-questions: No questions extracted");
      return new Response(
        JSON.stringify({ 
          error: errorMsg,
          code: "NO_QUESTIONS_FOUND" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("process-bulk-questions: Total questions extracted:", allQuestions.length);

    // Validate and clean questions before insert
    const validQuestions = allQuestions.filter((q, index) => {
      if (!q.question || typeof q.question !== "string" || q.question.trim().length < 5) {
        console.warn(`process-bulk-questions: Skipping invalid question at index ${index}`);
        return false;
      }
      return true;
    });

    if (validQuestions.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "All extracted questions were invalid. Please ensure questions are properly formatted.",
          code: "INVALID_QUESTIONS" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("process-bulk-questions: Valid questions to insert:", validQuestions.length);

    // Insert questions in batches to avoid timeout
    const BATCH_SIZE = 50;
    let insertedCount = 0;
    
    for (let i = 0; i < validQuestions.length; i += BATCH_SIZE) {
      const batch = validQuestions.slice(i, i + BATCH_SIZE);
      console.log(`process-bulk-questions: Inserting batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} questions)`);
      
      const questionsToInsert = batch.map((q: any) => ({
        subject_id: subjectId,
        question_text: q.question.trim(),
        option_a: (q.options?.[0] || "Option A").trim(),
        option_b: (q.options?.[1] || "Option B").trim(),
        option_c: (q.options?.[2] || "Option C").trim(),
        option_d: (q.options?.[3] || "Option D").trim(),
        correct_answer: validateAnswer(q.correct_answer),
        explanation: (q.explanation || "").trim(),
        is_active: true,
        created_by: userId,
      }));

      const { error: insertError } = await supabase
        .from("questions")
        .insert(questionsToInsert);

      if (insertError) {
        console.error("process-bulk-questions: Insert error:", insertError);
        
        // Determine specific error
        let userMessage = "Failed to save questions to database.";
        if (insertError.code === "23503") {
          userMessage = "Invalid subject selected. Please refresh and try again.";
        } else if (insertError.code === "23505") {
          userMessage = "Some questions may already exist in the database.";
        } else if (insertError.message) {
          userMessage = `Database error: ${insertError.message}`;
        }
        
        return new Response(
          JSON.stringify({ 
            error: userMessage,
            code: "DATABASE_ERROR",
            details: insertError.message
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      insertedCount += batch.length;
    }

    const duration = Date.now() - startTime;
    console.log(`process-bulk-questions: Successfully inserted ${insertedCount} questions in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        questionsCreated: insertedCount,
        totalExtracted: allQuestions.length,
        skippedInvalid: allQuestions.length - validQuestions.length,
        chunksProcessed: chunks.length,
        processingTimeMs: duration,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error("process-bulk-questions: Unexpected error after", duration, "ms:", error);
    
    // Determine user-friendly error message
    let userMessage = "An unexpected error occurred while processing questions.";
    let errorCode = "UNEXPECTED_ERROR";
    
    if (error.message?.includes("timeout") || error.message?.includes("Timeout")) {
      userMessage = "The request took too long. Try uploading fewer questions at once (max 50-60 recommended).";
      errorCode = "TIMEOUT";
    } else if (error.message?.includes("AI API") || error.message?.includes("extraction")) {
      userMessage = "Failed to analyze the text. Please ensure questions are clearly formatted.";
      errorCode = "AI_ERROR";
    } else if (error.message?.includes("parse") || error.message?.includes("JSON")) {
      userMessage = "Failed to process the extracted content. Please check your question format.";
      errorCode = "PARSE_ERROR";
    }
    
    return new Response(
      JSON.stringify({ 
        error: userMessage,
        code: errorCode,
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function splitTextIntoChunks(text: string, maxSize: number): string[] {
  if (text.length <= maxSize) {
    return [text];
  }
  
  const chunks: string[] = [];
  let remaining = text;
  
  while (remaining.length > 0) {
    if (remaining.length <= maxSize) {
      chunks.push(remaining);
      break;
    }
    
    // Try to split at a question boundary (numbered questions)
    let splitIndex = maxSize;
    
    // Look for question number patterns to split at
    const searchArea = remaining.substring(maxSize - 500, maxSize + 500);
    const patterns = [
      /\n\d{1,3}\.\s/g,      // "1. ", "12. ", "123. "
      /\n\d{1,3}\)\s/g,      // "1) ", "12) "
      /\nQuestion\s+\d+/gi,  // "Question 1"
      /\n[A-Z]\.\s/g,        // "A. " (but this might be an option)
    ];
    
    for (const pattern of patterns) {
      const matches = [...searchArea.matchAll(pattern)];
      if (matches.length > 0) {
        // Find the last match before maxSize
        const lastMatchBeforeMax = matches.filter(m => 
          (maxSize - 500 + (m.index || 0)) < maxSize
        ).pop();
        
        if (lastMatchBeforeMax && lastMatchBeforeMax.index !== undefined) {
          splitIndex = maxSize - 500 + lastMatchBeforeMax.index;
          break;
        }
      }
    }
    
    // Fallback: split at last newline before maxSize
    if (splitIndex === maxSize) {
      const lastNewline = remaining.lastIndexOf("\n", maxSize);
      if (lastNewline > maxSize * 0.5) {
        splitIndex = lastNewline;
      }
    }
    
    chunks.push(remaining.substring(0, splitIndex));
    remaining = remaining.substring(splitIndex);
  }
  
  console.log("process-bulk-questions: Created", chunks.length, "chunks of sizes:", chunks.map(c => c.length));
  return chunks;
}

function validateAnswer(answer: string | undefined): string {
  if (!answer) return "A";
  const normalized = answer.toString().toUpperCase().trim();
  if (["A", "B", "C", "D"].includes(normalized)) {
    return normalized;
  }
  // Handle "1", "2", "3", "4" format
  const numMap: Record<string, string> = { "1": "A", "2": "B", "3": "C", "4": "D" };
  if (numMap[normalized]) {
    return numMap[normalized];
  }
  return "A";
}

async function extractQuestions(text: string, chunkNum: number, totalChunks: number): Promise<any[]> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    console.error("process-bulk-questions: Missing LOVABLE_API_KEY");
    throw new Error("AI service not configured. Please contact support.");
  }

  console.log(`process-bulk-questions: Calling AI for chunk ${chunkNum}/${totalChunks}...`);
  const aiStartTime = Date.now();

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
8. Handle various question formats including numbered lists, lettered options, and different marking styles

Common formats to recognize:
- Numbered questions: "1. Question text", "1) Question text"
- Questions with A/B/C/D options (with dots, parentheses, or just letters)
- Questions with answer marked as "Answer: X", "Ans: X", "Correct: X"
- Questions with correct answer indicated by asterisk (*), bold, or underline descriptions

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

  const aiDuration = Date.now() - aiStartTime;
  console.log(`process-bulk-questions: AI response received in ${aiDuration}ms, status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("process-bulk-questions: AI API error:", response.status, errorText);
    
    if (response.status === 429) {
      throw new Error("AI service is temporarily busy. Please try again in a few moments.");
    } else if (response.status === 413) {
      throw new Error("Text is too large for processing. Please try with fewer questions.");
    } else if (response.status >= 500) {
      throw new Error("AI service is temporarily unavailable. Please try again later.");
    }
    
    throw new Error(`AI extraction failed (${response.status}): ${errorText.substring(0, 100)}`);
  }

  const result = await response.json();
  
  if (!result.choices?.[0]?.message?.content) {
    console.error("process-bulk-questions: Invalid AI response structure:", JSON.stringify(result).substring(0, 200));
    throw new Error("AI returned an invalid response. Please try again.");
  }
  
  const content = result.choices[0].message.content;
  console.log("process-bulk-questions: AI response preview:", content.substring(0, 300));

  try {
    const parsed = JSON.parse(content);
    const questions = parsed.questions || parsed;
    
    if (!Array.isArray(questions)) {
      console.error("process-bulk-questions: Parsed result is not an array:", typeof questions);
      throw new Error("AI returned questions in an unexpected format.");
    }
    
    console.log(`process-bulk-questions: Chunk ${chunkNum} parsed ${questions.length} questions`);
    return questions;
  } catch (e: any) {
    console.error("process-bulk-questions: JSON parse error:", e.message);
    console.error("process-bulk-questions: Failed content preview:", content.substring(0, 500));
    throw new Error("Failed to parse AI response. The text format may not be supported.");
  }
}
