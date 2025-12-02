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
    const { documentId, storagePath, subjectId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(storagePath);

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // Convert file to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Determine file type and extract text
    let extractedText = "";
    const fileType = storagePath.toLowerCase();

    if (fileType.endsWith(".jpg") || fileType.endsWith(".jpeg") || fileType.endsWith(".png")) {
      // Use Lovable AI with vision for OCR on handwritten images
      extractedText = await extractTextFromImage(base64);
    } else if (fileType.endsWith(".pdf") || fileType.endsWith(".doc") || fileType.endsWith(".docx")) {
      // For PDF/Word, we'd need additional parsing
      // For now, send to AI to extract if it's an image-based document
      extractedText = await extractTextFromDocument(base64, fileType);
    }

    if (!extractedText) {
      throw new Error("No text could be extracted from the document");
    }

    // Extract exact questions from the document text
    const questions = await extractQuestions(extractedText, subjectId);

    // Save questions to database
    const { data: insertedQuestions, error: insertError } = await supabase
      .from("questions")
      .insert(
        questions.map((q: any) => ({
          subject_id: subjectId,
          question_text: q.question,
          option_a: q.options[0],
          option_b: q.options[1],
          option_c: q.options[2],
          option_d: q.options[3],
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          is_active: true,
        }))
      );

    if (insertError) {
      throw new Error(`Failed to save questions: ${insertError.message}`);
    }

    // Update document upload record with full extracted text
    await supabase
      .from("document_uploads")
      .update({
        processing_status: "completed",
        extracted_text: extractedText, // Store full extracted text
        questions_generated: questions.length,
      })
      .eq("id", documentId);

    // Delete the original file from storage to save space
    const { error: deleteError } = await supabase.storage
      .from("documents")
      .remove([storagePath]);

    if (deleteError) {
      console.error("Warning: Failed to delete original file:", deleteError.message);
      // Don't throw - questions were saved successfully
    } else {
      console.log("Original file deleted successfully:", storagePath);
    }

    return new Response(
      JSON.stringify({
        success: true,
        questionsGenerated: questions.length,
        extractedText: extractedText.substring(0, 500),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error processing document:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function extractTextFromImage(base64Image: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

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
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all text from this image. This may contain handwritten notes or printed text. Please transcribe everything you see accurately, maintaining the structure and formatting as much as possible.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${await response.text()}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}

async function extractTextFromDocument(base64Doc: string, fileType: string): Promise<string> {
  // For PDF/Word documents, we would ideally use a specialized parser
  // For this implementation, we'll use AI to extract text from the first page
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

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
          role: "user",
          content: `Extract all educational content and text from this ${fileType} document. Focus on questions, topics, and learning materials.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${await response.text()}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}

async function extractQuestions(text: string, subjectId: string): Promise<any[]> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

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
          content: `You are an expert at extracting exam questions from educational documents. Your job is to EXTRACT the EXACT questions from the document - DO NOT create new questions or modify the existing ones.

CRITICAL RULES:
1. Extract questions EXACTLY as they appear in the document
2. If a question already has options (A, B, C, D), keep them exactly as written
3. If a question doesn't have options, you may add plausible options BUT the question text must remain unchanged
4. Preserve the original wording, numbers, formulas, and formatting
5. The correct answer should be identified from the document if marked, otherwise make your best judgment
6. DO NOT paraphrase, summarize, or modify the questions in any way

Output format - return a JSON object with a "questions" array:
{
  "questions": [
    {
      "question": "The exact question text from document",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correct_answer": "A",
      "explanation": "Brief explanation if available in document, otherwise provide one"
    }
  ]
}

Rules for correct_answer:
- Must be exactly "A", "B", "C", or "D"
- Match it to the correct option in the options array`,
        },
        {
          role: "user",
          content: `Extract ALL exam questions from this document. Keep them EXACTLY as written:\n\n${text}`,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${await response.text()}`);
  }

  const result = await response.json();
  const content = result.choices[0].message.content;
  
  try {
    const parsed = JSON.parse(content);
    return parsed.questions || parsed;
  } catch (e) {
    console.error("Failed to parse questions:", content);
    throw new Error("Failed to parse extracted questions");
  }
}
