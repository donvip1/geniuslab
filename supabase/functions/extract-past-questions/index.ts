import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { examLevel, subject, year, textContent, fileBase64, fileType, fileName } = await req.json();

    if (!examLevel || !subject) {
      throw new Error("Missing required fields: examLevel, subject");
    }

    if (!textContent && !fileBase64) {
      throw new Error("No content provided. Please upload a file or paste text.");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    
    // Prefer Lovable AI Gateway, fallback to direct Gemini
    const useLovableGateway = !!LOVABLE_API_KEY;
    
    if (!LOVABLE_API_KEY && !GEMINI_API_KEY) {
      throw new Error("No AI API key configured (LOVABLE_API_KEY or GEMINI_API_KEY)");
    }
    
    const aiBaseUrl = useLovableGateway 
      ? "https://ai-gateway.lovable.dev/google/gemini-2.5-flash"
      : `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash`;
    
    const getAiUrl = () => useLovableGateway 
      ? aiBaseUrl 
      : `${aiBaseUrl}:generateContent?key=${GEMINI_API_KEY}`;
    
    const getAiHeaders = (): Record<string, string> => {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (useLovableGateway) {
        headers["Authorization"] = `Bearer ${LOVABLE_API_KEY}`;
      }
      return headers;
    };
    
    console.log(`Using ${useLovableGateway ? "Lovable AI Gateway" : "Direct Gemini API"}`);

    console.log(`Processing ${subject} (${examLevel}) - Year: ${year || "auto-detect"}`);

    let extractedText = textContent || "";

    // If we have a file (PDF/image), use Gemini vision to extract text first
    if (fileBase64 && !textContent) {
      console.log("Extracting text from file using Gemini vision...");
      
      let mimeType = fileType || "application/octet-stream";
      if (fileName?.endsWith(".pdf")) mimeType = "application/pdf";
      else if (fileName?.endsWith(".jpg") || fileName?.endsWith(".jpeg")) mimeType = "image/jpeg";
      else if (fileName?.endsWith(".png")) mimeType = "image/png";
      else if (fileName?.endsWith(".webp")) mimeType = "image/webp";

      const visionResponse = await fetch(
        getAiUrl(),
        {
          method: "POST",
          headers: getAiHeaders(),
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  text: "Extract ALL text from this document/image. It contains exam past questions. Transcribe everything accurately: question numbers, options (A, B, C, D), answers, and any mathematical formulas or symbols. Maintain the original structure. If answers are marked or highlighted, note them clearly. IMPORTANT: Also look for and note the exam year (e.g. 'JAMB 2019', 'WAEC 2020', '2018 NECO', etc.) if visible anywhere in the document.",
                },
                {
                  inline_data: { mime_type: mimeType, data: fileBase64 },
                },
              ],
            }],
          }),
        }
      );

      if (!visionResponse.ok) {
        const errText = await visionResponse.text();
        console.error("Vision extraction error:", errText);
        throw new Error("Failed to extract text from the uploaded file.");
      }

      const visionResult = await visionResponse.json();
      extractedText = visionResult.candidates?.[0]?.content?.parts?.[0]?.text || "";
      console.log("Extracted text length:", extractedText.length);
    }

    if (!extractedText || extractedText.trim().length < 20) {
      throw new Error("Could not extract meaningful text from the uploaded content.");
    }

    // Determine year: use provided year or ask AI to detect it
    let detectedYear = year || null;

    if (!detectedYear) {
      console.log("Auto-detecting year from content...");
      const yearDetectResponse = await fetch(
        getAiUrl(),
        {
          method: "POST",
          headers: getAiHeaders(),
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Analyze this exam document text and determine the exam year. Look for patterns like "2019 JAMB", "WAEC 2020", "NECO 2018", year headers, copyright dates, or any other year indicators. Also check the filename: "${fileName || 'unknown'}".

Return ONLY a JSON object: {"year": "2020"} with the 4-digit year string. If you cannot determine the year, return {"year": null}.

Document text (first 3000 chars):
${extractedText.substring(0, 3000)}`,
              }],
            }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        }
      );

      if (yearDetectResponse.ok) {
        const yearResult = await yearDetectResponse.json();
        const yearContent = yearResult.candidates?.[0]?.content?.parts?.[0]?.text;
        if (yearContent) {
          try {
            const parsed = JSON.parse(yearContent);
            if (parsed.year && /^\d{4}$/.test(String(parsed.year))) {
              detectedYear = String(parsed.year);
              console.log("Auto-detected year:", detectedYear);
            }
          } catch (e) {
            console.error("Year detection parse error:", e);
          }
        }
      }

      if (!detectedYear) {
        detectedYear = String(new Date().getFullYear());
        console.log("Could not detect year, defaulting to:", detectedYear);
      }
    }

    // Now extract structured questions using Gemini
    console.log("Extracting structured questions with AI solving...");
    
    const systemPrompt = `You are an expert ${subject} teacher and examiner specializing in Nigerian ${examLevel} examinations.

Your task is to extract ALL questions from the provided text AND ensure every question has a verified correct answer.

CRITICAL RULES:
1. Extract questions EXACTLY as they appear - do NOT modify, rephrase, or create new questions
2. Keep original options (A, B, C, D) exactly as written
3. For ANSWERED questions (where the answer is already marked/indicated in the document): use that answer
4. For UNANSWERED questions (no answer marked): USE YOUR EXPERT KNOWLEDGE to determine the correct answer. You are a subject matter expert — solve the question yourself and pick the right option
5. Extract ALL questions - do not skip any
6. Each question MUST have exactly 4 options
7. Provide a clear, educational explanation for EVERY answer — especially for questions you solved yourself
8. For math/science questions, show the working/reasoning in the explanation
9. Double-check your answers for accuracy before responding

This is a ${examLevel} ${subject} past question from year ${detectedYear}.

Return a JSON object:
{
  "questions": [
    {
      "question_text": "The exact question text",
      "option_a": "Option A text",
      "option_b": "Option B text", 
      "option_c": "Option C text",
      "option_d": "Option D text",
      "correct_answer_index": 0,
      "explanation": "Clear explanation of why this is correct. For unsolved questions, show your reasoning.",
      "was_pre_answered": true
    }
  ]
}

correct_answer_index: 0=A, 1=B, 2=C, 3=D
was_pre_answered: true if the answer was already in the document, false if you solved it yourself`;

    // Chunk large texts to avoid token limits
    const maxChunkLength = 25000;
    const chunks: string[] = [];
    
    if (extractedText.length <= maxChunkLength) {
      chunks.push(extractedText);
    } else {
      for (let i = 0; i < extractedText.length; i += maxChunkLength) {
        chunks.push(extractedText.substring(i, i + maxChunkLength));
      }
    }

    const allQuestions: any[] = [];

    for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
      console.log(`Processing chunk ${chunkIdx + 1}/${chunks.length}...`);
      
      const extractResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${systemPrompt}\n\nExtract ALL exam questions from this text. For questions WITHOUT marked answers, solve them yourself using your expert knowledge:\n\n${chunks[chunkIdx]}`,
              }],
            }],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!extractResponse.ok) {
        const errText = await extractResponse.text();
        console.error(`Chunk ${chunkIdx + 1} extraction error:`, errText);
        continue;
      }

      const extractResult = await extractResponse.json();
      const content = extractResult.candidates?.[0]?.content?.parts?.[0]?.text;

      if (content) {
        try {
          const parsed = JSON.parse(content);
          const questions = parsed.questions || parsed;
          if (Array.isArray(questions)) {
            allQuestions.push(...questions);
          }
        } catch (e) {
          console.error(`Failed to parse chunk ${chunkIdx + 1}:`, e);
        }
      }
    }

    console.log(`Total questions extracted: ${allQuestions.length}`);
    
    const preAnswered = allQuestions.filter(q => q.was_pre_answered === true).length;
    const aiSolved = allQuestions.filter(q => q.was_pre_answered === false).length;
    console.log(`Pre-answered: ${preAnswered}, AI-solved: ${aiSolved}`);

    if (allQuestions.length === 0) {
      throw new Error("No questions could be extracted. Please check the file contains exam questions with options.");
    }

    // Save to cached_api_questions table
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const rows = allQuestions.map(q => ({
      exam_level: examLevel,
      subject: subject,
      question_text: q.question_text || q.question || "",
      option_a: q.option_a || q.options?.[0] || "Option A",
      option_b: q.option_b || q.options?.[1] || "Option B",
      option_c: q.option_c || q.options?.[2] || "Option C",
      option_d: q.option_d || q.options?.[3] || "Option D",
      correct_answer_index: typeof q.correct_answer_index === "number" 
        ? q.correct_answer_index 
        : (q.correct_answer === "A" ? 0 : q.correct_answer === "B" ? 1 : q.correct_answer === "C" ? 2 : q.correct_answer === "D" ? 3 : 0),
      explanation: q.explanation || null,
      year: detectedYear,
    })).filter(r => r.question_text.length > 5);

    // Insert in batches of 50
    let insertedCount = 0;
    const batchSize = 50;
    
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error: insertError, data: insertData } = await supabase
        .from("cached_api_questions")
        .upsert(batch, { onConflict: "exam_level,subject,question_text", ignoreDuplicates: true })
        .select("id");

      if (insertError) {
        console.error(`Batch insert error (${i}-${i + batchSize}):`, insertError.message);
      } else {
        insertedCount += insertData?.length || 0;
      }
    }

    console.log(`Successfully inserted ${insertedCount} questions`);

    return new Response(
      JSON.stringify({
        success: true,
        questionsExtracted: rows.length,
        questionsInserted: insertedCount,
        preAnswered,
        aiSolved,
        detectedYear,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
