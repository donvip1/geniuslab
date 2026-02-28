import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Send,
  Home,
  RotateCcw,
  BookOpen,
  ArrowLeft,
  Shield,
  Zap,
  Calculator,
  Trophy,
  Search,
  GraduationCap,
  Calendar,
  BarChart3
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import jambLogo from "@/assets/jamb-logo.webp";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import ScientificCalculator from "@/components/ScientificCalculator";
import { YearSelector } from "@/components/YearSelector";

// Clean HTML tags from question text, converting common ones to markdown
const cleanHtml = (text: string): string => {
  if (!text) return text;
  return text
    .replace(/<i>(.*?)<\/i>/gi, '*$1*')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<u>(.*?)<\/u>/gi, '$1')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p>(.*?)<\/p>/gi, '$1\n')
    .replace(/<sup>(.*?)<\/sup>/gi, '^$1')
    .replace(/<sub>(.*?)<\/sub>/gi, '_$1')
    .replace(/<[^>]+>/g, '');
};

interface JambQuestion {
  text: string;
  options: string[];
  correctAnswerIndex: number;
  year: string;
  explanation: string;
  subject?: string;
}

type ExamMode = "select" | "practice" | "mock";

const PRACTICE_QUESTIONS = 40;
const PRACTICE_ENGLISH_QUESTIONS = 60;
const MOCK_ENGLISH_QUESTIONS = 60;
const MOCK_OTHER_QUESTIONS = 40;
const MOCK_REQUIRED_SUBJECTS = 4;
const PRACTICE_DURATION = 60 * 60; // 60 minutes
const MOCK_DURATION = 2 * 60 * 60; // 2 hours (locked)

// Common JAMB UTME subjects
const JAMB_SUBJECTS = [
  { id: "english", name: "Use of English", category: "Compulsory", compulsory: true },
  { id: "mathematics", name: "Mathematics", category: "Science/Commercial" },
  { id: "physics", name: "Physics", category: "Science" },
  { id: "chemistry", name: "Chemistry", category: "Science" },
  { id: "biology", name: "Biology", category: "Science" },
  { id: "agricultural-science", name: "Agricultural Science", category: "Science" },
  { id: "economics", name: "Economics", category: "Commercial/Arts" },
  { id: "commerce", name: "Commerce", category: "Commercial" },
  { id: "accounting", name: "Accounting", category: "Commercial" },
  { id: "government", name: "Government", category: "Arts" },
  { id: "literature", name: "Literature in English", category: "Arts" },
  { id: "crk", name: "Christian Religious Knowledge", category: "Arts" },
  { id: "irk", name: "Islamic Religious Knowledge", category: "Arts" },
  { id: "history", name: "History", category: "Arts" },
  { id: "geography", name: "Geography", category: "Arts/Science" },
  { id: "civic-education", name: "Civic Education", category: "General" },
  { id: "computer-studies", name: "Computer Studies", category: "Science" },
  { id: "igbo", name: "Igbo Language", category: "Languages" },
  { id: "yoruba", name: "Yoruba Language", category: "Languages" },
  { id: "hausa", name: "Hausa Language", category: "Languages" },
  { id: "french", name: "French", category: "Languages" },
  { id: "arabic", name: "Arabic", category: "Languages" },
  { id: "fine-arts", name: "Fine Arts", category: "Arts" },
  { id: "technical-drawing", name: "Technical Drawing", category: "Science" },
];

const JAMB_EXAM_STORAGE_KEY = "jamb_exam_progress";

interface SavedExamState {
  examMode: ExamMode;
  selectedSubjects: string[];
  questions: JambQuestion[];
  answers: Record<number, number>;
  timeLeft: number;
  currentQuestionIndex: number;
  activeSubjectTab: string;
  savedAt: number;
  selectedYear?: string | null;
}

// === Results Dialog Component ===
const JambResultsDialog = ({ userId, examCategoryId }: { userId?: string; examCategoryId: string | null }) => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    const fetchResults = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("exam_attempts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      setResults(data || []);
      setLoading(false);
    };
    fetchResults();
  }, [open, userId]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  const formatDuration = (s: number | null) => {
    if (!s) return "—";
    const m = Math.floor(s / 60);
    return `${m}m ${s % 60}s`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all border-2 border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mx-auto mb-2 shadow">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <p className="text-sm font-semibold">My Results</p>
            <p className="text-xs text-muted-foreground mt-1">View past scores</p>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> My JAMB Results</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh]">
          {loading ? (
            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : results.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No results yet. Take an exam first!</p>
          ) : (
            <div className="space-y-3 pr-4">
              {results.map((r) => {
                const pct = Math.round((r.score / r.total_questions) * 100);
                const answersData = r.answers as any;
                const subjects = answersData?.subjects || "JAMB";
                return (
                  <Card key={r.id} className="border-l-4" style={{ borderLeftColor: pct >= 50 ? "hsl(var(--primary))" : "hsl(var(--destructive))" }}>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-sm">{subjects}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(r.created_at)} · {answersData?.mode || "exam"}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{r.score}/{r.total_questions}</p>
                          <p className="text-xs text-muted-foreground">{pct}% · {formatDuration(r.time_taken_seconds)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

// === Search Dialog Component ===
const JambSearchDialog = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    const { data } = await supabase
      .from("cached_api_questions")
      .select("*")
      .ilike("question_text", `%${query.trim()}%`)
      .limit(30);
    setResults(data || []);
    setLoading(false);
  };

  const getOptionLabel = (i: number) => String.fromCharCode(65 + i);

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setQuery(""); setResults([]); setSearched(false); } }}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all border-2 border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-950/30">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-2 shadow">
              <Search className="h-5 w-5 text-white" />
            </div>
            <p className="text-sm font-semibold">Search</p>
            <p className="text-xs text-muted-foreground mt-1">Find questions</p>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Search className="h-5 w-5 text-primary" /> Search JAMB Questions</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2">
          <Input
            placeholder="Search by keyword..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" /> : "Search"}
          </Button>
        </div>
        <ScrollArea className="h-[55vh]">
          {loading ? (
            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : !searched ? (
            <p className="text-center text-muted-foreground py-10">Enter a keyword and press Search</p>
          ) : results.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No questions found for "{query}"</p>
          ) : (
            <div className="space-y-4 pr-4">
              {results.map((q, idx) => (
                <Card key={q.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">{q.subject}</span>
                      {q.year && <span>· {q.year}</span>}
                    </div>
                    <div className="text-sm font-medium">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {cleanHtml(q.question_text)}
                      </ReactMarkdown>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {[q.option_a, q.option_b, q.option_c, q.option_d].map((opt, i) => (
                        <div key={i} className={`p-1.5 rounded ${i === q.correct_answer_index ? "bg-primary/10 font-semibold text-primary" : "bg-muted/50"}`}>
                          {getOptionLabel(i)}. {opt}
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <div className="bg-muted/50 rounded p-2 text-xs">
                        <span className="font-semibold text-primary">Explanation: </span>
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {cleanHtml(q.explanation)}
                        </ReactMarkdown>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

const clearSavedExamState = () => {
  try { localStorage.removeItem(JAMB_EXAM_STORAGE_KEY); } catch {}
};

const JambExam = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Auth & subscription state
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [examCategoryId, setExamCategoryId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [restoredSession, setRestoredSession] = useState(false);

  // Mode & subject selection
  const [examMode, setExamMode] = useState<ExamMode>("select");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [subjectsConfirmed, setSubjectsConfirmed] = useState(false);

  // Exam state
  const [questions, setQuestions] = useState<JambQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(MOCK_DURATION);
  const [examStarted, setExamStarted] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [showSideNav, setShowSideNav] = useState(true);
  const [activeSubjectTab, setActiveSubjectTab] = useState("english");

  const examDuration = examMode === "practice" ? PRACTICE_DURATION : MOCK_DURATION;

  // === Save exam progress to localStorage ===
  useEffect(() => {
    if (!examStarted || examFinished || questions.length === 0) return;
    try {
      const state: SavedExamState = {
        examMode,
        selectedSubjects,
        questions,
        answers,
        timeLeft,
        currentQuestionIndex,
        activeSubjectTab,
        savedAt: Date.now(),
        selectedYear,
      };
      localStorage.setItem(JAMB_EXAM_STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [answers, timeLeft, currentQuestionIndex, activeSubjectTab, examStarted, examFinished]);

  // === Restore exam progress on mount ===
  useEffect(() => {
    try {
      const saved = localStorage.getItem(JAMB_EXAM_STORAGE_KEY);
      if (!saved) return;
      const state: SavedExamState = JSON.parse(saved);
      // Only restore if saved less than 3 hours ago and has time left
      const threeHoursMs = 3 * 60 * 60 * 1000;
      if (Date.now() - state.savedAt > threeHoursMs || state.timeLeft <= 0) {
        clearSavedExamState();
        return;
      }
      if (state.questions.length > 0) {
        setExamMode(state.examMode);
        setSelectedSubjects(state.selectedSubjects);
        setSelectedYear(state.selectedYear || null);
        setQuestions(state.questions);
        setAnswers(state.answers);
        setTimeLeft(state.timeLeft);
        setCurrentQuestionIndex(state.currentQuestionIndex);
        setActiveSubjectTab(state.activeSubjectTab);
        setSubjectsConfirmed(true);
        setExamStarted(true);
        setRestoredSession(true);
        toast({
          title: "Exam Resumed",
          description: "Your previous exam progress has been restored.",
        });
      }
    } catch {
      clearSavedExamState();
    }
  }, []);

  // Auth + category init
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUser(session.user);

      // Check admin role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin");
      if (roles && roles.length > 0) setIsAdmin(true);

      const { data: cat } = await supabase
        .from("exam_categories")
        .select("id")
        .eq("slug", "jamb-utme")
        .maybeSingle();
      if (cat) setExamCategoryId(cat.id);
      setAuthLoading(false);
    };
    init();
  }, []);

  // Group questions by subject for tabs
  const questionsBySubject = useMemo(() => {
    const grouped: Record<string, { questions: JambQuestion[]; globalIndices: number[] }> = {};
    selectedSubjects.forEach(subId => {
      grouped[subId] = { questions: [], globalIndices: [] };
    });
    questions.forEach((q, globalIdx) => {
      const subjectName = (q.subject || "").toLowerCase();
      const matchedSubject = selectedSubjects.find(subId => {
        const subName = JAMB_SUBJECTS.find(s => s.id === subId)?.name.toLowerCase() || "";
        return subjectName.includes(subName) || subName.includes(subjectName);
      });
      const key = matchedSubject || selectedSubjects[0];
      if (grouped[key]) {
        grouped[key].questions.push(q);
        grouped[key].globalIndices.push(globalIdx);
      }
    });
    return grouped;
  }, [questions, selectedSubjects]);

  // Get subject display label for tab
  const getSubjectTabLabel = (subId: string) => {
    const subject = JAMB_SUBJECTS.find(s => s.id === subId);
    return subject?.name || subId;
  };

  const fetchQuestions = async (subjects: string[]) => {
    setLoading(true);
    try {
      // For mock mode, fetch each subject with its specific count
      // English = 60, others = 40
      const allQuestions: JambQuestion[] = [];

      if (examMode === "mock") {
        for (const subId of subjects) {
          const subName = JAMB_SUBJECTS.find(s => s.id === subId)?.name || subId;
          const count = subId === "english" ? MOCK_ENGLISH_QUESTIONS : MOCK_OTHER_QUESTIONS;

          const { data, error } = await supabase.functions.invoke("jamb-questions", {
            body: { subjects: [subName], questionsPerSubject: count, year: selectedYear },
          });

          if (error) {
            console.error(`Error fetching ${subName}:`, error);
            continue;
          }

          const arr = data?.questions || data;
          if (Array.isArray(arr)) {
            allQuestions.push(...arr);
          }
        }
      } else {
        // Practice mode: single subject, 60 for English, 40 for others
        const subId = subjects[0];
        const subjectNames = subjects.map(id => JAMB_SUBJECTS.find(s => s.id === id)?.name || id);
        const count = subId === "english" ? PRACTICE_ENGLISH_QUESTIONS : PRACTICE_QUESTIONS;
        const { data, error } = await supabase.functions.invoke("jamb-questions", {
          body: { subjects: subjectNames, questionsPerSubject: count, year: selectedYear },
        });
        if (error) throw error;
        const arr = data?.questions || data;
        if (Array.isArray(arr)) allQuestions.push(...arr);
      }

      if (allQuestions.length === 0) {
        throw new Error("No questions available from the question bank for the selected subjects");
      }

      setQuestions(allQuestions);
      setExamStarted(true);
      setTimeLeft(examDuration);
    } catch (error: any) {
      console.error("Error fetching questions:", error);
      toast({
        title: "Error Loading Questions",
        description: error.message || "Failed to load JAMB questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectToggle = (subjectId: string) => {
    // Only block English deselection in mock mode (it's compulsory there)
    if (subjectId === "english" && examMode === "mock") return;
    
    if (examMode === "practice") {
      // Practice mode: single subject only
      setSelectedSubjects([subjectId]);
      return;
    }
    
    setSelectedSubjects(prev => {
      if (prev.includes(subjectId)) {
        return prev.filter(id => id !== subjectId);
      }
      if (prev.length >= MOCK_REQUIRED_SUBJECTS) {
        toast({
          title: "Maximum subjects reached",
          description: "You can only select 4 subjects. Deselect one to choose another.",
          variant: "destructive",
        });
        return prev;
      }
      return [...prev, subjectId];
    });
  };

  const handleStartExam = () => {
    if (examMode === "practice") {
      if (selectedSubjects.length !== 1) {
        toast({ title: "Select a subject", description: "Please select one subject for practice.", variant: "destructive" });
        return;
      }
    } else {
      if (selectedSubjects.length !== MOCK_REQUIRED_SUBJECTS) {
        toast({
          title: "Select 4 subjects",
          description: `You've selected ${selectedSubjects.length} subject(s). Please select exactly 4.`,
          variant: "destructive",
        });
        return;
      }
    }
    setSubjectsConfirmed(true);
    setActiveSubjectTab(selectedSubjects[0]);
    fetchQuestions(selectedSubjects);
  };

  // Timer countdown
  useEffect(() => {
    if (!examStarted || examFinished || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleFinalize();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, examFinished, timeLeft]);

  const handleAnswerChange = (questionIndex: number, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const handleFinalize = useCallback(async () => {
    clearSavedExamState();
    let correctCount = 0;
    questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswerIndex) {
        correctCount++;
      }
    });
    setScore(correctCount);
    setExamFinished(true);

    // Persist results to exam_attempts
    if (user) {
      try {
        const subjectLabel = selectedSubjects.map(id => JAMB_SUBJECTS.find(s => s.id === id)?.name || id).join(", ");
        const timeTaken = examDuration - timeLeft;
        const { error: saveError } = await supabase.from("exam_attempts").insert({
          user_id: user.id,
          subject_id: examCategoryId || "00000000-0000-0000-0000-000000000000",
          score: correctCount,
          total_questions: questions.length,
          time_taken_seconds: timeTaken,
          answers: { mode: examMode, subjects: subjectLabel, detail: answers },
        });
        if (saveError) {
          console.error("Failed to save exam result:", saveError);
          toast({ title: "Warning", description: "Exam completed but result could not be saved. Please screenshot your score.", variant: "destructive" });
        }
      } catch (e) {
        console.error("Failed to save exam result:", e);
        toast({ title: "Warning", description: "Exam completed but result could not be saved.", variant: "destructive" });
      }
    }
  }, [questions, answers, user, selectedSubjects, examMode, examDuration, timeLeft, examCategoryId]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getAnsweredCount = () => Object.keys(answers).length;

  const getOptionLabel = (index: number) => String.fromCharCode(65 + index);

  const restartExam = () => {
    clearSavedExamState();
    setAnswers({});
    setCurrentQuestionIndex(0);
    setTimeLeft(examDuration);
    setExamFinished(false);
    setSubjectsConfirmed(false);
    setExamStarted(false);
    setQuestions([]);
    setRestoredSession(false);
    setSelectedYear(null);
  };

  // ===== AUTH LOADING =====
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  // ===== EXAM MODE SELECTION SCREEN =====
  if (examMode === "select") {
    if (!user || !examCategoryId) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      );
    }

    const modeSelectionContent = (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-6 px-3 md:px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <img src={jambLogo} alt="JAMB Logo" className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 rounded-full shadow-lg object-cover" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              JAMB UTME CBT
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Choose your exam mode to get started
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Practice and Mock cards stay in top row */}
            {/* Standard Mode */}
            <Card 
              className="relative overflow-hidden cursor-pointer group hover:shadow-xl hover:-translate-y-2 transition-all border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30"
              onClick={() => { setSelectedSubjects([]); setExamMode("practice"); }}
            >
              <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                Practice
              </div>
              <CardHeader className="pb-3">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  <Zap className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">JAMB Practice</CardTitle>
                <CardDescription className="text-xs">Single Subject Practice</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    60-minute duration
                  </li>
                  <li className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                    Single subject selection
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    40 questions (English: 60)
                  </li>
                </ul>
                <div className="flex items-center text-primary font-medium text-sm group-hover:gap-2 transition-all">
                  Start Practice
                  <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>

            {/* Mock UTME Mode */}
            <Card 
              className="relative overflow-hidden cursor-pointer group hover:shadow-xl hover:-translate-y-2 transition-all border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30"
              onClick={() => { setSelectedSubjects(["english"]); setExamMode("mock"); }}
            >
              <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
                Full Simulation
              </div>
              <CardHeader className="pb-3">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl">JAMB Mock UTME</CardTitle>
                <CardDescription className="text-xs">Real Exam Simulation</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    120 minutes (locked)
                  </li>
                  <li className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-amber-500" />
                    Compulsory 4-subject combo
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-amber-500" />
                    Neural Proctoring enabled
                  </li>
                </ul>
                <div className="flex items-center text-amber-600 dark:text-amber-400 font-medium text-sm group-hover:gap-2 transition-all">
                  Start Mock Exam
                  <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Study Material, Results, Search row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* Study Material */}
            <Card
              className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30"
              onClick={() => navigate("/jamb-study")}
            >
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-2 shadow">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <p className="text-sm font-semibold">Study Material</p>
                <p className="text-xs text-muted-foreground mt-1">Learn from explanations</p>
              </CardContent>
            </Card>

            {/* My Results */}
            <JambResultsDialog userId={user?.id} examCategoryId={examCategoryId} />

            {/* Search Questions */}
            <JambSearchDialog />
          </div>

          <Button variant="outline" onClick={() => navigate("/exam")} className="w-full md:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Exam Categories
          </Button>
        </div>
      </div>
    );

    if (isAdmin) return modeSelectionContent;

    return (
      <SubscriptionGate
        examCategoryId={examCategoryId}
        examCategoryName="JAMB UTME"
        userId={user.id}
        userEmail={user.email || ""}
      >
        {modeSelectionContent}
      </SubscriptionGate>
    );
  }

  // ===== SUBJECT SELECTION SCREEN =====
  if (!subjectsConfirmed) {
    const categories = [...new Set(JAMB_SUBJECTS.map(s => s.category))];
    const isMock = examMode === "mock";
    const isPractice = examMode === "practice";
    const requiredCount = isMock ? MOCK_REQUIRED_SUBJECTS : 1;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-6 px-3 md:px-4 pb-24 md:pb-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 md:mb-8">
            <img src={jambLogo} alt="JAMB Logo" className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 rounded-full shadow-lg object-cover" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
              {isMock ? "JAMB Mock UTME" : "JAMB Practice"}
            </h1>
            {isMock && (
              <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-3 py-1 rounded-full text-xs font-semibold mb-2">
                <Shield className="h-3 w-3" />
                Full Simulation · Neural Proctoring Active
              </span>
            )}
            <p className="text-muted-foreground text-sm md:text-base mt-2">
              {isPractice ? "Select one subject to practice" : "Select your 4 subject combination to begin"}
            </p>
          </div>

          {/* Year Selector */}
          <div className="flex justify-center mb-4">
            <YearSelector value={selectedYear} onChange={setSelectedYear} />
          </div>

          {/* Selected subjects count */}
          <div className="flex items-center justify-between mb-4 bg-card rounded-lg p-3 shadow-sm border">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="font-medium text-sm md:text-base">
                {selectedSubjects.length} of {requiredCount} subject{requiredCount > 1 ? "s" : ""} selected
              </span>
            </div>
            <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
              selectedSubjects.length === requiredCount
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
            }`}>
              {selectedSubjects.length === requiredCount ? "Ready!" : `${requiredCount - selectedSubjects.length} more needed`}
            </div>
          </div>

          {/* Selected subjects pills */}
          {selectedSubjects.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedSubjects.map(id => {
                const subject = JAMB_SUBJECTS.find(s => s.id === id);
                return (
                  <span key={id} className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs md:text-sm font-medium">
                    <CheckCircle className="h-3 w-3" />
                    {subject?.name}
                    {subject?.compulsory && !isPractice && <span className="text-[10px] opacity-70">(Compulsory)</span>}
                  </span>
                );
              })}
            </div>
          )}

          {/* Subject Grid */}
          <Card className="shadow-lg mb-6">
            <CardContent className="p-3 md:p-6">
              <div className="space-y-6">
                {categories.map(category => {
                  const categorySubjects = JAMB_SUBJECTS.filter(s => s.category === category);
                  return (
                    <div key={category}>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 md:mb-3">
                        {category}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {categorySubjects.map(subject => {
                          const isSelected = selectedSubjects.includes(subject.id);
                          const isCompulsory = isMock && subject.compulsory;
                          const isDisabled = isMock && !isSelected && selectedSubjects.length >= MOCK_REQUIRED_SUBJECTS;
                          
                          return (
                            <div
                              key={subject.id}
                              onClick={() => {
                                if (isPractice) {
                                  handleSubjectToggle(subject.id);
                                } else if (!isCompulsory && !isDisabled) {
                                  handleSubjectToggle(subject.id);
                                }
                              }}
                              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                isCompulsory
                                  ? "border-primary bg-primary/5 cursor-default"
                                  : isSelected
                                  ? "border-primary bg-primary/5 cursor-pointer hover:bg-primary/10"
                                  : isDisabled
                                  ? "border-border opacity-50 cursor-not-allowed"
                                  : "border-border cursor-pointer hover:border-primary/50 hover:bg-accent"
                              }`}
                            >
                              <Checkbox
                                checked={isSelected}
                                disabled={isCompulsory || isDisabled}
                                className="flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <span className="text-sm font-medium block truncate">{subject.name}</span>
                                {isCompulsory && (
                                  <span className="text-[10px] text-muted-foreground">Compulsory</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Exam Info & Start Button */}
          <Card className="shadow-lg">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground text-center md:text-left">
                  <p className="flex items-center gap-1 justify-center md:justify-start">
                    <Clock className="h-4 w-4" /> Duration: <strong>{isMock ? "120 Minutes (Locked)" : "60 Minutes"}</strong>
                  </p>
                  <p className="flex items-center gap-1 justify-center md:justify-start mt-1">
                    <BookOpen className="h-4 w-4" /> Questions: <strong>{isPractice ? `${PRACTICE_QUESTIONS} (English: ${PRACTICE_ENGLISH_QUESTIONS})` : `${MOCK_ENGLISH_QUESTIONS + MOCK_OTHER_QUESTIONS * 3} (English: ${MOCK_ENGLISH_QUESTIONS}, Others: ${MOCK_OTHER_QUESTIONS} each)`}</strong>
                  </p>
                  {selectedYear && (
                    <p className="flex items-center gap-1 justify-center md:justify-start mt-1 text-primary">
                      <Calendar className="h-4 w-4" /> Year: <strong>{selectedYear}</strong>
                    </p>
                  )}
                  {isMock && (
                    <p className="flex items-center gap-1 justify-center md:justify-start mt-1 text-amber-600 dark:text-amber-400">
                      <Shield className="h-4 w-4" /> Neural Proctoring: <strong>Enabled</strong>
                    </p>
                  )}
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <Button variant="outline" onClick={() => setExamMode("select")} className="flex-1 md:flex-none">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleStartExam}
                    disabled={selectedSubjects.length !== requiredCount}
                    className={`flex-1 md:flex-none ${isMock ? "bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700" : ""}`}
                    size="lg"
                  >
                    {isMock ? "Start Mock Exam" : "Start Practice"}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ===== LOADING SCREEN =====
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-foreground">Loading JAMB Questions...</h2>
          <p className="text-muted-foreground mt-2">Preparing questions for your selected subjects</p>
        </div>
      </div>
    );
  }

  // ===== NO QUESTIONS SCREEN =====
  if (subjectsConfirmed && questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Questions Available</h2>
            <p className="text-muted-foreground mb-4">
              No questions found for the selected subjects. Try different subjects or check back later.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={restartExam}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Change Subjects
              </Button>
              <Button onClick={() => fetchQuestions(selectedSubjects)}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===== RESULTS SCREEN =====
  if (examFinished) {
    const wrongAnswers = questions.filter((q, i) => answers[i] !== q.correctAnswerIndex);
    const percentage = Math.round((score / questions.length) * 100);
    const isMock = examMode === "mock";

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4 pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Score Summary */}
          <Card className="mb-8 overflow-hidden">
            <div className={`p-8 text-center text-white ${percentage >= 50 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'}`}>
              <h1 className="text-3xl font-bold mb-2">
                {isMock ? "JAMB Mock UTME Results" : "JAMB CBT Results"}
              </h1>
              <div className="text-7xl font-bold my-6">{score}/{questions.length}</div>
              <p className="text-2xl">{percentage}%</p>
              <Progress value={percentage} className="mt-4 h-3 bg-white/30" />
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-green-600">{score}</div>
                  <div className="text-sm text-muted-foreground">Correct</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-red-600">{questions.length - score}</div>
                  <div className="text-sm text-muted-foreground">Wrong</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600">{formatTime(examDuration - timeLeft)}</div>
                  <div className="text-sm text-muted-foreground">Time Used</div>
                </div>
              </div>

              {/* Per-subject breakdown */}
              <div className="mt-6 pt-4 border-t">
                <h3 className="font-semibold mb-3 text-sm">Subject Breakdown</h3>
                <div className="grid grid-cols-2 gap-3">
                  {selectedSubjects.map(subId => {
                    const subData = questionsBySubject[subId];
                    if (!subData) return null;
                    const subCorrect = subData.globalIndices.filter(gi => answers[gi] === questions[gi]?.correctAnswerIndex).length;
                    const subTotal = subData.globalIndices.length;
                    const subName = JAMB_SUBJECTS.find(s => s.id === subId)?.name || subId;
                    return (
                      <div key={subId} className="bg-muted/50 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground truncate">{subName}</div>
                        <div className="text-lg font-bold">{subCorrect}/{subTotal}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-4 mt-6 justify-center flex-wrap">
                <Button variant="outline" onClick={() => navigate("/")}>
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Button>
                <Button variant="outline" onClick={() => navigate("/profile")}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View My Profile
                </Button>
                <Button onClick={restartExam}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Retake Exam
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Wrong Answers Review */}
          {wrongAnswers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  Review Wrong Answers ({wrongAnswers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-6">
                    {wrongAnswers.map((q, idx) => {
                      const originalIndex = questions.findIndex(oq => oq === q);
                      const userAnswer = answers[originalIndex];
                      
                      return (
                        <div key={idx} className="border rounded-lg p-4 bg-card">
                          <div className="flex items-start gap-3 mb-3">
                            <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded text-sm font-medium">
                              Q{originalIndex + 1}
                            </span>
                            {q.subject && (
                              <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded text-xs">
                                {q.subject}
                              </span>
                            )}
                            {q.year && (
                              <span className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 px-2 py-1 rounded text-xs">
                                {q.year}
                              </span>
                            )}
                          </div>
                          
                          <div className="prose dark:prose-invert max-w-none mb-4">
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {cleanHtml(q.text)}
                            </ReactMarkdown>
                          </div>

                          <div className="space-y-2 mb-4">
                            {q.options.map((opt, optIdx) => (
                              <div
                                key={optIdx}
                                className={`p-2 rounded border ${
                                  optIdx === q.correctAnswerIndex
                                    ? "bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700"
                                    : optIdx === userAnswer
                                    ? "bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700"
                                    : "bg-muted/30"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{getOptionLabel(optIdx)}.</span>
                                  <div className="prose dark:prose-invert prose-sm max-w-none flex-1">
                                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                      {cleanHtml(opt)}
                                    </ReactMarkdown>
                                  </div>
                                  {optIdx === q.correctAnswerIndex && (
                                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                  )}
                                  {optIdx === userAnswer && optIdx !== q.correctAnswerIndex && (
                                    <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {q.explanation && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                              <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-1">Explanation:</h4>
                              <div className="prose dark:prose-invert prose-sm max-w-none text-blue-900 dark:text-blue-100">
                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                  {cleanHtml(q.explanation)}
                                </ReactMarkdown>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // ===== EXAM TAKING SCREEN WITH SUBJECT TABS =====
  const currentQuestion = questions[currentQuestionIndex];
  const isMock = examMode === "mock";

  // Get the active subject's question indices for the tab navigator
  const activeSubjectData = questionsBySubject[activeSubjectTab];
  const activeSubjectIndices = activeSubjectData?.globalIndices || [];

  // Compute answered count per subject for tab badges
  const getSubjectAnsweredCount = (subId: string) => {
    const data = questionsBySubject[subId];
    if (!data) return 0;
    return data.globalIndices.filter(gi => answers[gi] !== undefined).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col pb-20 md:pb-0">
      {/* Header */}
      <div className={`${isMock ? "bg-gradient-to-r from-amber-600 to-red-700" : "bg-gradient-to-r from-blue-600 to-indigo-700"} text-white py-2 px-3 md:py-4 md:px-4 sticky top-0 z-20 shadow-lg`}>
        <div className="container mx-auto">
          {/* Top row: Title + actions */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <h1 className="text-sm md:text-2xl font-bold">
              {isMock ? "JAMB Mock UTME" : "JAMB CBT Practice"}
            </h1>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="secondary" size="sm" className="bg-white text-blue-700 hover:bg-blue-50 text-xs px-3 h-7 md:h-9 flex-shrink-0">
                  <Send className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                  End
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[90vw] md:max-w-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle>Finalize Exam?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You have answered {getAnsweredCount()} out of {questions.length} questions.
                    {getAnsweredCount() < questions.length && (
                      <span className="block mt-2 text-yellow-600 font-medium">
                        ⚠️ Warning: You have {questions.length - getAnsweredCount()} unanswered questions!
                      </span>
                    )}
                    <span className="block mt-2">Are you sure you want to submit?</span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                  <AlertDialogCancel className="w-full sm:w-auto">Continue Exam</AlertDialogCancel>
                  <AlertDialogAction onClick={handleFinalize} className="w-full sm:w-auto">Submit Exam</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          {/* Bottom row: Stats */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs md:text-sm opacity-90">
              Q{currentQuestionIndex + 1} of {questions.length}
            </span>
            {isMock && <span className="text-[10px] opacity-75">🔒 Proctored</span>}
            <button
              onClick={() => setShowCalculator(prev => !prev)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] md:text-xs transition-colors ${showCalculator ? "bg-white/40" : "bg-white/20 hover:bg-white/30"}`}
              title="Calculator"
            >
              <Calculator className="h-3 w-3" />
            </button>
            <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full">
              <CheckCircle className="h-3 w-3" />
              <span className="font-medium text-[10px] md:text-xs">{getAnsweredCount()}/{questions.length}</span>
            </div>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${timeLeft < 600 ? "bg-red-500 animate-pulse" : "bg-white/20"}`}>
              <Clock className="h-3 w-3" />
              <span className="font-bold text-[10px] md:text-xs">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Tabs - Wrapping grid on mobile */}
      <div className="bg-card border-b shadow-sm sticky top-[60px] md:top-[64px] z-10">
        <div className="container mx-auto px-2 md:px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 py-2">
            {selectedSubjects.map((subId) => {
              const subName = JAMB_SUBJECTS.find(s => s.id === subId)?.name || subId;
              const isActive = activeSubjectTab === subId;
              const answeredInSub = getSubjectAnsweredCount(subId);
              const totalInSub = questionsBySubject[subId]?.globalIndices.length || 0;

              return (
                <button
                  key={subId}
                  onClick={() => {
                    setActiveSubjectTab(subId);
                    const firstIdx = questionsBySubject[subId]?.globalIndices[0];
                    if (firstIdx !== undefined) setCurrentQuestionIndex(firstIdx);
                  }}
                  className={`px-2 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all text-center truncate ${
                    isActive
                      ? isMock
                        ? "bg-amber-600 text-white shadow-md"
                        : "bg-blue-600 text-white shadow-md"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span className="block truncate">{subName}</span>
                  <span className={`text-[10px] block ${isActive ? "text-white/80" : "text-muted-foreground"}`}>
                    {answeredInSub}/{totalInSub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row md:overflow-hidden overflow-x-hidden min-h-0">
        {/* Side Navigation - Desktop */}
        <div className={`hidden md:block ${showSideNav ? "w-64" : "w-0"} transition-all duration-300 bg-card border-r shadow-lg overflow-hidden flex-shrink-0`}>
          <div className="p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">
                {JAMB_SUBJECTS.find(s => s.id === activeSubjectTab)?.name || "Questions"}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowSideNav(false)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="grid grid-cols-5 gap-2">
                {activeSubjectIndices.map((globalIdx) => {
                  const isAnswered = answers[globalIdx] !== undefined;
                  const isCurrent = globalIdx === currentQuestionIndex;
                  const localNum = activeSubjectIndices.indexOf(globalIdx) + 1;
                  
                  return (
                    <button
                      key={globalIdx}
                      onClick={() => setCurrentQuestionIndex(globalIdx)}
                      className={`w-full aspect-square rounded-lg font-semibold text-sm transition-all ${
                        isCurrent
                          ? isMock ? "bg-amber-600 text-white ring-2 ring-amber-400 ring-offset-2" : "bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2"
                          : isAnswered
                          ? "bg-green-500 text-white hover:bg-green-600"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {localNum}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Toggle Side Nav */}
        {!showSideNav && (
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-card shadow-md rounded-l-none"
            onClick={() => setShowSideNav(true)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {/* Question Content */}
        <div className="flex-1 p-2 sm:p-3 md:p-8 overflow-y-auto overflow-x-hidden min-h-0">
          <div className="max-w-3xl mx-auto w-full min-w-0 pb-4">
            <Card className="shadow-xl overflow-hidden">
              <CardHeader className="border-b bg-gradient-to-r from-muted/30 to-muted/50 p-3 md:p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base md:text-lg flex items-center gap-2">
                    <span className={`${isMock ? "bg-amber-600" : "bg-blue-600"} text-white px-2 md:px-3 py-1 rounded-full text-xs md:text-sm`}>
                      Q{currentQuestionIndex + 1}
                    </span>
                    {currentQuestion.subject && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {currentQuestion.subject}
                      </span>
                    )}
                  </CardTitle>
                  {currentQuestion.year && (
                    <span className="text-xs md:text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                      {currentQuestion.year}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-3 md:p-6 pt-4 md:pt-6 min-w-0 overflow-x-hidden">
                {/* Question Text */}
                <div className="prose dark:prose-invert max-w-none mb-4 md:mb-6 text-sm md:text-lg break-words [word-break:break-word] [overflow-wrap:anywhere] min-w-0">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {cleanHtml(currentQuestion.text)}
                  </ReactMarkdown>
                </div>

                {/* Options */}
                <RadioGroup
                  value={answers[currentQuestionIndex]?.toString() || ""}
                  onValueChange={(value) => handleAnswerChange(currentQuestionIndex, parseInt(value))}
                >
                  <div className="space-y-2 md:space-y-3">
                    {currentQuestion.options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        className={`flex items-start space-x-2 md:space-x-3 p-3 md:p-4 rounded-lg md:rounded-xl border-2 transition-all cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 ${
                          answers[currentQuestionIndex] === optIndex
                            ? isMock ? "border-amber-500 bg-amber-50 dark:bg-amber-900/30" : "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                            : "border-border"
                        }`}
                        onClick={() => handleAnswerChange(currentQuestionIndex, optIndex)}
                      >
                        <RadioGroupItem
                          value={optIndex.toString()}
                          id={`option-${optIndex}`}
                          className="mt-0.5 md:mt-1 flex-shrink-0"
                        />
                        <Label
                          htmlFor={`option-${optIndex}`}
                          className="flex-1 cursor-pointer min-w-0 [word-break:break-word] [overflow-wrap:anywhere]"
                        >
                          <span className="font-bold text-blue-600 dark:text-blue-400 mr-1 md:mr-2 text-sm md:text-base">
                            {getOptionLabel(optIndex)}.
                          </span>
                          <span className="prose dark:prose-invert prose-sm md:prose-base inline break-words min-w-0 [word-break:break-word] [overflow-wrap:anywhere]">
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {cleanHtml(option)}
                            </ReactMarkdown>
                          </span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>

                {/* Mobile Question Navigator (per subject) */}
                <div className="md:hidden mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground font-medium">
                      {JAMB_SUBJECTS.find(s => s.id === activeSubjectTab)?.name} questions:
                    </span>
                  </div>
                  <div className="grid grid-cols-8 gap-1.5">
                    {activeSubjectIndices.map((globalIdx) => {
                      const isAnswered = answers[globalIdx] !== undefined;
                      const isCurrent = globalIdx === currentQuestionIndex;
                      const localNum = activeSubjectIndices.indexOf(globalIdx) + 1;
                      
                      return (
                        <button
                          key={globalIdx}
                          onClick={() => setCurrentQuestionIndex(globalIdx)}
                          className={`w-full aspect-square rounded-md font-semibold text-xs transition-all ${
                            isCurrent
                              ? isMock ? "bg-amber-600 text-white ring-2 ring-amber-400" : "bg-blue-600 text-white ring-2 ring-blue-400"
                              : isAnswered
                              ? "bg-green-500 text-white"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {localNum}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center mt-4 md:mt-8 pt-4 md:pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="text-xs md:text-sm px-3 md:px-4"
                  >
                    <ChevronLeft className="mr-1 md:mr-2 h-4 w-4" />
                    Prev
                  </Button>

                  <span className="text-xs text-muted-foreground hidden md:block">
                    Click on question numbers to navigate
                  </span>

                  <Button
                    onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    disabled={currentQuestionIndex === questions.length - 1}
                    className="text-xs md:text-sm px-3 md:px-4"
                  >
                    Next
                    <ChevronRight className="ml-1 md:ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {showCalculator && <ScientificCalculator onClose={() => setShowCalculator(false)} />}
    </div>
  );
};

export default JambExam;
