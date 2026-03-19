import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Helper to call AI - uses Lovable Gateway (OpenAI-compatible) or direct Gemini
async function callAI(
  messages: { role: string; content: any }[],
  useLovable: boolean,
  lovableKey: string | undefined,
  geminiKey: string | undefined,
  jsonMode: boolean = false
): Promise<string> {
  if (useLovable) {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("Lovable AI Gateway error:", err);
      throw new Error("AI Gateway request failed");
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  } else {
    // Direct Gemini API (native format)
    const contents = messages.map(m => ({
      role: m.role === "system" ? "user" : m.role,
      parts: typeof m.content === "string" 
        ? [{ text: m.content }]
        : Array.isArray(m.content) ? m.content : [m.content],
    }));

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          ...(jsonMode ? { generationConfig: { responseMimeType: "application/json" } } : {}),
        }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      console.error("Gemini API error:", err);
      throw new Error("Gemini API request failed");
    }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { examLevel, subject, year, textContent, fileBase64, fileType, fileName, storagePath } = await req.json();

    if (!examLevel || !subject) {
      throw new Error("Missing required fields: examLevel, subject");
    }
    if (!textContent && !fileBase64 && !storagePath) {
      throw new Error("No content provided. Please upload a file or paste text.");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const useLovable = !!LOVABLE_API_KEY;

    if (!LOVABLE_API_KEY && !GEMINI_API_KEY) {
      throw new Error("No AI API key configured");
    }

    console.log(`Using ${useLovable ? "Lovable AI Gateway" : "Direct Gemini API"}`);
    console.log(`Processing ${subject} (${examLevel}) - Year: ${year || "auto-detect"}`);

    let extractedText = textContent || "";
    let resolvedBase64 = fileBase64 || "";

    // If storagePath provided, download file from storage and convert to base64
    if (storagePath && !textContent && !fileBase64) {
      console.log("Downloading file from storage:", storagePath);
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const storageSupabase = createClient(supabaseUrl, supabaseKey);

      const { data: fileData, error: downloadError } = await storageSupabase.storage
        .from("documents")
        .download(storagePath);

      if (downloadError) {
        throw new Error(`Failed to download file: ${downloadError.message}`);
      }

      const arrayBuffer = await fileData.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
        binary += String.fromCharCode(...chunk);
      }
      resolvedBase64 = btoa(binary);
      console.log("File downloaded, base64 length:", resolvedBase64.length);

      // Clean up storage file after download
      await storageSupabase.storage.from("documents").remove([storagePath]);
      console.log("Storage file cleaned up");
    }

    // Step 1: Extract text from file using vision
    if (resolvedBase64 && !textContent) {
      console.log("Extracting text from file using AI vision...");

      let mimeType = fileType || "application/octet-stream";
      if (fileName?.endsWith(".pdf")) mimeType = "application/pdf";
      else if (fileName?.endsWith(".jpg") || fileName?.endsWith(".jpeg")) mimeType = "image/jpeg";
      else if (fileName?.endsWith(".png")) mimeType = "image/png";
      else if (fileName?.endsWith(".webp")) mimeType = "image/webp";

      const visionPrompt = "Extract ALL text from this document/image. It contains exam past questions. Transcribe everything accurately: question numbers, options (A, B, C, D), answers, and any mathematical formulas or symbols. Maintain the original structure. If answers are marked or highlighted, note them clearly. IMPORTANT: Also look for and note the exam year (e.g. 'JAMB 2019', 'WAEC 2020', '2018 NECO', etc.) if visible anywhere in the document.";

      if (useLovable) {
        extractedText = await callAI([{
          role: "user",
          content: [
            { type: "text", text: visionPrompt },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${resolvedBase64}` } },
          ],
        }], true, LOVABLE_API_KEY, GEMINI_API_KEY);
      } else {
        extractedText = await callAI([{
          role: "user",
          content: [
            { text: visionPrompt },
            { inline_data: { mime_type: mimeType, data: resolvedBase64 } },
          ],
        }], false, LOVABLE_API_KEY, GEMINI_API_KEY);
      }

      console.log("Extracted text length:", extractedText.length);
    }

    if (!extractedText || extractedText.trim().length < 20) {
      throw new Error("Could not extract meaningful text from the uploaded content.");
    }

    // Step 2: Detect year
    let detectedYear = year || null;

    if (!detectedYear) {
      console.log("Auto-detecting year from content...");
      try {
        const yearContent = await callAI([{
          role: "user",
          content: `Analyze this exam document text and determine the exam year. Look for patterns like "2019 JAMB", "WAEC 2020", "NECO 2018", year headers, copyright dates, or any other year indicators. Also check the filename: "${fileName || 'unknown'}".\n\nReturn ONLY a JSON object: {"year": "2020"} with the 4-digit year string. If you cannot determine the year, return {"year": null}.\n\nDocument text (first 3000 chars):\n${extractedText.substring(0, 3000)}`,
        }], useLovable, LOVABLE_API_KEY, GEMINI_API_KEY, true);

        const parsed = JSON.parse(yearContent);
        if (parsed.year && /^\d{4}$/.test(String(parsed.year))) {
          detectedYear = String(parsed.year);
          console.log("Auto-detected year:", detectedYear);
        }
      } catch (e) {
        console.error("Year detection error:", e);
      }

      if (!detectedYear) {
        detectedYear = String(new Date().getFullYear());
        console.log("Could not detect year, defaulting to:", detectedYear);
      }
    }

    // Step 3: Extract structured questions
    console.log("Extracting structured questions with AI solving...");

    const systemPrompt = `You are an expert ${subject} teacher and examiner specializing in Nigerian ${examLevel} examinations.

Your task is to extract ALL questions from the provided text AND ensure every question has a verified correct answer.

CRITICAL RULES:
1. Extract questions EXACTLY as they appear - do NOT modify, rephrase, or create new questions
2. Keep original options (A, B, C, D) exactly as written
3. For ANSWERED questions (where the answer is already marked/indicated in the document): use that answer
4. For UNANSWERED questions (no answer marked): USE YOUR EXPERT KNOWLEDGE to determine the correct answer
5. Extract ALL questions - do not skip any
6. Each question MUST have exactly 4 options
7. Provide a clear, educational explanation for EVERY answer
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
      "explanation": "Clear explanation of why this is correct.",
      "was_pre_answered": true
    }
  ]
}

correct_answer_index: 0=A, 1=B, 2=C, 3=D
was_pre_answered: true if the answer was already in the document, false if you solved it yourself`;

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

    function extractJSON(raw: string): any {
      // Try direct parse first
      try { return JSON.parse(raw); } catch {}
      // Try extracting JSON from markdown code blocks
      const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlock) {
        try { return JSON.parse(codeBlock[1].trim()); } catch {}
      }
      // Try finding the JSON object/array boundaries
      const start = raw.indexOf('{');
      const arrStart = raw.indexOf('[');
      const useArr = arrStart !== -1 && (start === -1 || arrStart < start);
      const openChar = useArr ? '[' : '{';
      const closeChar = useArr ? ']' : '}';
      const idx = useArr ? arrStart : start;
      if (idx === -1) throw new Error("No JSON found in response");
      // Find matching closing bracket from the end
      let lastIdx = raw.lastIndexOf(closeChar);
      if (lastIdx <= idx) throw new Error("No matching closing bracket");
      const candidate = raw.substring(idx, lastIdx + 1);
      try { return JSON.parse(candidate); } catch {}
      // Last resort: fix common issues (trailing commas, unescaped newlines in strings)
      const fixed = candidate
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/[\x00-\x1f]/g, (c) => c === '\n' ? '\\n' : c === '\t' ? '\\t' : '');
      return JSON.parse(fixed);
    }

    for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
      console.log(`Processing chunk ${chunkIdx + 1}/${chunks.length}...`);
      
      const userPrompt = `Extract ALL exam questions from this text. For questions WITHOUT marked answers, solve them yourself using your expert knowledge:\n\n${chunks[chunkIdx]}`;
      let parsed: any = null;

      // Attempt 1: normal request
      try {
        const content = await callAI([
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ], useLovable, LOVABLE_API_KEY, GEMINI_API_KEY, true);
        console.log(`AI response length (attempt 1): ${content.length}`);
        parsed = extractJSON(content);
      } catch (e) {
        console.error(`Chunk ${chunkIdx + 1} attempt 1 failed:`, e);
      }

      // Attempt 2: retry with stricter prompt if first attempt failed
      if (!parsed) {
        console.log(`Retrying chunk ${chunkIdx + 1} with stricter prompt...`);
        try {
          const strictPrompt = `You MUST respond with ONLY a valid JSON object. No markdown, no explanation, no code blocks. Just raw JSON.
Do NOT use special characters or newlines inside string values - escape them properly.
Keep explanations short (under 200 characters each) to avoid JSON formatting issues.

${systemPrompt}`;
          const content = await callAI([
            { role: "system", content: strictPrompt },
            { role: "user", content: userPrompt },
          ], useLovable, LOVABLE_API_KEY, GEMINI_API_KEY, true);
          console.log(`AI response length (attempt 2): ${content.length}`);
          parsed = extractJSON(content);
        } catch (e2) {
          console.error(`Chunk ${chunkIdx + 1} attempt 2 also failed:`, e2);
        }
      }

      if (parsed) {
        const questions = parsed.questions || (Array.isArray(parsed) ? parsed : []);
        if (Array.isArray(questions)) {
          allQuestions.push(...questions);
          console.log(`Chunk ${chunkIdx + 1}: extracted ${questions.length} questions`);
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

    // Step 4: Save to database
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

    let insertedCount = 0;
    const batchSize = 50;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error: insertError, data: insertData } = await supabase
        .from("cached_api_questions")
        .upsert(batch, { onConflict: "exam_level,subject,question_text" })
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
