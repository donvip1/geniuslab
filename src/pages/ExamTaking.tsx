import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, CheckCircle, Clock, AlertCircle, Send } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { FounderWelcomePopup } from "@/components/FounderWelcomePopup";
import { AdvertisementPopup } from "@/components/AdvertisementPopup";
import { ExamLockedScreen } from "@/components/ExamLockedScreen";
import { UserRestrictedScreen } from "@/components/UserRestrictedScreen";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import { InlineExamAd } from "@/components/InlineExamAd";
import { AdBannerSmart } from "@/components/SubscriptionAwareAd";

// Question interface WITHOUT correct_answer and explanation (security: hidden from client)
interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

const QUESTIONS_PER_PAGE = 10;
const DEFAULT_EXAM_TIME_SECONDS = 900;
const UNI_EXAM_STORAGE_KEY = "uni_exam_progress";

interface SavedUniExamState {
  subjectSlug: string;
  questions: Question[];
  answers: Record<string, string>;
  timeLeft: number;
  currentQuestionIndex: number;
  savedAt: number;
}

// Subject-specific question limits
const getQuestionLimit = (subjectName: string): number => {
  const limitedSubjects = ["MTH 101", "MTH 103", "PHY"];
  const isLimitedSubject = limitedSubjects.some(s => 
    subjectName.toUpperCase().includes(s.toUpperCase())
  );
  return isLimitedSubject ? 40 : 100;
};

interface UserRestriction {
  restriction_type: "paused" | "suspended" | "banned";
  reason: string | null;
  expires_at: string | null;
}

interface ExamSettings {
  is_exam_mode: boolean;
  exam_duration_minutes: number;
  is_exams_locked: boolean;
  lock_message: string | null;
  is_pin_required: boolean;
}

const ExamTaking = () => {
  const { subjectSlug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_EXAM_TIME_SECONDS);
  const [examDuration, setExamDuration] = useState(DEFAULT_EXAM_TIME_SECONDS);
  const [subjectName, setSubjectName] = useState("");
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [contributors, setContributors] = useState<string | null>(null);
  const [showFounderPopup, setShowFounderPopup] = useState(true);
  const [examStarted, setExamStarted] = useState(false);
  const [isExamMode, setIsExamMode] = useState(false);
  
  // Access control state
  const [isExamsLocked, setIsExamsLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState<string | null>(null);
  const [userRestriction, setUserRestriction] = useState<UserRestriction | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPinRequired, setIsPinRequired] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const [settingsChecked, setSettingsChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [examCategoryId, setExamCategoryId] = useState<string | null>(null);

  // Pagination for question navigator
  const currentPage = Math.floor(currentQuestionIndex / QUESTIONS_PER_PAGE);
  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const startIndex = currentPage * QUESTIONS_PER_PAGE;
  const endIndex = Math.min(startIndex + QUESTIONS_PER_PAGE, questions.length);
  const visibleQuestions = questions.slice(startIndex, endIndex);

  // === Save exam progress to localStorage ===
  useEffect(() => {
    if (!examStarted || questions.length === 0) return;
    try {
      const state: SavedUniExamState = {
        subjectSlug: subjectSlug || "",
        questions,
        answers,
        timeLeft,
        currentQuestionIndex,
        savedAt: Date.now(),
      };
      localStorage.setItem(UNI_EXAM_STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [answers, timeLeft, currentQuestionIndex, examStarted]);

  // === Restore exam progress on mount ===
  useEffect(() => {
    try {
      const saved = localStorage.getItem(UNI_EXAM_STORAGE_KEY);
      if (!saved) return;
      const state: SavedUniExamState = JSON.parse(saved);
      const threeHoursMs = 3 * 60 * 60 * 1000;
      if (Date.now() - state.savedAt > threeHoursMs || state.timeLeft <= 0) {
        localStorage.removeItem(UNI_EXAM_STORAGE_KEY);
        return;
      }
      if (state.subjectSlug === subjectSlug && state.questions.length > 0) {
        setQuestions(state.questions);
        setAnswers(state.answers);
        setTimeLeft(state.timeLeft);
        setCurrentQuestionIndex(state.currentQuestionIndex);
        setExamStarted(true);
        setLoading(false);
      }
    } catch {
      localStorage.removeItem(UNI_EXAM_STORAGE_KEY);
    }
  }, [subjectSlug]);

  useEffect(() => {
    checkAccessControl();
    fetchExamSettings();
    fetchQuestionsAndSubject();
  }, [subjectSlug]);

  const checkAccessControl = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);
      setUserEmail(session.user.email || "");

      // Fetch university-cbt category
      const { data: cat } = await supabase
        .from("exam_categories")
        .select("id")
        .eq("slug", "university-cbt")
        .maybeSingle();
      if (cat) setExamCategoryId(cat.id);

      // Check if user is admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      setIsAdmin(!!roleData);

      // Check user restrictions
      const { data: restrictionData } = await supabase
        .from("user_restrictions")
        .select("restriction_type, reason, expires_at")
        .eq("user_id", session.user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (restrictionData) {
        // Check if restriction has expired
        if (restrictionData.expires_at && new Date(restrictionData.expires_at) < new Date()) {
          await supabase
            .from("user_restrictions")
            .update({ is_active: false })
            .eq("user_id", session.user.id)
            .eq("is_active", true);
        } else {
          setUserRestriction(restrictionData as UserRestriction);
        }
      }

      // Check active subscription if PIN is required
      const now = new Date().toISOString();
      const { data: pinData } = await supabase
        .from("access_pins")
        .select("expires_at")
        .eq("used_by", session.user.id)
        .eq("is_used", true)
        .gt("expires_at", now)
        .limit(1)
        .maybeSingle();

      setHasActiveSubscription(!!pinData);
      setSubscriptionChecked(true);
    } catch (error) {
      console.error("Error checking access control:", error);
      setSubscriptionChecked(true);
    }
  };

  const fetchExamSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("exam_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching exam settings:", error);
        return;
      }

      if (data) {
        setIsExamMode(data.is_exam_mode);
        setIsExamsLocked(data.is_exams_locked || false);
        setLockMessage(data.lock_message);
        setIsPinRequired(data.is_pin_required || false);
        
        if (data.is_exam_mode && data.exam_duration_minutes) {
          const durationSeconds = data.exam_duration_minutes * 60;
          setTimeLeft(durationSeconds);
          setExamDuration(durationSeconds);
        }
      }
    } catch (error) {
      console.error("Error fetching exam settings:", error);
    } finally {
      setSettingsChecked(true);
    }
  };

  useEffect(() => {
    if (timeLeft > 0 && questions.length > 0 && examStarted) {
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
  }, [timeLeft, questions, examStarted]);

  const handleCloseFounderPopup = () => {
    setShowFounderPopup(false);
    setExamStarted(true);
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const slugToName = (slug: string) => {
    // Convert slug back to searchable pattern (handles various formats)
    return slug.replace(/-/g, ' ');
  };

  const fetchQuestionsAndSubject = async () => {
    try {
      // Fetch subject by matching slug pattern to name
      const searchName = slugToName(subjectSlug || '');
      
      const { data: subjectsData, error: subjectError } = await supabase
        .from("subjects")
        .select("id, name, contributors")
        .eq("is_active", true);

      if (subjectError) throw subjectError;

      // Find subject by matching slug
      const subjectData = subjectsData?.find(s => 
        s.name.replace(/\s+/g, '-').toLowerCase() === subjectSlug?.toLowerCase()
      );

      if (!subjectData) {
        toast({
          title: "Subject Not Found",
          description: "The requested subject could not be found.",
          variant: "destructive",
        });
        navigate("/exam");
        return;
      }

      setSubjectId(subjectData.id);
      setSubjectName(subjectData.name);
      setContributors(subjectData.contributors);

      // Fetch questions from secure view (excludes correct_answer and explanation)
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions_public")
        .select("id, question_text, option_a, option_b, option_c, option_d")
        .eq("subject_id", subjectData.id);

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

      // Filter out incomplete/malformed questions - strict validation
      const qualityQuestions = questionsData.filter(q => {
        const rawText = (q.question_text || '').trim();
        const plainText = rawText.replace(/<[^>]*>/g, '').trim();
        const wordCount = plainText.split(/\s+/).filter((w: string) => w.length > 0).length;
        if (plainText.length < 25 || wordCount < 5) return false;
        const options = [q.option_a, q.option_b, q.option_c, q.option_d];
        const validOpts = options.filter(o => o && o.trim().length >= 1);
        if (validOpts.length < 4) return false;
        const unique = new Set(validOpts.map(o => (o || '').trim().toLowerCase()));
        if (unique.size < 2) return false;
        return true;
      });

      if (qualityQuestions.length === 0) {
        toast({
          title: "No Valid Questions",
          description: "All questions for this subject are incomplete. Please contact admin.",
          variant: "destructive",
        });
        navigate("/exam");
        return;
      }

      // Shuffle questions for each exam attempt
      const shuffledQuestions = shuffleArray(qualityQuestions);
      
      // Apply question limit based on subject
      const questionLimit = getQuestionLimit(subjectData.name);
      const limitedQuestions = shuffledQuestions.slice(0, questionLimit);
      
      setQuestions(limitedQuestions);
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
    localStorage.removeItem(UNI_EXAM_STORAGE_KEY);
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

      const timeTaken = examDuration - timeLeft;

      // Submit exam via secure edge function (server-side answer validation)
      const { data, error } = await supabase.functions.invoke('submit-exam', {
        body: {
          subjectId,
          answers,
          questionIds: questions.map(q => q.id),
          timeTakenSeconds: timeTaken,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Failed to submit exam");
      }

      // Increment lifetime trial question count
      if (examCategoryId) {
        const questionsAnswered = questions.length;
        const { data: trial } = await supabase
          .from("user_trials")
          .select("total_questions_used")
          .eq("user_id", session.user.id)
          .eq("exam_category_id", examCategoryId)
          .maybeSingle();
        
        if (trial) {
          const currentTotal = (trial as any).total_questions_used || 0;
          await supabase
            .from("user_trials")
            .update({ total_questions_used: currentTotal + questionsAnswered } as any)
            .eq("user_id", session.user.id)
            .eq("exam_category_id", examCategoryId);
        }
      }

      // Navigate to results page with exam data (correct answers now revealed by server)
      navigate(`/exam-results/${subjectSlug}`, {
        state: {
          questions: data.questions,
          score: data.score,
          totalQuestions: data.totalQuestions,
          timeTaken: timeTaken,
          subjectName: subjectName,
          subjectSlug: subjectSlug,
        },
      });
    } catch (error: any) {
      console.error("Error submitting exam:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to submit exam. Please try again.",
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

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      const newIndex = (currentPage + 1) * QUESTIONS_PER_PAGE;
      setCurrentQuestionIndex(newIndex);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      const newIndex = (currentPage - 1) * QUESTIONS_PER_PAGE;
      setCurrentQuestionIndex(newIndex);
    }
  };

  if (loading || !subscriptionChecked || !settingsChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading exam questions...</p>
        </div>
      </div>
    );
  }

  // Show restriction screen if user is restricted
  if (userRestriction) {
    return (
      <UserRestrictedScreen
        restrictionType={userRestriction.restriction_type}
        reason={userRestriction.reason}
        expiresAt={userRestriction.expires_at}
      />
    );
  }

  // Show lock screen if exams are locked (except for admins)
  if (isExamsLocked && !isAdmin) {
    return <ExamLockedScreen message={lockMessage} />;
  }

  const currentQuestion = questions[currentQuestionIndex];

  const examContent = (
    <div className="min-h-screen bg-muted/30 flex flex-col pb-20 lg:pb-0">
      {/* Founder Welcome Popup */}
      <FounderWelcomePopup
        isOpen={showFounderPopup && !loading}
        onClose={handleCloseFounderPopup}
      />
      
      {/* Advertisement Popup - Shows every 7 minutes during exam */}
      {examStarted && (
        <AdvertisementPopup 
          intervalMs={420000} // 7 minutes
          initialDelayMs={420000} // First ad after 7 minutes
        />
      )}
      <div className="bg-gradient-to-br from-primary to-secondary text-primary-foreground py-3 px-4 sticky top-0 z-10 shadow-md">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-2 md:gap-4">
          <div className="min-w-0 w-full md:w-auto">
            <h1 className="text-lg md:text-2xl font-bold truncate">{subjectName}</h1>
            <p className="text-xs md:text-sm opacity-90">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
            {contributors && (
              <p className="text-xs opacity-75 mt-1">
                Questions compiled by: <span className="font-medium">{contributors}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-4 md:gap-6 flex-wrap justify-center">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">
                {getAnsweredCount()} / {questions.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span className={`font-bold text-lg ${timeLeft < 300 ? "text-red-300 animate-pulse" : ""}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            {/* Submit button always visible */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="secondary" 
                  size="sm"
                  disabled={submitting}
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You have answered {getAnsweredCount()} out of {questions.length} questions.
                    {getAnsweredCount() < questions.length && (
                      <span className="block mt-2 text-destructive font-medium">
                        Warning: You have {questions.length - getAnsweredCount()} unanswered questions!
                      </span>
                    )}
                    <span className="block mt-2">Are you sure you want to submit?</span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Continue Exam</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSubmitExam}>
                    {submitting ? "Submitting..." : "Submit Exam"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 flex-1 flex flex-col">
        <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col pb-4">
          {timeLeft < 300 && (
            <Alert className="mb-4 border-destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Warning: Less than 5 minutes remaining!
              </AlertDescription>
            </Alert>
          )}

          {/* Question Card */}
          <Card className="mb-4 flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                Question {currentQuestionIndex + 1}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base md:text-lg leading-relaxed">{currentQuestion.question_text}</p>

              {/* Question Image - if embedded in question_text as img tag */}

              <RadioGroup
                value={answers[currentQuestion.id] || ""}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              >
                <div className="space-y-2">
                  {["A", "B", "C", "D"].map((option) => {
                    const optionKey = `option_${option.toLowerCase()}` as keyof Question;
                    const optionText = currentQuestion[optionKey] as string;
                    
                    return (
                      <div
                        key={option}
                        className={`flex items-start space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer hover:bg-accent ${
                          answers[currentQuestion.id] === option
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        }`}
                        onClick={() => handleAnswerChange(currentQuestion.id, option)}
                      >
                        <RadioGroupItem value={option} id={`option-${option}`} className="mt-0.5" />
                        <Label
                          htmlFor={`option-${option}`}
                          className="flex-1 cursor-pointer text-sm md:text-base"
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

          {/* Inline ad every 3 questions */}
          {(currentQuestionIndex + 1) % 3 === 0 && (
            <InlineExamAd />
          )}

          {/* Navigation Section - All on one screen */}
          <div className="space-y-4">
            {/* Question Number Grid - Shows 10 at a time */}
            <div className="bg-card rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">
                  Page {currentPage + 1} of {totalPages} ({startIndex + 1}-{endIndex} of {questions.length})
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPrevPage}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={currentPage >= totalPages - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                {visibleQuestions.map((_, localIndex) => {
                  const globalIndex = startIndex + localIndex;
                  const question = questions[globalIndex];
                  const isAnswered = answers[question.id];
                  const isCurrent = globalIndex === currentQuestionIndex;
                  
                  return (
                    <button
                      key={globalIndex}
                      onClick={() => setCurrentQuestionIndex(globalIndex)}
                      className={`w-full aspect-square rounded-lg font-semibold text-sm transition-all ${
                        isCurrent
                          ? "bg-primary text-primary-foreground ring-2 ring-offset-2 ring-primary"
                          : isAnswered
                          ? "bg-green-500/20 text-green-700 border-2 border-green-500"
                          : "bg-muted hover:bg-muted/80 border border-border"
                      }`}
                    >
                      {globalIndex + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prev/Next Question Navigation */}
            <div className="flex justify-between items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              <span className="text-sm text-muted-foreground hidden md:block">
                Use the grid above to jump to any question
              </span>

              <Button
                onClick={() =>
                  setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))
                }
                disabled={currentQuestionIndex === questions.length - 1}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Wrap in SubscriptionGate for non-admins
  if (!isAdmin && userId && examCategoryId) {
    return (
      <SubscriptionGate
        examCategoryId={examCategoryId}
        examCategoryName="University CBT"
        userId={userId}
        userEmail={userEmail}
      >
        {examContent}
      </SubscriptionGate>
    );
  }

  return examContent;
};

export default ExamTaking;
