import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { BookOpen, Clock, User, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ExamLockedScreen } from "@/components/ExamLockedScreen";
import { UserRestrictedScreen } from "@/components/UserRestrictedScreen";

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

const Exam = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>("100L");
  const [isExamsLocked, setIsExamsLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState<string | null>(null);
  const [userRestriction, setUserRestriction] = useState<UserRestriction | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkUser();
    fetchSubjects();
    checkExamLock();
  }, []);

  const checkExamLock = async () => {
    try {
      const { data } = await supabase
        .from("exam_settings")
        .select("is_exams_locked, lock_message")
        .limit(1)
        .maybeSingle();

      if (data) {
        setIsExamsLocked(data.is_exams_locked || false);
        setLockMessage(data.lock_message);
      }
    } catch (error) {
      console.error("Error checking exam lock:", error);
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
        // Check if restriction has expired
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          // Restriction expired, mark as inactive
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

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();

    setIsAdmin(!!roleData);

    // Check user restrictions
    await checkUserRestriction(session.user.id);
    
    setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-16">
        {/* Header */}
        <section className="py-12 bg-gradient-to-br from-primary to-secondary text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center max-w-4xl mx-auto gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">FUOYE CBT EXAMS MODE</h1>
                <p className="opacity-90 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Welcome, {user?.email}
                </p>
              </div>
              <Button variant="secondary" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </section>

        {/* Subjects Selection */}
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
                      No subjects available at the moment. Please check back later.
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
                      <span>After submission, you'll see your score, correct answers, and personalized study recommendations.</span>
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
