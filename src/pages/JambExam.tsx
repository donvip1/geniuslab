import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Send,
  Home,
  RotateCcw
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
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface JambQuestion {
  text: string;
  options: string[];
  correctAnswerIndex: number;
  year: string;
  explanation: string;
}

const EXAM_DURATION_SECONDS = 2 * 60 * 60; // 2 hours
const TOTAL_QUESTIONS = 40;

const JambExam = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [questions, setQuestions] = useState<JambQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION_SECONDS);
  const [examStarted, setExamStarted] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [showSideNav, setShowSideNav] = useState(true);

  // Fetch questions from edge function
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("jamb-questions");

        if (error) throw error;

        if (!data || !Array.isArray(data)) {
          throw new Error("Invalid response format");
        }

        // Shuffle and take 40 questions
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, TOTAL_QUESTIONS);
        setQuestions(selected);
        setExamStarted(true);
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

    fetchQuestions();
  }, [toast]);

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

  const handleFinalize = useCallback(() => {
    let correctCount = 0;
    questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswerIndex) {
        correctCount++;
      }
    });
    setScore(correctCount);
    setExamFinished(true);
  }, [questions, answers]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getAnsweredCount = () => Object.keys(answers).length;

  const getOptionLabel = (index: number) => {
    return String.fromCharCode(65 + index); // A, B, C, D
  };

  const restartExam = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setTimeLeft(EXAM_DURATION_SECONDS);
    setExamFinished(false);
    setLoading(true);
    
    // Refetch questions
    const fetchQuestions = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("jamb-questions");
        if (error) throw error;
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, TOTAL_QUESTIONS);
        setQuestions(selected);
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to reload questions",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Loading JAMB Questions...</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Please wait while we prepare your exam</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Questions Available</h2>
            <p className="text-muted-foreground mb-4">
              Unable to load JAMB questions. Please check your connection and try again.
            </p>
            <Button onClick={() => window.location.reload()}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results Screen
  if (examFinished) {
    const wrongAnswers = questions.filter((q, i) => answers[i] !== q.correctAnswerIndex);
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Score Summary Card */}
          <Card className="mb-8 overflow-hidden">
            <div className={`p-8 text-center text-white ${percentage >= 50 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'}`}>
              <h1 className="text-3xl font-bold mb-2">JAMB CBT Results</h1>
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
                  <div className="text-3xl font-bold text-blue-600">{formatTime(EXAM_DURATION_SECONDS - timeLeft)}</div>
                  <div className="text-sm text-muted-foreground">Time Used</div>
                </div>
              </div>
              <div className="flex gap-4 mt-6 justify-center">
                <Button variant="outline" onClick={() => navigate("/")}>
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Button>
                <Button onClick={restartExam}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Retake Exam
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Wrong Answers with Explanations */}
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
                            {q.year && (
                              <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded text-sm">
                                {q.year}
                              </span>
                            )}
                          </div>
                          
                          <div className="prose dark:prose-invert max-w-none mb-4">
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {q.text}
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
                                      {opt}
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
                                  {q.explanation}
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

  // Exam Taking Screen
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-4 px-4 sticky top-0 z-20 shadow-lg">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">JAMB CBT Practice</h1>
            <p className="text-sm opacity-90">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium text-sm">
                {getAnsweredCount()}/{questions.length}
              </span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${timeLeft < 600 ? "bg-red-500 animate-pulse" : "bg-white/20"}`}>
              <Clock className="h-4 w-4" />
              <span className="font-bold">{formatTime(timeLeft)}</span>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="secondary" size="sm" className="bg-white text-blue-700 hover:bg-blue-50">
                  <Send className="h-4 w-4 mr-2" />
                  Finalize
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
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
                <AlertDialogFooter>
                  <AlertDialogCancel>Continue Exam</AlertDialogCancel>
                  <AlertDialogAction onClick={handleFinalize}>Submit Exam</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Side Navigation */}
        <div className={`${showSideNav ? "w-64" : "w-0"} transition-all duration-300 bg-white dark:bg-gray-800 border-r shadow-lg overflow-hidden`}>
          <div className="p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700 dark:text-gray-200">Questions</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowSideNav(false)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="grid grid-cols-5 gap-2">
                {questions.map((_, index) => {
                  const isAnswered = answers[index] !== undefined;
                  const isCurrent = index === currentQuestionIndex;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`w-full aspect-square rounded-lg font-semibold text-sm transition-all ${
                        isCurrent
                          ? "bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2"
                          : isAnswered
                          ? "bg-green-500 text-white hover:bg-green-600"
                          : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Toggle Side Nav Button */}
        {!showSideNav && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 shadow-md rounded-l-none"
            onClick={() => setShowSideNav(true)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {/* Question Content */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            <Card className="shadow-xl">
              <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                      Q{currentQuestionIndex + 1}
                    </span>
                  </CardTitle>
                  {currentQuestion.year && (
                    <span className="text-sm text-muted-foreground bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                      {currentQuestion.year}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Question Text with LaTeX support */}
                <div className="prose dark:prose-invert max-w-none mb-6 text-lg">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {currentQuestion.text}
                  </ReactMarkdown>
                </div>

                {/* Options */}
                <RadioGroup
                  value={answers[currentQuestionIndex]?.toString() || ""}
                  onValueChange={(value) => handleAnswerChange(currentQuestionIndex, parseInt(value))}
                >
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        className={`flex items-start space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 ${
                          answers[currentQuestionIndex] === optIndex
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                            : "border-gray-200 dark:border-gray-700"
                        }`}
                        onClick={() => handleAnswerChange(currentQuestionIndex, optIndex)}
                      >
                        <RadioGroupItem
                          value={optIndex.toString()}
                          id={`option-${optIndex}`}
                          className="mt-1"
                        />
                        <Label
                          htmlFor={`option-${optIndex}`}
                          className="flex-1 cursor-pointer"
                        >
                          <span className="font-bold text-blue-600 dark:text-blue-400 mr-2">
                            {getOptionLabel(optIndex)}.
                          </span>
                          <span className="prose dark:prose-invert prose-sm inline">
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {option}
                            </ReactMarkdown>
                          </span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    size="lg"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>

                  <span className="text-sm text-muted-foreground hidden md:block">
                    Click on question numbers in the sidebar to navigate
                  </span>

                  <Button
                    onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    disabled={currentQuestionIndex === questions.length - 1}
                    size="lg"
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JambExam;
