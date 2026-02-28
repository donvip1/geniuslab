import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Loader2, ArrowLeft, LogOut, Edit2, Save, X, Trophy, Target, Clock, BookOpen, BarChart3 } from "lucide-react";
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

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);

      // Fetch profile and exam attempts in parallel
      const [profileRes, attemptsRes, subjectsRes, categoriesRes] = await Promise.all([
        supabase.from("profiles").select("username, full_name, email").eq("user_id", session.user.id).maybeSingle(),
        supabase.from("exam_attempts").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }),
        supabase.from("subjects").select("id, name"),
        supabase.from("exam_categories").select("id, name"),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
        setEditData({ username: profileRes.data.username || "", full_name: profileRes.data.full_name });
      }

      // Build combined name map: subjects first, then exam_categories as fallback
      const nameMap = new Map<string, string>();
      subjectsRes.data?.forEach((s: any) => nameMap.set(s.id, s.name));
      categoriesRes.data?.forEach((c: any) => { if (!nameMap.has(c.id)) nameMap.set(c.id, c.name); });

      if (attemptsRes.data) {
        setAttempts(attemptsRes.data.map((a: any) => {
          let name = nameMap.get(a.subject_id);
          // Fallback: check answers JSON for subjects string (JAMB stores subject list there)
          if (!name && a.answers && typeof a.answers === "object") {
            const ans = a.answers as any;
            if (ans.subjects) name = String(ans.subjects);
            else if (ans.subject) name = String(ans.subject);
          }
          return { ...a, subject_name: name || "Unknown Subject" };
        }));
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

  // Stats
  const totalExams = attempts.length;
  const totalQuestions = attempts.reduce((s, a) => s + a.total_questions, 0);
  const avgScore = totalExams > 0 ? Math.round(attempts.reduce((s, a) => s + (a.score / a.total_questions) * 100, 0) / totalExams) : 0;
  const bestScore = totalExams > 0 ? Math.round(Math.max(...attempts.map((a) => (a.score / a.total_questions) * 100))) : 0;
  const passRate = totalExams > 0 ? Math.round((attempts.filter((a) => (a.score / a.total_questions) * 100 >= 50).length / totalExams) * 100) : 0;

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
        {/* Back button */}
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

        {/* Exam Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Exams Taken", value: totalExams, icon: BookOpen },
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

        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Summary</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1 text-muted-foreground">
            <p>Total questions answered: <span className="font-medium text-foreground">{totalQuestions}</span></p>
            <p>Total correct answers: <span className="font-medium text-foreground">{attempts.reduce((s, a) => s + a.score, 0)}</span></p>
          </CardContent>
        </Card>

        {/* Exam History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Exam History</CardTitle>
            <CardDescription>{totalExams} attempt{totalExams !== 1 ? "s" : ""}</CardDescription>
          </CardHeader>
          <CardContent>
            {attempts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No exams taken yet.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {attempts.map((a) => {
                  const pct = Math.round((a.score / a.total_questions) * 100);
                  return (
                    <div key={a.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div className="space-y-0.5">
                        <p className="font-medium text-sm">{a.subject_name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{format(new Date(a.created_at), "MMM d, yyyy")}</span>
                          <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{formatTime(a.time_taken_seconds)}</span>
                        </p>
                      </div>
                      <div className={`text-sm font-bold ${pct >= 50 ? "text-green-600" : "text-destructive"}`}>
                        {a.score}/{a.total_questions} ({pct}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logout */}
        <Button variant="outline" className="w-full" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </Button>
      </div>
    </div>
  );
};

export default Profile;
