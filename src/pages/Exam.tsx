import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  BookOpen, 
  Clock, 
  User, 
  LogOut, 
  FileText, 
  ChevronRight,
  ArrowLeft,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ExamLockedScreen } from "@/components/ExamLockedScreen";
import { UserRestrictedScreen } from "@/components/UserRestrictedScreen";
import { PinEntryScreen } from "@/components/PinEntryScreen";
import jambLogo from "@/assets/jamb-logo.webp";
import fuoyeLogo from "@/assets/fuoye-logo.jpeg";

interface Subject {
  id: string;
  name: string;
  description: string;
  level: string;
}

interface UserRestriction {
  restriction_type: "paused" | "suspended" | "banned";
  reason: string | null;
  expires_at: string | null;
}

type ExamCategory = "select" | "jamb" | "department";

const examCategories = [
  {
    id: "jamb" as ExamCategory,
    title: "JAMB UTME CBT",
    description: "Practice with real JAMB past questions. 40 questions, 2 hours.",
    logo: jambLogo,
    color: "from-blue-500 to-indigo-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    badge: "Popular",
  },
  {
    id: "department" as ExamCategory,
    title: "FUOYE CBT Exams",
    description: "Practice exams for your specific courses and subjects.",
    logo: fuoyeLogo,
    color: "from-emerald-500 to-teal-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    badge: null,
  },
  {
    id: "coming-soon" as ExamCategory,
    title: "More Exams Coming Soon",
    description: "POST-UTME, Professional Exams, and more will be added.",
    logo: null,
    color: "from-gray-400 to-gray-500",
    bgColor: "bg-gray-50 dark:bg-gray-900/30",
    borderColor: "border-gray-200 dark:border-gray-700",
    badge: "Coming Soon",
    disabled: true,
  },
];

const Exam = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>("100L");
  const [selectedCategory, setSelectedCategory] = useState<ExamCategory>("select");
  const [isExamsLocked, setIsExamsLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState<string | null>(null);
  const [userRestriction, setUserRestriction] = useState<UserRestriction | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPinRequired, setIsPinRequired] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [settingsChecked, setSettingsChecked] = useState(false);

  useEffect(() => {
    checkUser();
    fetchSubjects();
    checkExamLock();
  }, []);

  const checkExamLock = async () => {
    try {
      const { data } = await supabase
        .from("exam_settings")
        .select("is_exams_locked, lock_message, is_pin_required")
        .limit(1)
        .maybeSingle();

      if (data) {
        setIsExamsLocked(data.is_exams_locked || false);
        setLockMessage(data.lock_message);
        setIsPinRequired(data.is_pin_required || false);
      }
    } catch (error) {
      console.error("Error checking exam lock:", error);
    } finally {
      setSettingsChecked(true);
    }
  };

  const checkActiveSubscription = async (userId: string) => {
    try {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("access_pins")
        .select("expires_at")
        .eq("used_by", userId)
        .eq("is_used", true)
        .gt("expires_at", now)
        .limit(1)
        .maybeSingle();

      setHasActiveSubscription(!!data);
    } catch (error) {
      console.error("Error checking subscription:", error);
    } finally {
      setCheckingSubscription(false);
    }
  };

  const checkUserRestriction = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("user_restrictions")
        .select("restriction_type, reason, expires_at")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();

      if (data) {
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          await supabase
            .from("user_restrictions")
            .update({ is_active: false })
            .eq("user_id", userId)
            .eq("is_active", true);
          return;
        }
        setUserRestriction(data as UserRestriction);
      }
    } catch (error) {
      console.error("Error checking user restriction:", error);
    }
  };

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }
    
    setUser(session.user);

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();

    setIsAdmin(!!roleData);

    await checkUserRestriction(session.user.id);
    await checkActiveSubscription(session.user.id);
    
    setLoading(false);
  };

  const handlePinSuccess = () => {
    setShowPinEntry(false);
    setHasActiveSubscription(true);
  };

  const fetchSubjects = async (level?: string) => {
    try {
      let query = supabase
        .from("subjects")
        .select("*")
        .eq("is_active", true);
      
      if (level) {
        query = query.eq("level", level);
      }
      
      const { data, error } = await query.order("name");

      if (error) throw error;
      setSubjects(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading subjects",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (selectedLevel) {
      fetchSubjects(selectedLevel);
    }
  }, [selectedLevel]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const createSlug = (name: string) => {
    return name.replace(/\s+/g, '-').toLowerCase();
  };

  const startExam = (subjectName: string) => {
    const slug = createSlug(subjectName);
    navigate(`/exam/take/${slug}`);
  };

  const handleCategorySelect = (categoryId: ExamCategory) => {
    if (categoryId === "jamb") {
      navigate("/jamb-exam");
    } else if (categoryId === "department") {
      setSelectedCategory("department");
    }
  };

  if (loading || checkingSubscription || !settingsChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (userRestriction) {
    return (
      <UserRestrictedScreen
        restrictionType={userRestriction.restriction_type}
        reason={userRestriction.reason}
        expiresAt={userRestriction.expires_at}
      />
    );
  }

  if (isExamsLocked && !isAdmin) {
    return <ExamLockedScreen message={lockMessage} />;
  }

  if (isPinRequired && !hasActiveSubscription && !isAdmin) {
    return (
      <PinEntryScreen 
        onSuccess={handlePinSuccess} 
        userEmail={user?.email || ""} 
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-16">
        {/* Header */}
        <section className="py-12 bg-gradient-to-br from-primary to-secondary text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center max-w-4xl mx-auto gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  {selectedCategory === "select" ? "CBT Examination Center" : "FUOYE CBT Exams"}
                </h1>
                <p className="opacity-90 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Welcome, {user?.email}
                </p>
              </div>
              <div className="flex gap-3">
                {selectedCategory !== "select" && (
                  <Button variant="outline" onClick={() => setSelectedCategory("select")} className="bg-white/10 border-white/20 hover:bg-white/20">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Categories
                  </Button>
                )}
                <Button variant="secondary" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Category Selection or Subject List */}
        {selectedCategory === "select" ? (
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-2xl md:text-3xl font-bold mb-3">Choose Your Exam Type</h2>
                  <p className="text-muted-foreground">Select a category to start practicing</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {examCategories.map((category) => {
                    const isDisabled = category.disabled;
                    
                    return (
                      <Card 
                        key={category.id}
                        className={`relative overflow-hidden transition-all cursor-pointer group ${
                          isDisabled 
                            ? "opacity-60 cursor-not-allowed" 
                            : "hover:shadow-xl hover:-translate-y-2"
                        } ${category.bgColor} ${category.borderColor} border-2`}
                        onClick={() => !isDisabled && handleCategorySelect(category.id)}
                      >
                        {category.badge && (
                          <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold ${
                            category.badge === "Popular" 
                              ? "bg-blue-600 text-white" 
                              : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                          }`}>
                            {category.badge}
                          </div>
                        )}
                        <CardHeader className="pb-4">
                          {category.logo ? (
                            <div className="w-16 h-16 rounded-xl overflow-hidden mb-4 shadow-lg group-hover:scale-110 transition-transform">
                              <img src={category.logo} alt={category.title} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                              <Sparkles className="h-7 w-7 text-white" />
                            </div>
                          )}
                          <CardTitle className="text-xl">{category.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-sm mb-4">
                            {category.description}
                          </CardDescription>
                          {!isDisabled && (
                            <div className="flex items-center text-primary font-medium text-sm group-hover:gap-2 transition-all">
                              Start Now
                              <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* Department Subjects Selection */
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                {/* Level Filter */}
                <div className="mb-8">
                  <Label className="text-base font-semibold mb-3 block">Select Your Level</Label>
                  <div className="flex flex-wrap gap-3">
                    {["100L", "200L", "300L", "400L", "500L"].map((level) => (
                      <Button
                        key={level}
                        variant={selectedLevel === level ? "default" : "outline"}
                        onClick={() => setSelectedLevel(level)}
                        className="font-semibold"
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                </div>

                <h2 className="text-2xl font-bold mb-8 text-center">Select a Subject to Practice</h2>

                {subjects.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No subjects available for this level. Please check back later.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {subjects.map((subject) => (
                      <Card key={subject.id} className="hover:shadow-lg transition-all hover:-translate-y-1">
                        <CardHeader>
                          <div className="flex items-start justify-between mb-2">
                            <CardTitle className="flex items-center gap-2">
                              <BookOpen className="h-5 w-5 text-primary" />
                              {subject.name}
                            </CardTitle>
                            <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded">
                              {subject.level}
                            </span>
                          </div>
                          <CardDescription>{subject.description || "Practice exam available"}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button 
                            onClick={() => startExam(subject.name)}
                            className="w-full"
                          >
                            <Clock className="mr-2 h-4 w-4" />
                            Start Exam
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Instructions */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Exam Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">1.</span>
                      <span>Each exam has a time limit. Make sure you have a stable internet connection.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">2.</span>
                      <span>Questions are shuffled for each attempt to ensure fair practice.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">3.</span>
                      <span>You can navigate between questions during the exam.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">4.</span>
                      <span>Submit your answers before the timer runs out to get your results.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">5.</span>
                      <span>After submission, you'll see your score, correct answers, and detailed explanations.</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Exam;
