import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Clock, ChevronLeft, ChevronRight, CheckCircle, XCircle,
  AlertTriangle, Send, Home, RotateCcw, BookOpen, ArrowLeft, Loader2
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { SubscriptionGate } from "@/components/SubscriptionGate";

interface ApiQuestion {
  text: string;
  options: string[];
  correctAnswerIndex: number;
  year: string;
  explanation: string;
  subject?: string;
}

const EXAM_DURATION = 45 * 60; // 45 minutes
const QUESTIONS_PER_SUBJECT = 20;

// Level mappings for the Veezee API
const LEVEL_MAP: Record<string, string> = {
  "waec": "WAEC / SSCE",
  "neco": "NECO / SSCE",
  "nabteb": "NABTEB / SSCE",
};

const CATEGORY_NAMES: Record<string, string> = {
  "waec": "WAEC",
  "neco": "NECO",
  "nabteb": "NABTEB",
};

// Subjects available for these exams
const EXAM_SUBJECTS = [
  { id: "english", name: "English Language", category: "Compulsory" },
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
];

const ApiExam = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const examType = searchParams.get("type") || "waec";

  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [examCategoryId, setExamCategoryId] = useState<string | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectsConfirmed, setSubjectsConfirmed] = useState(false);
  const [questions, setQuestions] = useState<ApiQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [examStarted, setExamStarted] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const [score, setScore] = useState(0);

  const categoryName = CATEGORY_NAMES[examType] || "Exam";
  const apiLevel = LEVEL_MAP[examType] || "WAEC / SSCE";

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUser(session.user);

      const { data: cat } = await supabase
        .from("exam_categories")
        .select("id")
        .eq("slug", examType)
        .maybeSingle();
      if (cat) setExamCategoryId(cat.id);
      setAuthLoading(false);
    };
    init();
  }, [examType]);

  const fetchQuestions = async (subjects: string[]) => {
    setLoading(true);
    try {
      const subjectNames = subjects.map(id =>
        EXAM_SUBJECTS.find(s => s.id === id)?.name || id
      );

      const { data, error } = await supabase.functions.invoke("jamb-questions", {
        body: { subjects: subjectNames, questionsPerSubject: QUESTIONS_PER_SUBJECT, level: apiLevel },
      });

      if (error) throw error;

      const questionsArray = data?.questions || data;
      if (!questionsArray || !Array.isArray(questionsArray) || questionsArray.length === 0) {
        throw new Error("No questions available for the selected subjects");
      }

      setQuestions(questionsArray);
      setExamStarted(true);
      setTimeLeft(EXAM_DURATION);
    } catch (error: any) {
      toast({
        title: "Error Loading Questions",
        description: error.message || "Failed to load questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects(prev => {
      if (prev.includes(subjectId)) return prev.filter(id => id !== subjectId);
      if (prev.length >= 4) {
        toast({ title: "Maximum 4 subjects", description: "Deselect one to choose another.", variant: "destructive" });
        return prev;
      }
      return [...prev, subjectId];
    });
  };

  const handleStartExam = () => {
    if (selectedSubjects.length === 0) {
      toast({ title: "Select at least one subject", variant: "destructive" });
      return;
    }
    setSubjectsConfirmed(true);
    fetchQuestions(selectedSubjects);
  };

  useEffect(() => {
    if (!examStarted || examFinished || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { handleFinalize(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [examStarted, examFinished, timeLeft]);

  const handleAnswerChange = (questionIndex: number, optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const handleFinalize = useCallback(() => {
    let correctCount = 0;
    questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswerIndex) correctCount++;
    });
    setScore(correctCount);
    setExamFinished(true);
  }, [questions, answers]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getAnsweredCount = () => Object.keys(answers).length;
  const getOptionLabel = (index: number) => String.fromCharCode(65 + index);

  const restartExam = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setTimeLeft(EXAM_DURATION);
    setExamFinished(false);
    setSubjectsConfirmed(false);
    setExamStarted(false);
    setQuestions([]);
  };

  // ===== AUTH LOADING =====
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ===== SUBJECT SELECTION (wrapped in SubscriptionGate) =====
  if (!subjectsConfirmed) {
    const categories = [...new Set(EXAM_SUBJECTS.map(s => s.category))];

    if (!user || !examCategoryId) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    return (
      <SubscriptionGate
        examCategoryId={examCategoryId}
        examCategoryName={categoryName}
        userId={user.id}
        userEmail={user.email || ""}
      >
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-100 dark:from-gray-900 dark:to-gray-800 py-6 px-3 md:px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {categoryName} CBT Practice
            </h1>
            <p className="text-muted-foreground text-sm">
              Select up to 4 subjects to practice
            </p>
          </div>

          <div className="flex items-center justify-between mb-4 bg-card rounded-lg p-3 shadow-sm border">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="font-medium text-sm">{selectedSubjects.length} subject(s) selected</span>
            </div>
          </div>

          {selectedSubjects.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedSubjects.map(id => {
                const subject = EXAM_SUBJECTS.find(s => s.id === id);
                return (
                  <span key={id} className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                    <CheckCircle className="h-3 w-3" />
                    {subject?.name}
                  </span>
                );
              })}
            </div>
          )}

          <Card className="shadow-lg mb-6">
            <CardContent className="p-3 md:p-6">
              <div className="space-y-6">
                {categories.map(category => {
                  const categorySubjects = EXAM_SUBJECTS.filter(s => s.category === category);
                  return (
                    <div key={category}>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        {category}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {categorySubjects.map(subject => {
                          const isSelected = selectedSubjects.includes(subject.id);
                          const isDisabled = !isSelected && selectedSubjects.length >= 4;
                          return (
                            <div
                              key={subject.id}
                              onClick={() => !isDisabled && handleSubjectToggle(subject.id)}
                              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                isSelected
                                  ? "border-primary bg-primary/5 cursor-pointer hover:bg-primary/10"
                                  : isDisabled
                                  ? "border-border opacity-50 cursor-not-allowed"
                                  : "border-border cursor-pointer hover:border-primary/50 hover:bg-accent"
                              }`}
                            >
                              <Checkbox checked={isSelected} disabled={isDisabled} className="flex-shrink-0" />
                              <span className="text-sm font-medium truncate">{subject.name}</span>
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

          <Card className="shadow-lg">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  <p className="flex items-center gap-1"><Clock className="h-4 w-4" /> Duration: <strong>45 Minutes</strong></p>
                  <p className="flex items-center gap-1 mt-1"><BookOpen className="h-4 w-4" /> {QUESTIONS_PER_SUBJECT} questions per subject</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <Button variant="outline" onClick={() => navigate("/exam")} className="flex-1 md:flex-none">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={handleStartExam} disabled={selectedSubjects.length === 0} size="lg" className="flex-1 md:flex-none">
                    Start Exam <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </SubscriptionGate>
    );
  }

  // ===== LOADING =====
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-violet-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Loading {categoryName} Questions...</h2>
          <p className="text-muted-foreground mt-2">Fetching from the question bank</p>
        </div>
      </div>
    );
  }

  // ===== NO QUESTIONS =====
  if (subjectsConfirmed && questions.length === 0 && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-violet-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Questions Available</h2>
            <p className="text-muted-foreground mb-4">
              No questions found for the selected subjects. Try different subjects or check back later.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={restartExam}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Change Subjects
              </Button>
              <Button onClick={() => fetchQuestions(selectedSubjects)}>
                <RotateCcw className="mr-2 h-4 w-4" /> Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===== RESULTS =====
  if (examFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    const wrongAnswers = questions.filter((q, i) => answers[i] !== q.correctAnswerIndex);

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-8 overflow-hidden">
            <div className={`p-8 text-center text-white ${percentage >= 50 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'}`}>
              <h1 className="text-3xl font-bold mb-2">{categoryName} CBT Results</h1>
              <div className="text-7xl font-bold my-6">{score}/{questions.length}</div>
              <p className="text-2xl">{percentage}%</p>
              <Progress value={percentage} className="mt-4 h-3 bg-white/30" />
            </div>
            <CardContent className="p-6">
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => navigate("/exam")}><Home className="mr-2 h-4 w-4" /> Back</Button>
                <Button onClick={restartExam}><RotateCcw className="mr-2 h-4 w-4" /> Retake</Button>
              </div>
            </CardContent>
          </Card>

          {wrongAnswers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" /> Review Wrong Answers ({wrongAnswers.length})
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
                            <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded text-sm font-medium">Q{originalIndex + 1}</span>
                            {q.subject && <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded text-xs">{q.subject}</span>}
                          </div>
                          <div className="prose dark:prose-invert max-w-none mb-4">
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{q.text}</ReactMarkdown>
                          </div>
                          <div className="space-y-2 mb-4">
                            {q.options.map((opt, optIdx) => (
                              <div key={optIdx} className={`p-2 rounded border ${optIdx === q.correctAnswerIndex ? "bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700" : optIdx === userAnswer ? "bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700" : "bg-muted/30"}`}>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{getOptionLabel(optIdx)}.</span>
                                  <div className="prose dark:prose-invert prose-sm max-w-none flex-1">
                                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{opt}</ReactMarkdown>
                                  </div>
                                  {optIdx === q.correctAnswerIndex && <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />}
                                  {optIdx === userAnswer && optIdx !== q.correctAnswerIndex && <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />}
                                </div>
                              </div>
                            ))}
                          </div>
                          {q.explanation && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                              <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-1">Explanation:</h4>
                              <div className="prose dark:prose-invert prose-sm max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{q.explanation}</ReactMarkdown>
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

  // ===== EXAM TAKING =====
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-violet-700 text-white py-3 px-3 md:py-4 md:px-4 sticky top-0 z-20 shadow-lg">
        <div className="container mx-auto flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-base md:text-2xl font-bold truncate">{categoryName} CBT</h1>
            <p className="text-xs md:text-sm opacity-90">Q{currentQuestionIndex + 1} of {questions.length}</p>
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
              <CheckCircle className="h-3 w-3" />
              <span className="font-medium text-xs">{getAnsweredCount()}/{questions.length}</span>
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${timeLeft < 300 ? "bg-red-500 animate-pulse" : "bg-white/20"}`}>
              <Clock className="h-3 w-3" />
              <span className="font-bold text-xs">{formatTime(timeLeft)}</span>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="secondary" size="sm" className="bg-white text-purple-700 hover:bg-purple-50 text-xs h-7">
                  <Send className="h-3 w-3 mr-1" /> Submit
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You have answered {getAnsweredCount()} out of {questions.length} questions.
                    {getAnsweredCount() < questions.length && (
                      <span className="block mt-2 text-yellow-600 font-medium">⚠️ {questions.length - getAnsweredCount()} unanswered!</span>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Continue</AlertDialogCancel>
                  <AlertDialogAction onClick={handleFinalize}>Submit</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Question Navigator (Mobile) */}
      <div className="md:hidden bg-card border-b px-2 py-2">
        <ScrollArea className="w-full">
          <div className="flex gap-1">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`flex-shrink-0 w-8 h-8 rounded text-xs font-medium transition-all ${
                  idx === currentQuestionIndex
                    ? "bg-primary text-primary-foreground"
                    : answers[idx] !== undefined
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Side Nav - Desktop */}
        <div className="hidden md:block w-64 bg-card border-r shadow-lg p-4">
          <h3 className="font-semibold mb-3 text-sm">Questions</h3>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-9 h-9 rounded-lg text-xs font-medium transition-all ${
                  idx === currentQuestionIndex
                    ? "bg-primary text-primary-foreground shadow-md"
                    : answers[idx] !== undefined
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border"
                    : "bg-muted/50 text-muted-foreground border hover:bg-muted"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Question Content */}
        <div className="flex-1 p-3 md:p-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            {currentQuestion && (
              <Card className="shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">
                      Question {currentQuestionIndex + 1}
                    </span>
                    {currentQuestion.subject && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {currentQuestion.subject}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none mb-6">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {currentQuestion.text}
                    </ReactMarkdown>
                  </div>

                  <RadioGroup
                    value={answers[currentQuestionIndex]?.toString()}
                    onValueChange={(value) => handleAnswerChange(currentQuestionIndex, parseInt(value))}
                    className="space-y-3"
                  >
                    {currentQuestion.options.map((option, optIdx) => (
                      <div
                        key={optIdx}
                        className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          answers[currentQuestionIndex] === optIdx
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30 hover:bg-accent/50"
                        }`}
                        onClick={() => handleAnswerChange(currentQuestionIndex, optIdx)}
                      >
                        <RadioGroupItem value={optIdx.toString()} id={`opt-${optIdx}`} className="mt-1 flex-shrink-0" />
                        <Label htmlFor={`opt-${optIdx}`} className="cursor-pointer flex-1 text-sm">
                          <span className="font-semibold mr-2">{getOptionLabel(optIdx)}.</span>
                          <span className="inline">
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {option}
                            </ReactMarkdown>
                          </span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  <div className="flex justify-between mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                      disabled={currentQuestionIndex === 0}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                    </Button>
                    <Button
                      onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                      disabled={currentQuestionIndex === questions.length - 1}
                    >
                      Next <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiExam;
