import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const VEEZEE_API_KEY = Deno.env.get("VEEZEE_API_KEY");
    
    if (!VEEZEE_API_KEY) {
      console.error("VEEZEE_API_KEY is not configured");
      throw new Error("VEEZEE_API_KEY is not configured");
    }

    // Parse subjects from request body
    let subjects: string[] = [];
    let questionsPerSubject = 10;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        subjects = body.subjects || [];
        questionsPerSubject = body.questionsPerSubject || 10;
      } catch {
        // ignore parse errors
      }
    }

    console.log("Requested subjects:", subjects);
    console.log("Questions per subject:", questionsPerSubject);

    const baseUrl = "https://studio--studio-6583429608-f6a92.us-central1.hosted.app/api/bank";
    const allQuestions: any[] = [];

    // Make separate API calls per subject to get tagged questions
    const subjectsToFetch = subjects.length > 0 ? subjects : ["English Language"];

    for (const subject of subjectsToFetch) {
      const apiUrl = `${baseUrl}?level=${encodeURIComponent("JAMB / UTME")}&subject=${encodeURIComponent(subject)}&count=${questionsPerSubject}`;
      
      console.log(`Fetching ${subject} from: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "X-API-KEY": VEEZEE_API_KEY,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      });

      console.log(`${subject} response status:`, response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error for ${subject}:`, response.status, errorText);
        continue; // Skip this subject but try others
      }

      const rawText = await response.text();
      const data = JSON.parse(rawText);
      
      let questionsArray = data?.questions || data?.data || data;
      
      if (Array.isArray(questionsArray)) {
        // Tag each question with its subject
        const taggedQuestions = questionsArray.map((q: any) => ({
          ...q,
          subject: q.subject || subject,
        }));
        console.log(`Got ${taggedQuestions.length} questions for ${subject}`);
        allQuestions.push(...taggedQuestions);
      } else {
        console.log(`No valid questions array for ${subject}`);
      }
    }

    console.log("Total questions fetched:", allQuestions.length);

    return new Response(JSON.stringify({ questions: allQuestions, status: "OK" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching JAMB questions:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to fetch questions" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
