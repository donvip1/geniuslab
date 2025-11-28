import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
}

const ExamTaking = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes
  const [subjectName, setSubjectName] = useState("");

  useEffect(() => {
    fetchQuestionsAndSubject();
  }, [subjectId]);

  useEffect(() => {
    if (timeLeft > 0 && questions.length > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, questions]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const fetchQuestionsAndSubject = async () => {
    try {
      // Fetch subject details
      const { data: subjectData, error: subjectError } = await supabase
        .from("subjects")
        .select("name")
        .eq("id", subjectId)
        .single();

      if (subjectError) throw subjectError;
      setSubjectName(subjectData.name);

      // Fetch questions and shuffle them
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("subject_id", subjectId)
        .eq("is_active", true);

      if (questionsError) throw questionsError;

      if (!questionsData || questionsData.length === 0) {
        toast({
          title: "No Questions Available",
          description: "This subject doesn't have any questions yet.",
          variant: "destructive",
        });
        navigate("/exam");
        return;
      }

      // Shuffle questions for each exam attempt
      const shuffledQuestions = shuffleArray(questionsData);
      setQuestions(shuffledQuestions);
    } catch (error: any) {
      console.error("Error fetching questions:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      navigate("/exam");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmitExam = async () => {
    if (submitting) return;
    
    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to submit the exam",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Calculate score
      let correctCount = 0;
      questions.forEach((q) => {
        if (answers[q.id] === q.correct_answer) {
          correctCount++;
        }
      });

      // Save exam attempt
      const { error } = await supabase.from("exam_attempts").insert([
        {
          user_id: session.user.id,
          subject_id: subjectId,
          score: correctCount,
          total_questions: questions.length,
          time_taken_seconds: 3600 - timeLeft,
          answers: answers,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Exam Submitted",
        description: `You scored ${correctCount} out of ${questions.length}`,
      });

      navigate("/exam");
    } catch (error: any) {
      console.error("Error submitting exam:", error);
      toast({
        title: "Error",
        description: "Failed to submit exam. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading exam questions...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-secondary text-primary-foreground py-4 px-4 sticky top-0 z-10 shadow-md">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">{subjectName}</h1>
            <p className="text-sm opacity-90">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">
                {getAnsweredCount()} / {questions.length} Answered
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span className={`font-bold text-lg ${timeLeft < 300 ? "text-destructive" : ""}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {timeLeft < 300 && (
            <Alert className="mb-6 border-destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Warning: Less than 5 minutes remaining!
              </AlertDescription>
            </Alert>
          )}

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">
                Question {currentQuestionIndex + 1}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg leading-relaxed">{currentQuestion.question_text}</p>

              <RadioGroup
                value={answers[currentQuestion.id] || ""}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              >
                <div className="space-y-3">
                  {["A", "B", "C", "D"].map((option) => {
                    const optionKey = `option_${option.toLowerCase()}` as keyof Question;
                    const optionText = currentQuestion[optionKey] as string;
                    
                    return (
                      <div
                        key={option}
                        className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer hover:bg-accent ${
                          answers[currentQuestion.id] === option
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        }`}
                        onClick={() => handleAnswerChange(currentQuestion.id, option)}
                      >
                        <RadioGroupItem value={option} id={`option-${option}`} className="mt-1" />
                        <Label
                          htmlFor={`option-${option}`}
                          className="flex-1 cursor-pointer text-base"
                        >
                          <span className="font-semibold mr-2">{option}.</span>
                          {optionText}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-2">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                    index === currentQuestionIndex
                      ? "bg-primary text-primary-foreground"
                      : answers[questions[index].id]
                      ? "bg-green-500/20 text-green-700 border-2 border-green-500"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {currentQuestionIndex === questions.length - 1 ? (
              <Button onClick={handleSubmitExam} disabled={submitting} size="lg">
                {submitting ? "Submitting..." : "Submit Exam"}
              </Button>
            ) : (
              <Button
                onClick={() =>
                  setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))
                }
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamTaking;