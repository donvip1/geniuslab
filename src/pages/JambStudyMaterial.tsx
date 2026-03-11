import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, BookOpen, Lightbulb, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import LekkiHeadmasterStudy from "@/components/LekkiHeadmasterStudy";

const JAMB_SUBJECTS = [
  "Use of English", "Mathematics", "Physics", "Chemistry", "Biology",
  "Agricultural Science", "Economics", "Commerce", "Accounting",
  "Government", "Literature in English", "Christian Religious Knowledge",
  "Islamic Religious Knowledge", "History", "Geography", "Civic Education",
  "Computer Studies", "Igbo Language", "Yoruba Language", "Hausa Language",
  "French", "Arabic", "Fine Arts", "Technical Drawing",
];

interface StudyNote {
  question: string;
  explanation: string;
  year: string | null;
}

const JambStudyMaterial = () => {
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedSubject) return;
    const fetchNotes = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("cached_api_questions")
        .select("question_text, explanation, year")
        .eq("subject", selectedSubject)
        .not("explanation", "is", null)
        .order("year", { ascending: false })
        .limit(100);

      setNotes(
        (data || []).map((d) => ({
          question: d.question_text,
          explanation: d.explanation || "",
          year: d.year,
        }))
      );
      setLoading(false);
    };
    fetchNotes();
  }, [selectedSubject]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-6 px-3 md:px-4 pb-24 lg:pb-6">
      <div className="max-w-4xl mx-auto">
        <Button variant="outline" onClick={() => selectedSubject ? setSelectedSubject(null) : navigate("/jamb-exam")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {selectedSubject ? "Back to Subjects" : "Back to JAMB"}
        </Button>

        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
            <BookOpen className="h-7 w-7 text-primary" />
            JAMB Study Material
          </h1>
          <p className="text-muted-foreground text-sm">
            {selectedSubject ? `Explanations & tips for ${selectedSubject}` : "Select a subject to study"}
          </p>
        </div>

        {!selectedSubject ? (
          <div className="space-y-6">
            {/* Lekki Headmaster - Featured #1 */}
            <LekkiHeadmasterStudy />

            {/* Other Subjects */}
            <div>
              <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Subject-Based Study Notes
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {JAMB_SUBJECTS.map((subject) => (
                  <Card
                    key={subject}
                    className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all border-2 hover:border-primary/50"
                    onClick={() => setSelectedSubject(subject)}
                  >
                    <CardContent className="p-4 text-center">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium">{subject}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : notes.length === 0 ? (
          <Card className="p-8 text-center">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No study material available for {selectedSubject} yet. Questions are still being synced.</p>
          </Card>
        ) : (
          <ScrollArea className="h-[70vh]">
            <div className="space-y-4 pr-4">
              {notes.map((note, idx) => (
                <Card key={idx} className="border-l-4 border-l-primary">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      {note.year ? `Year: ${note.year}` : "Past Question"} — Q{idx + 1}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm font-medium">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {note.question}
                      </ReactMarkdown>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-sm">
                      <p className="font-semibold text-primary mb-1">Explanation:</p>
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {note.explanation}
                      </ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default JambStudyMaterial;
