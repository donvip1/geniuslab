import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Loader2, ArrowLeft, LogOut, Edit2, Save, X, Trophy, Target, Clock, BookOpen, BarChart3, TrendingDown, TrendingUp, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface Profile {
  username: string | null;
  full_name: string;
  email: string;
}

interface ExamAttempt {
  id: string;
  score: number;
  total_questions: number;
  time_taken_seconds: number | null;
  created_at: string;
  subject_id: string;
  subject_name?: string;
  answers?: any;
  category_name?: string;
}

interface CategoryStats {
  name: string;
  attempts: number;
  passed: number;
  failed: number;
  avgScore: number;
  bestScore: number;
}

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ username: "", full_name: "" });
  const [saving, setSaving] = useState(false);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);

      const [profileRes, attemptsRes, subjectsRes, categoriesRes] = await Promise.all([
        supabase.from("profiles").select("username, full_name, email").eq("user_id", session.user.id).maybeSingle(),
        supabase.from("exam_attempts").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }),
        supabase.from("subjects").select("id, name, exam_category_id"),
        supabase.from("exam_categories").select("id, name"),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
        setEditData({ username: profileRes.data.username || "", full_name: profileRes.data.full_name });
      }

      // Build maps
      const categoryNameMap = new Map<string, string>();
      categoriesRes.data?.forEach((c: any) => categoryNameMap.set(c.id, c.name));

      const subjectNameMap = new Map<string, string>();
      const subjectToCategoryMap = new Map<string, string>();
      subjectsRes.data?.forEach((s: any) => {
        subjectNameMap.set(s.id, s.name);
        if (s.exam_category_id) subjectToCategoryMap.set(s.id, s.exam_category_id);
      });

      if (attemptsRes.data) {
        const enriched = attemptsRes.data.map((a: any) => {
          // Resolve subject name
          let name = subjectNameMap.get(a.subject_id) || categoryNameMap.get(a.subject_id);
          if (!name && a.answers && typeof a.answers === "object") {
            const ans = a.answers as any;
            if (ans.subjects) name = String(ans.subjects);
            else if (ans.subject) name = String(ans.subject);
          }

          // Resolve category
          let catName = "Other";
          const ans = a.answers as any;
          if (ans?.mode === "practice" || ans?.mode === "mock") {
            catName = "JAMB UTME";
          } else if (categoryNameMap.has(a.subject_id)) {
            catName = categoryNameMap.get(a.subject_id)!;
          } else if (subjectToCategoryMap.has(a.subject_id)) {
            const catId = subjectToCategoryMap.get(a.subject_id)!;
            catName = categoryNameMap.get(catId) || "Other";
          }

          return { ...a, subject_name: name || "Unknown Subject", category_name: catName };
        });
        setAttempts(enriched);

        // Build category stats
        const grouped = new Map<string, ExamAttempt[]>();
        enriched.forEach((a: ExamAttempt) => {
          const cat = a.category_name || "Other";
          if (!grouped.has(cat)) grouped.set(cat, []);
          grouped.get(cat)!.push(a);
        });

        const stats: CategoryStats[] = [];
        grouped.forEach((items, name) => {
          const total = items.length;
          const passed = items.filter(a => (a.score / a.total_questions) * 100 >= 50).length;
          const avgScore = Math.round(items.reduce((s, a) => s + (a.score / a.total_questions) * 100, 0) / total);
          const bestScore = Math.round(Math.max(...items.map(a => (a.score / a.total_questions) * 100)));
          stats.push({ name, attempts: total, passed, failed: total - passed, avgScore, bestScore });
        });
        stats.sort((a, b) => b.attempts - a.attempts);
        setCategoryStats(stats);
      }

      setLoading(false);
    };
    load();
  }, [navigate]);

  const handleSaveProfile = async () => {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ username: editData.username || null, full_name: editData.full_name })
      .eq("user_id", userId);

    if (error) {
      toast({ title: "Error", description: "Could not update profile.", variant: "destructive" });
    } else {
      setProfile((p) => p ? { ...p, username: editData.username || null, full_name: editData.full_name } : p);
      setEditing(false);
      toast({ title: "Profile updated!" });
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const totalExams = attempts.length;
  const totalQuestions = attempts.reduce((s, a) => s + a.total_questions, 0);
  const avgScore = totalExams > 0 ? Math.round(attempts.reduce((s, a) => s + (a.score / a.total_questions) * 100, 0) / totalExams) : 0;
  const bestScore = totalExams > 0 ? Math.round(Math.max(...attempts.map((a) => (a.score / a.total_questions) * 100))) : 0;
  const passRate = totalExams > 0 ? Math.round((attempts.filter((a) => (a.score / a.total_questions) * 100 >= 50).length / totalExams) * 100) : 0;

  const bestAttempt = totalExams > 0 ? attempts.reduce((best, a) => (a.score / a.total_questions) > (best.score / best.total_questions) ? a : best) : null;
  const worstAttempt = totalExams > 0 ? attempts.reduce((worst, a) => (a.score / a.total_questions) < (worst.score / worst.total_questions) ? a : worst) : null;

  const formatTime = (s: number | null) => {
    if (!s) return "—";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 md:pt-24 max-w-2xl space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Button>

        {/* User Info Card */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-xl">
                {profile?.username || profile?.full_name || "Student"}
              </CardTitle>
              <CardDescription>{profile?.email}</CardDescription>
            </div>
            {!editing && (
              <Button variant="ghost" size="icon" onClick={() => setEditing(true)}>
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          {editing && (
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>Username</Label>
                <Input value={editData.username} onChange={(e) => setEditData({ ...editData, username: e.target.value })} maxLength={50} />
              </div>
              <div className="space-y-1">
                <Label>Full Name</Label>
                <Input value={editData.full_name} onChange={(e) => setEditData({ ...editData, full_name: e.target.value })} maxLength={100} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveProfile} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />} Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}><X className="h-4 w-4 mr-1" /> Cancel</Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "Exams Taken", value: totalExams, icon: BookOpen },
            { label: "Questions", value: totalQuestions, icon: Target },
            { label: "Avg Score", value: `${avgScore}%`, icon: BarChart3 },
            { label: "Best Score", value: `${bestScore}%`, icon: Trophy },
            { label: "Pass Rate", value: `${passRate}%`, icon: Target },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 flex flex-col items-center text-center gap-1">
                <stat.icon className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{stat.value}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Per-Category Breakdown */}
        {categoryStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance by Category</CardTitle>
              <CardDescription>Detailed breakdown across exam types</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {categoryStats.map((cat) => (
                <div key={cat.name} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{cat.name}</p>
                    <span className="text-xs text-muted-foreground">{cat.attempts} attempt{cat.attempts !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div>
                      <p className="font-bold text-foreground">{cat.avgScore}%</p>
                      <p className="text-muted-foreground">Avg</p>
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{cat.bestScore}%</p>
                      <p className="text-muted-foreground">Best</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <p className="font-bold text-green-600 flex items-center gap-0.5"><CheckCircle className="h-3 w-3" />{cat.passed}</p>
                      <p className="text-muted-foreground">Passed</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <p className="font-bold text-destructive flex items-center gap-0.5"><XCircle className="h-3 w-3" />{cat.failed}</p>
                      <p className="text-muted-foreground">Failed</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Best & Worst Performances */}
        {totalExams > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {bestAttempt && (() => {
              const pct = Math.round((bestAttempt.score / bestAttempt.total_questions) * 100);
              return (
                <Card className="border-green-200 dark:border-green-900">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Best Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p className="font-semibold">{bestAttempt.subject_name}</p>
                    <p className="text-green-600 font-bold text-lg">{bestAttempt.score}/{bestAttempt.total_questions} ({pct}%)</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>{format(new Date(bestAttempt.created_at), "MMM d, yyyy")}</span>
                      <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{formatTime(bestAttempt.time_taken_seconds)}</span>
                    </p>
                  </CardContent>
                </Card>
              );
            })()}
            {worstAttempt && (() => {
              const pct = Math.round((worstAttempt.score / worstAttempt.total_questions) * 100);
              return (
                <Card className="border-red-200 dark:border-red-900">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-destructive" />
                      Worst Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p className="font-semibold">{worstAttempt.subject_name}</p>
                    <p className="text-destructive font-bold text-lg">{worstAttempt.score}/{worstAttempt.total_questions} ({pct}%)</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>{format(new Date(worstAttempt.created_at), "MMM d, yyyy")}</span>
                      <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{formatTime(worstAttempt.time_taken_seconds)}</span>
                    </p>
                  </CardContent>
                </Card>
              );
            })()}
          </div>
        )}

        {/* Exam History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Exam History</CardTitle>
            <CardDescription>{totalExams} attempt{totalExams !== 1 ? "s" : ""}</CardDescription>
          </CardHeader>
          <CardContent>
            {attempts.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No exams taken yet.</p>
                <Button size="sm" onClick={() => navigate("/exam")}>Take Your First Exam</Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {attempts.map((a) => {
                  const pct = Math.round((a.score / a.total_questions) * 100);
                  const passed = pct >= 50;
                  return (
                    <div key={a.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{a.subject_name}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${passed ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                            {passed ? "Passed" : "Failed"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                          <span className="text-primary/70">{a.category_name}</span>
                          <span>{format(new Date(a.created_at), "MMM d, yyyy")}</span>
                          <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{formatTime(a.time_taken_seconds)}</span>
                        </p>
                      </div>
                      <div className={`text-sm font-bold whitespace-nowrap ${passed ? "text-green-600" : "text-destructive"}`}>
                        {a.score}/{a.total_questions} ({pct}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Button variant="outline" className="w-full" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </Button>
      </div>
    </div>
  );
};

export default Profile;
