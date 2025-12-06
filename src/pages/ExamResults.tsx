import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Home, RotateCcw, Trophy, Target } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ExamCompletionPopup } from "@/components/ExamCompletionPopup";

interface QuestionResult {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
  user_answer: string;
  is_correct: boolean;
}

interface ExamResultsState {
  questions: QuestionResult[];
  score: number;
  totalQuestions: number;
  timeTaken: number;
  subjectName: string;
}

const ExamResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [results, setResults] = useState<ExamResultsState | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showCompletionPopup, setShowCompletionPopup] = useState(true);

  useEffect(() => {
    if (location.state) {
      setResults(location.state as ExamResultsState);
    } else {
      navigate("/exam");
    }
  }, [location.state, navigate]);

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading results...</p>
        </div>
      </div>
    );
  }

  const percentage = Math.round((results.score / results.totalQuestions) * 100);
  const correctCount = results.score;
  const wrongCount = results.totalQuestions - results.score;

  const getGrade = () => {
    if (percentage >= 70) return { grade: "Excellent!", color: "text-green-600", emoji: "🎉" };
    if (percentage >= 50) return { grade: "Good Job!", color: "text-yellow-600", emoji: "👍" };
    if (percentage >= 40) return { grade: "Fair", color: "text-orange-600", emoji: "📚" };
    return { grade: "Needs Improvement", color: "text-red-600", emoji: "💪" };
  };

  const gradeInfo = getGrade();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min ${secs} sec`;
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Exam Completion Popup */}
      {results && (
        <ExamCompletionPopup
          isOpen={showCompletionPopup}
          onClose={() => setShowCompletionPopup(false)}
          score={results.score}
          totalQuestions={results.totalQuestions}
        />
      )}
      
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Result Summary Card */}
          <Card className="mb-8 overflow-hidden">
            <div className="bg-gradient-to-br from-primary to-secondary text-primary-foreground p-6 md:p-8 text-center">
              <Trophy className="h-16 w-16 mx-auto mb-4" />
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Exam Completed!</h1>
              <p className="text-lg opacity-90">{results.subjectName}</p>
            </div>
            
            <CardContent className="p-6 md:p-8">
              {/* Score Display */}
              <div className="text-center mb-8">
                <div className={`text-6xl md:text-8xl font-bold ${gradeInfo.color} mb-2`}>
                  {percentage}%
                </div>
                <p className="text-2xl font-semibold mb-1">
                  {gradeInfo.emoji} {gradeInfo.grade}
                </p>
                <p className="text-muted-foreground">
                  You scored {correctCount} out of {results.totalQuestions} questions
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-green-500/10 rounded-lg p-4 text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{correctCount}</p>
                  <p className="text-sm text-muted-foreground">Correct</p>
                </div>
                <div className="bg-red-500/10 rounded-lg p-4 text-center">
                  <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-600">{wrongCount}</p>
                  <p className="text-sm text-muted-foreground">Wrong</p>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-4 text-center">
                  <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{results.totalQuestions}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
                <div className="bg-purple-500/10 rounded-lg p-4 text-center">
                  <div className="h-8 w-8 mx-auto mb-2 flex items-center justify-center">
                    <span className="text-2xl">⏱️</span>
                  </div>
                  <p className="text-lg font-bold text-purple-600">{formatTime(results.timeTaken)}</p>
                  <p className="text-sm text-muted-foreground">Time Taken</p>
                </div>
              </div>

              {/* Feedback Message */}
              <div className="bg-muted rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-2">Feedback:</h3>
                {percentage >= 70 ? (
                  <p>Outstanding performance! You have a strong understanding of the subject. Keep up the excellent work!</p>
                ) : percentage >= 50 ? (
                  <p>Good effort! You're on the right track. Review the questions you missed to strengthen your knowledge.</p>
                ) : percentage >= 40 ? (
                  <p>You have a basic understanding but need more practice. Focus on the topics where you struggled.</p>
                ) : (
                  <p>Don't give up! Review the material thoroughly and try again. Practice makes perfect!</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <Button onClick={() => navigate("/exam")} variant="outline" className="gap-2">
                  <Home className="h-4 w-4" />
                  Back to Subjects
                </Button>
                <Button onClick={() => navigate(`/exam/${location.pathname.split("/").pop()}`)} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Retake Exam
                </Button>
              </div>

              {/* Toggle Details */}
              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => setShowDetails(!showDetails)}
                  className="underline"
                >
                  {showDetails ? "Hide Detailed Review" : "Show Detailed Review"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Question Review */}
          {showDetails && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold mb-4">Question Review</h2>
              {results.questions.map((question, index) => (
                <Card key={question.id} className={`border-l-4 ${question.is_correct ? "border-l-green-500" : "border-l-red-500"}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      {question.is_correct ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      Question {index + 1}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="font-medium">{question.question_text}</p>
                    
                    <div className="space-y-2">
                      {["A", "B", "C", "D"].map((opt) => {
                        const optKey = `option_${opt.toLowerCase()}` as keyof QuestionResult;
                        const optText = question[optKey] as string;
                        const isCorrect = question.correct_answer === opt;
                        const isUserAnswer = question.user_answer === opt;
                        
                        let className = "p-2 rounded border text-sm ";
                        if (isCorrect) {
                          className += "bg-green-100 border-green-500 text-green-800";
                        } else if (isUserAnswer && !isCorrect) {
                          className += "bg-red-100 border-red-500 text-red-800 line-through";
                        } else {
                          className += "bg-muted border-border";
                        }
                        
                        return (
                          <div key={opt} className={className}>
                            <span className="font-semibold">{opt}.</span> {optText}
                            {isCorrect && <span className="ml-2 text-xs font-bold">(Correct Answer)</span>}
                            {isUserAnswer && !isCorrect && <span className="ml-2 text-xs font-bold">(Your Answer)</span>}
                          </div>
                        );
                      })}
                    </div>
                    
                    {question.explanation && (
                      <div className="bg-blue-50 p-3 rounded text-sm">
                        <strong>Explanation:</strong> {question.explanation}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ExamResults;