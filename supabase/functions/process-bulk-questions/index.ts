import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Maximum characters per chunk - reduced to ensure AI can return ALL questions
const MAX_CHUNK_SIZE = 10000;

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
      // Check for specific error types
      const quotaError = chunkErrors.find(e => e.includes("QUOTA_EXCEEDED"));
      const rateLimitError = chunkErrors.find(e => e.includes("RATE_LIMITED"));
      const authError = chunkErrors.find(e => e.includes("invalid") || e.includes("unauthorized"));
      
      let errorMsg: string;
      let errorCode: string;
      let statusCode = 400;
      
      if (quotaError) {
        errorMsg = "Your Gemini API quota has been exhausted. Please check your Google AI Studio billing settings at https://aistudio.google.com/ or wait for your daily quota to reset.";
        errorCode = "QUOTA_EXCEEDED";
        statusCode = 429;
      } else if (rateLimitError) {
        errorMsg = "Too many requests. Please wait 30-60 seconds and try again.";
        errorCode = "RATE_LIMITED";
        statusCode = 429;
      } else if (authError) {
        errorMsg = "Gemini API key issue. Please verify your API key is valid and has the correct permissions.";
        errorCode = "AUTH_ERROR";
        statusCode = 401;
      } else if (chunkErrors.length > 0) {
        errorMsg = `Failed to extract questions: ${chunkErrors.join("; ")}`;
        errorCode = "EXTRACTION_FAILED";
      } else {
        errorMsg = "No questions could be extracted from the text. Please check the format and ensure questions are clearly numbered or structured.";
        errorCode = "NO_QUESTIONS_FOUND";
      }
      
      console.error("process-bulk-questions: No questions extracted, code:", errorCode);
      return new Response(
        JSON.stringify({ 
          error: errorMsg,
          code: errorCode 
        }),
        { status: statusCode, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  
  if (!GEMINI_API_KEY) {
    console.error("process-bulk-questions: Missing GEMINI_API_KEY");
    throw new Error("AI service not configured. Please add your Gemini API key.");
  }

  console.log(`process-bulk-questions: Calling Gemini for chunk ${chunkNum}/${totalChunks}...`);
  const aiStartTime = Date.now();

  const systemPrompt = `You are an expert at extracting exam questions from text. Your CRITICAL job is to EXTRACT ALL questions - never skip or truncate.

ABSOLUTE RULES:
1. Extract EVERY SINGLE QUESTION - there is NO limit on output
2. If the text has 100 questions, return exactly 100. If it has 150, return all 150
3. Extract questions EXACTLY as written - do not modify or paraphrase
4. If a question has options (A, B, C, D), keep them exactly as written
5. If a question lacks options, add plausible ones but keep question text unchanged
6. Identify correct answers from markers like "Answer: B", "*B", or "(correct)"
7. Default correct_answer to "A" if not marked
8. DO NOT summarize, skip, or limit your output in any way

IMPORTANT: Count the questions in the input and ensure your output has the SAME count.

Output JSON format:
{
  "questions": [
    {
      "question": "Exact question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "A",
      "explanation": ""
    }
  ]
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\nIMPORTANT: Extract EVERY question from this text without skipping any. Count them first, then return ALL of them:\n\n${text}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    }
  );

  const aiDuration = Date.now() - aiStartTime;
  console.log(`process-bulk-questions: Gemini response received in ${aiDuration}ms, status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("process-bulk-questions: Gemini API error:", response.status, errorText);
    
    if (response.status === 429) {
      // Check if it's a quota exceeded vs rate limit
      if (errorText.includes("quota") || errorText.includes("RESOURCE_EXHAUSTED")) {
        throw new Error("QUOTA_EXCEEDED: Your Gemini API quota has been exhausted. Please check your Google AI Studio billing settings or wait for your quota to reset.");
      }
      throw new Error("RATE_LIMITED: Gemini rate limit reached. Please wait a moment and try again.");
    } else if (response.status === 400) {
      throw new Error("Invalid request to Gemini. Please check your API key configuration.");
    } else if (response.status === 401 || response.status === 403) {
      throw new Error("Gemini API key is invalid or unauthorized. Please check your API key in backend secrets.");
    } else if (response.status === 413) {
      throw new Error("Text is too large for processing. Please try with fewer questions.");
    } else if (response.status >= 500) {
      throw new Error("Gemini service is temporarily unavailable. Please try again later.");
    }
    
    throw new Error(`Gemini extraction failed (${response.status}): ${errorText.substring(0, 100)}`);
  }

  const result = await response.json();
  
  if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
    console.error("process-bulk-questions: Invalid Gemini response structure:", JSON.stringify(result).substring(0, 200));
    throw new Error("Gemini returned an invalid response. Please try again.");
  }
  
  const content = result.candidates[0].content.parts[0].text;
  console.log("process-bulk-questions: Gemini response preview:", content.substring(0, 300));

  try {
    const parsed = JSON.parse(content);
    const questions = parsed.questions || parsed;
    
    if (!Array.isArray(questions)) {
      console.error("process-bulk-questions: Parsed result is not an array:", typeof questions);
      throw new Error("Gemini returned questions in an unexpected format.");
    }
    
    console.log(`process-bulk-questions: Chunk ${chunkNum} parsed ${questions.length} questions`);
    return questions;
  } catch (e: any) {
    console.error("process-bulk-questions: JSON parse error:", e.message);
    console.error("process-bulk-questions: Failed content preview:", content.substring(0, 500));
    throw new Error("Failed to parse Gemini response. The text format may not be supported.");
  }
}
