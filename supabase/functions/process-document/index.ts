import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import JSZip from "https://esm.sh/jszip@3.10.1";

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
    console.log("Processing document:", { documentId, storagePath, subjectId });

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

    console.log("File downloaded successfully, size:", fileData.size);

    // Convert file to arrayBuffer
    const arrayBuffer = await fileData.arrayBuffer();

    // Determine file type and extract text
    let extractedText = "";
    const fileType = storagePath.toLowerCase();

    if (fileType.endsWith(".jpg") || fileType.endsWith(".jpeg") || fileType.endsWith(".png")) {
      // Use Lovable AI with vision for OCR on handwritten images
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      extractedText = await extractTextFromImage(base64);
    } else if (fileType.endsWith(".docx")) {
      // Parse Word document (DOCX is a ZIP containing XML)
      extractedText = await extractTextFromDocx(arrayBuffer);
    } else if (fileType.endsWith(".doc")) {
      throw new Error("Old .doc format not supported. Please convert to .docx format.");
    } else if (fileType.endsWith(".pdf")) {
      // For PDF, we'd need a PDF parser - for now, suggest using images
      throw new Error("PDF parsing not yet supported. Please upload as images or .docx format.");
    }

    console.log("Extracted text length:", extractedText.length);
    console.log("Extracted text preview:", extractedText.substring(0, 500));

    if (!extractedText || extractedText.trim().length < 50) {
      throw new Error("No meaningful text could be extracted from the document. Please check the file content.");
    }

    // Extract exact questions from the document text
    const questions = await extractQuestions(extractedText, subjectId);
    console.log("Questions extracted:", questions.length);

    if (questions.length === 0) {
      throw new Error("No questions could be extracted from the document. Make sure your document contains exam questions.");
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
        }))
      );

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error(`Failed to save questions: ${insertError.message}`);
    }

    console.log("Questions saved to database successfully");

    // Update document upload record with full extracted text
    await supabase
      .from("document_uploads")
      .update({
        processing_status: "completed",
        extracted_text: extractedText.substring(0, 10000), // Store first 10000 chars
        questions_generated: questions.length,
      })
      .eq("id", documentId);

    // Delete the original file from storage to save space
    const { error: deleteError } = await supabase.storage
      .from("documents")
      .remove([storagePath]);

    if (deleteError) {
      console.error("Warning: Failed to delete original file:", deleteError.message);
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

  console.log("Extracting text from image using AI vision...");

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
              text: "Extract all text from this image. This may contain handwritten notes or printed exam questions. Please transcribe everything you see accurately, maintaining the structure, question numbers, options (A, B, C, D), and formatting as much as possible. Include all mathematical formulas, symbols, and expressions.",
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
    const errorText = await response.text();
    console.error("AI vision error:", errorText);
    throw new Error(`AI API error: ${errorText}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}

async function extractTextFromDocx(arrayBuffer: ArrayBuffer): Promise<string> {
  console.log("Parsing DOCX file...");
  
  try {
    // DOCX is a ZIP archive containing XML files
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    // The main document content is in word/document.xml
    const documentXml = await zip.file("word/document.xml")?.async("string");
    
    if (!documentXml) {
      throw new Error("Could not find document content in DOCX file");
    }

    // Extract text from XML - remove all XML tags and get plain text
    let text = documentXml
      // Replace paragraph endings with newlines
      .replace(/<\/w:p>/g, "\n")
      // Replace tabs
      .replace(/<w:tab\/>/g, "\t")
      // Remove all remaining XML tags
      .replace(/<[^>]+>/g, "")
      // Decode XML entities
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      // Clean up multiple newlines
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    console.log("DOCX text extracted, length:", text.length);
    return text;
  } catch (error: any) {
    console.error("DOCX parsing error:", error);
    throw new Error(`Failed to parse DOCX file: ${error.message}`);
  }
}

async function extractQuestions(text: string, subjectId: string): Promise<any[]> {
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
          content: `You are an expert at extracting exam questions from educational documents. Your job is to EXTRACT the EXACT questions from the document - DO NOT create new questions or modify the existing ones.

CRITICAL RULES:
1. Extract questions EXACTLY as they appear in the document
2. If a question already has options (A, B, C, D), keep them exactly as written
3. If a question doesn't have options, you may add plausible options BUT the question text must remain unchanged
4. Preserve the original wording, numbers, formulas, and formatting
5. The correct answer should be identified from the document if marked, otherwise make your best judgment based on mathematical/subject accuracy
6. DO NOT paraphrase, summarize, or modify the questions in any way
7. Extract ALL questions from the document, not just a few

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
          content: `Extract ALL exam questions from this document. Keep them EXACTLY as written. Do not skip any questions:\n\n${text}`,
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
