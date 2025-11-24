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

    // Generate questions from extracted text
    const questions = await generateQuestions(extractedText, subjectId);

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

    // Update document upload record
    await supabase
      .from("document_uploads")
      .update({
        processing_status: "completed",
        extracted_text: extractedText.substring(0, 5000), // Store first 5000 chars
        questions_generated: questions.length,
      })
      .eq("id", documentId);

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

async function generateQuestions(text: string, subjectId: string): Promise<any[]> {
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
          content: `You are an expert educational content creator for Nigerian JAMB/UTME exams. Generate multiple-choice questions based on the provided text.

Each question must follow this EXACT JSON format:
{
  "question": "The question text",
  "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
  "correct_answer": "A" (must be A, B, C, or D),
  "explanation": "Explanation of why this is correct"
}

Rules:
- Generate 5-10 questions from the text
- Each question must have exactly 4 options
- Options should be plausible and test understanding
- Questions should be clear and unambiguous
- Return ONLY a valid JSON array of questions
- Make questions appropriate for Nigerian secondary school/UTME level`,
        },
        {
          role: "user",
          content: `Generate multiple-choice questions from this text:\n\n${text}`,
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
    // Handle both {questions: [...]} and direct array formats
    return parsed.questions || parsed;
  } catch (e) {
    console.error("Failed to parse questions:", content);
    throw new Error("Failed to parse generated questions");
  }
}
