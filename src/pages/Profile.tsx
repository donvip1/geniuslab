import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Loader2, ArrowLeft, Edit2, Save, X, Trophy, Target, Clock, BookOpen, BarChart3, TrendingDown, TrendingUp, CheckCircle, XCircle, RefreshCw, Medal, Crown } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string | null;
  full_name: string;
  score: number;
  total_questions: number;
  percentage: number;
  subject_name: string;
  created_at: string;
}

interface UserRank {
  rank: number;
  score: number;
  total_questions: number;
  percentage: number;
}

// JAMB scoring helpers
const isJambAttempt = (a: ExamAttempt) => {
  const ans = a.answers as any;
  return ans?.mode === "practice" || ans?.mode === "mock";
};

const getJambScore = (a: ExamAttempt) => {
  const ans = a.answers as any;
  if (ans?.mode === "mock") {
    // Mock: 180 questions → 400 marks total
    return Math.round(a.score * (400 / a.total_questions) * 10) / 10;
  }
  // Practice: single subject, score × 2.5
  return Math.round(a.score * 2.5 * 10) / 10;
};

const getJambMaxScore = (a: ExamAttempt) => {
  const ans = a.answers as any;
  return ans?.mode === "mock" ? 400 : 100;
};

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ username: "", full_name: "" });
  const [saving, setSaving] = useState(false);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<UserRank | null>(null);

  const loadProfileData = async (uid?: string) => {
    const currentUid = uid || userId;
    if (!currentUid) return;

    const [profileRes, attemptsRes, subjectsRes, categoriesRes] = await Promise.all([
      supabase.from("profiles").select("username, full_name, email").eq("user_id", currentUid).maybeSingle(),
      supabase.from("exam_attempts").select("*").eq("user_id", currentUid).order("created_at", { ascending: false }),
      supabase.from("subjects").select("id, name, exam_category_id"),
      supabase.from("exam_categories").select("id, name"),
    ]);

    // Load leaderboard data
    const [leaderboardRes, userRankRes] = await Promise.all([
      supabase.rpc("get_leaderboard"),
      supabase.rpc("get_user_rank", { p_user_id: currentUid }),
    ]);

    if (leaderboardRes.data) {
      setLeaderboard(leaderboardRes.data as any);
    }
    if (userRankRes.data && (userRankRes.data as any[]).length > 0) {
      setUserRank((userRankRes.data as any[])[0]);
    }

    if (profileRes.data) {
      setProfile(profileRes.data);
      setEditData({ username: profileRes.data.username || "", full_name: profileRes.data.full_name });
    }

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
        let name = subjectNameMap.get(a.subject_id) || categoryNameMap.get(a.subject_id);
        if (!name && a.answers && typeof a.answers === "object") {
          const ans = a.answers as any;
          if (ans.subjects) name = String(ans.subjects);
          else if (ans.subject) name = String(ans.subject);
        }

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
    } else {
      setAttempts([]);
      setCategoryStats([]);
    }
  };

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
      await loadProfileData(session.user.id);
      setLoading(false);
    };
    load();
  }, [navigate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
    toast({ title: "Profile refreshed!" });
  };

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

  // JAMB-specific stats
  const jambAttempts = attempts.filter(isJambAttempt);
  const jambPracticeAttempts = jambAttempts.filter(a => (a.answers as any)?.mode === "practice");
  const jambMockAttempts = jambAttempts.filter(a => (a.answers as any)?.mode === "mock");

  const formatTime = (s: number | null) => {
    if (!s) return "—";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  const userInTop10 = leaderboard.some(e => e.user_id === userId);

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

        {/* JAMB Stats Card */}
        {jambAttempts.length > 0 && (
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                JAMB UTME Performance
              </CardTitle>
              <CardDescription>Scored using JAMB marking scheme (2.5 marks per correct answer)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Practice Mode Stats */}
              {jambPracticeAttempts.length > 0 && (
                <div className="border rounded-lg p-3 space-y-2">
                  <p className="font-semibold text-sm">Practice Mode (Single Subject)</p>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <p className="font-bold text-foreground">{jambPracticeAttempts.length}</p>
                      <p className="text-muted-foreground">Attempts</p>
                    </div>
                    <div>
                      <p className="font-bold text-primary text-base">
                        {Math.round(Math.max(...jambPracticeAttempts.map(a => getJambScore(a))) * 10) / 10}/100
                      </p>
                      <p className="text-muted-foreground">Best JAMB Score</p>
                    </div>
                    <div>
                      <p className="font-bold text-foreground">
                        {Math.round(jambPracticeAttempts.reduce((s, a) => s + getJambScore(a), 0) / jambPracticeAttempts.length * 10) / 10}/100
                      </p>
                      <p className="text-muted-foreground">Avg JAMB Score</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mock Mode Stats */}
              {jambMockAttempts.length > 0 && (
                <div className="border rounded-lg p-3 space-y-2">
                  <p className="font-semibold text-sm">Mock UTME (4 Subjects)</p>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <p className="font-bold text-foreground">{jambMockAttempts.length}</p>
                      <p className="text-muted-foreground">Attempts</p>
                    </div>
                    <div>
                      <p className="font-bold text-primary text-base">
                        {Math.round(Math.max(...jambMockAttempts.map(a => getJambScore(a))) * 10) / 10}/400
                      </p>
                      <p className="text-muted-foreground">Best JAMB Score</p>
                    </div>
                    <div>
                      <p className="font-bold text-foreground">
                        {Math.round(jambMockAttempts.reduce((s, a) => s + getJambScore(a), 0) / jambMockAttempts.length * 10) / 10}/400
                      </p>
                      <p className="text-muted-foreground">Avg JAMB Score</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
              const isJamb = isJambAttempt(bestAttempt);
              const jambScore = isJamb ? getJambScore(bestAttempt) : null;
              const jambMax = isJamb ? getJambMaxScore(bestAttempt) : null;
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
                    <p className="text-green-600 font-bold text-lg">
                      {isJamb ? `${jambScore}/${jambMax} JAMB` : `${bestAttempt.score}/${bestAttempt.total_questions}`} ({pct}%)
                    </p>
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
              const isJamb = isJambAttempt(worstAttempt);
              const jambScore = isJamb ? getJambScore(worstAttempt) : null;
              const jambMax = isJamb ? getJambMaxScore(worstAttempt) : null;
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
                    <p className="text-destructive font-bold text-lg">
                      {isJamb ? `${jambScore}/${jambMax} JAMB` : `${worstAttempt.score}/${worstAttempt.total_questions}`} ({pct}%)
                    </p>
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
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Exam History</CardTitle>
              <CardDescription>{totalExams} attempt{totalExams !== 1 ? "s" : ""}</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
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
                  const isJamb = isJambAttempt(a);
                  const jambScore = isJamb ? getJambScore(a) : null;
                  const jambMax = isJamb ? getJambMaxScore(a) : null;
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
                        {isJamb ? (
                          <span>{jambScore}/{jambMax}</span>
                        ) : (
                          <span>{a.score}/{a.total_questions} ({pct}%)</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Medal className="h-5 w-5 text-primary" />
              Leaderboard — Top 10
            </CardTitle>
            <CardDescription>Best performances across all users</CardDescription>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No exam attempts yet.</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry) => {
                  const isYou = entry.user_id === userId;
                  return (
                    <div
                      key={`${entry.rank}-${entry.user_id}`}
                      className={`flex items-center justify-between p-3 rounded-lg border ${isYou ? "bg-primary/10 border-primary/30" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold w-8 text-center ${entry.rank <= 3 ? "text-primary" : "text-muted-foreground"}`}>
                          {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}
                        </span>
                        <div>
                          <p className="font-medium text-sm">
                            {isYou ? <span className="text-primary font-bold">You</span> : (entry.username || entry.full_name)}
                          </p>
                          <p className="text-xs text-muted-foreground">{entry.subject_name}</p>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-primary">
                        {entry.score}/{entry.total_questions} ({entry.percentage}%)
                      </div>
                    </div>
                  );
                })}

                {/* Show user's rank if not in top 10 */}
                {!userInTop10 && userRank && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/30">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold w-8 text-center text-muted-foreground">#{userRank.rank}</span>
                        <div>
                          <p className="font-medium text-sm text-primary font-bold">Your Best</p>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-primary">
                        {userRank.score}/{userRank.total_questions} ({userRank.percentage}%)
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Profile;
