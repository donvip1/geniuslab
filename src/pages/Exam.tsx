import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  BookOpen, Clock, User, ChevronRight, ArrowLeft, 
  GraduationCap, Award, FileText, Wrench, Trophy
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ExamLockedScreen } from "@/components/ExamLockedScreen";
import { UserRestrictedScreen } from "@/components/UserRestrictedScreen";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import { UniversitySelector } from "@/components/UniversitySelector";
import { SemesterToggle } from "@/components/SemesterToggle";
import jambLogo from "@/assets/jamb-logo.webp";
import waecLogo from "@/assets/waec-logo.png";
import necoLogo from "@/assets/neco-logo.png";
import nabtebLogo from "@/assets/nabteb-logo.png";

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

interface ExamCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon_name: string;
  monthly_price: number;
}

const iconMap: Record<string, React.ReactNode> = {
  GraduationCap: <GraduationCap className="h-7 w-7 text-white" />,
  BookOpen: <BookOpen className="h-7 w-7 text-white" />,
  Award: <Award className="h-7 w-7 text-white" />,
  FileText: <FileText className="h-7 w-7 text-white" />,
  Wrench: <Wrench className="h-7 w-7 text-white" />,
};

const logoMap: Record<string, string> = {
  "jamb-utme": jambLogo,
  "waec": waecLogo,
  "neco": necoLogo,
  "nabteb": nabtebLogo,
};

const colorMap: Record<string, string> = {
  "university-cbt": "from-emerald-500 to-teal-600",
  "jamb-utme": "from-blue-500 to-indigo-600",
  "waec": "from-purple-500 to-violet-600",
  "neco": "from-orange-500 to-amber-600",
  "nabteb": "from-rose-500 to-red-600",
};

const bgColorMap: Record<string, string> = {
  "university-cbt": "bg-emerald-50 dark:bg-emerald-950/30",
  "jamb-utme": "bg-blue-50 dark:bg-blue-950/30",
  "waec": "bg-purple-50 dark:bg-purple-950/30",
  "neco": "bg-orange-50 dark:bg-orange-950/30",
  "nabteb": "bg-rose-50 dark:bg-rose-950/30",
};

const Exam = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>("100L");
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [examCategories, setExamCategories] = useState<ExamCategory[]>([]);
  const [isExamsLocked, setIsExamsLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState<string | null>(null);
  const [userRestriction, setUserRestriction] = useState<UserRestriction | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [settingsChecked, setSettingsChecked] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<"first" | "second">("first");
  const [allowSemesterSelection, setAllowSemesterSelection] = useState(true);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);
  const [bestScorePct, setBestScorePct] = useState<number | null>(null);
  const [motivationalQuote, setMotivationalQuote] = useState("");

  const motivationalQuotes = [
    "Success is not final, failure is not fatal — it is the courage to continue that counts.",
    "The expert in anything was once a beginner.",
    "Education is the passport to the future.",
    "Believe you can and you're halfway there.",
    "Every accomplishment starts with the decision to try.",
    "Your potential is unlimited. Go do what you were created to do.",
    "The only way to do great work is to love what you do.",
    "Don't watch the clock; do what it does — keep going.",
    "Dream big, work hard, stay focused.",
    "Knowledge is power. Practice is perfection.",
  ];

  useEffect(() => {
    setMotivationalQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
    checkUser();
    fetchExamCategories();
    checkExamLock();
  }, []);

  const fetchExamCategories = async () => {
    const { data } = await supabase
      .from("exam_categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order");
    if (data) setExamCategories(data as ExamCategory[]);
  };

  const checkExamLock = async () => {
    try {
      const { data } = await supabase
        .from("exam_settings")
        .select("is_exams_locked, lock_message, allow_semester_selection")
        .limit(1)
        .maybeSingle();

      if (data) {
        setIsExamsLocked(data.is_exams_locked || false);
        setLockMessage(data.lock_message);
        setAllowSemesterSelection(data.allow_semester_selection ?? true);
      }
    } catch (error) {
      console.error("Error checking exam lock:", error);
    } finally {
      setSettingsChecked(true);
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

    // Fetch display name from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, full_name")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (profile) {
      setUserDisplayName(profile.username || profile.full_name || null);
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();

    setIsAdmin(!!roleData);
    await checkUserRestriction(session.user.id);

    // Fetch best score
    const { data: bestAttempt } = await supabase
      .from("exam_attempts")
      .select("score, total_questions")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (bestAttempt && bestAttempt.length > 0) {
      const best = Math.round(Math.max(...bestAttempt.map((a: any) => (a.score / a.total_questions) * 100)));
      setBestScorePct(best);
    }

    setLoading(false);
  };

  const fetchSubjects = async (level?: string) => {
    try {
      let query = supabase
        .from("subjects")
        .select("*")
        .eq("is_active", true);
      
      if (level) query = query.eq("level", level);
      
      const { data, error } = await query.order("name");
      if (error) throw error;
      setSubjects(data || []);
    } catch (error: any) {
      toast({ title: "Error loading subjects", description: error.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    if (selectedLevel && selectedCategorySlug === "university-cbt") {
      fetchSubjects(selectedLevel);
    }
  }, [selectedLevel, selectedCategorySlug]);


  const createSlug = (name: string) => name.replace(/\s+/g, '-').toLowerCase();

  const startExam = (subjectName: string) => {
    navigate(`/exam/take/${createSlug(subjectName)}`);
  };

  const handleCategorySelect = (slug: string) => {
    if (slug === "jamb-utme") {
      navigate("/jamb-exam");
      return;
    }
    if (slug === "waec" || slug === "neco" || slug === "nabteb") {
      navigate(`/api-exam?type=${slug}`);
      return;
    }
    setSelectedCategorySlug(slug);
    if (slug === "university-cbt") {
      fetchSubjects(selectedLevel);
    }
  };

  const selectedCategory = examCategories.find(c => c.slug === selectedCategorySlug);

  if (loading || !settingsChecked) {
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

  // If a category is selected (not JAMB), wrap content in SubscriptionGate
  const renderCategoryContent = () => {
    if (!selectedCategory) return null;

    const innerContent = (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* University Selector for University CBT */}
            {selectedCategorySlug === "university-cbt" && (
              <div className="mb-6 space-y-4">
                <div>
                  <Label className="text-base font-semibold mb-2 block">Select Your University</Label>
                  <UniversitySelector
                    value={selectedUniversity}
                    onChange={(id) => setSelectedUniversity(id)}
                  />
                </div>

                {/* Semester Toggle */}
                {allowSemesterSelection && (
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Semester</Label>
                    <SemesterToggle value={selectedSemester} onChange={setSelectedSemester} />
                  </div>
                )}

                {/* Level Filter */}
                <div>
                  <Label className="text-base font-semibold mb-2 block">Select Your Level</Label>
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
              </div>
            )}

            <h2 className="text-2xl font-bold mb-6 text-center">Select a Subject to Practice</h2>

            {subjects.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No subjects available for this selection. Please check back later.
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
                      <Button onClick={() => startExam(subject.name)} className="w-full">
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
    );

    // Admins bypass the gate
    if (isAdmin) return innerContent;

    return (
      <SubscriptionGate
        examCategoryId={selectedCategory.id}
        examCategoryName={selectedCategory.name}
        userId={user?.id}
        userEmail={user?.email || ""}
      >
        {innerContent}
      </SubscriptionGate>
    );
  };

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <Navbar />
      
      <main className="flex-1 pt-16">
        {/* Header */}
        <section className="py-12 bg-gradient-to-br from-primary to-secondary text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center max-w-4xl mx-auto gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  {selectedCategory ? selectedCategory.name : "CBT Examination Center"}
                </h1>
                <p className="opacity-90 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Welcome, {userDisplayName || user?.email}
                </p>
                {/* Motivational content or best score */}
                <p className="mt-2 text-sm opacity-80 italic flex items-center gap-2">
                  {bestScorePct !== null ? (
                    <>
                      <Trophy className="h-4 w-4" />
                      Your best score: {bestScorePct}% — Can you beat it? 🏆
                    </>
                  ) : (
                    <>💡 {motivationalQuote}</>
                  )}
                </p>
              </div>
              <div className="flex gap-3">
                {selectedCategorySlug && (
                  <Button variant="outline" onClick={() => setSelectedCategorySlug(null)} className="bg-white/10 border-white/20 hover:bg-white/20">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Categories
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Category Selection or Content */}
        {!selectedCategorySlug ? (
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-2xl md:text-3xl font-bold mb-3">Choose Your Exam Type</h2>
                  <p className="text-muted-foreground">Select a category to start practicing</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {examCategories.map((category) => (
                    <Card 
                      key={category.id}
                      className={`relative overflow-hidden transition-all cursor-pointer group hover:shadow-xl hover:-translate-y-2 ${bgColorMap[category.slug] || "bg-muted"} border-2`}
                      onClick={() => handleCategorySelect(category.slug)}
                    >
                      {category.slug === "jamb-utme" && (
                        <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white">
                          Popular
                        </div>
                      )}
                      <CardHeader className="pb-4">
                        {logoMap[category.slug] ? (
                          <div className="w-16 h-16 rounded-xl overflow-hidden mb-4 shadow-lg group-hover:scale-110 transition-transform">
                            <img src={logoMap[category.slug]} alt={category.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorMap[category.slug] || "from-gray-500 to-gray-600"} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                            {iconMap[category.icon_name] || <BookOpen className="h-7 w-7 text-white" />}
                          </div>
                        )}
                        <CardTitle className="text-xl">{category.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-sm mb-4">
                          {category.description}
                        </CardDescription>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">₦{category.monthly_price.toLocaleString()}/month</span>
                          <div className="flex items-center text-primary font-medium text-sm group-hover:gap-2 transition-all">
                            Start Now
                            <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : (
          renderCategoryContent()
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
                      <span>Free trial: 5 questions per day for 5 days. Subscribe for unlimited access.</span>
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
