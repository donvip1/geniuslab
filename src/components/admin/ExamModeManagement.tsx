import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, FileText, Clock, Users, Trophy, AlertCircle, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ExamSettings {
  id: string;
  is_exam_mode: boolean;
  exam_duration_minutes: number;
  exam_start_time: string | null;
  exam_end_time: string | null;
}

interface ExamAttemptWithProfile {
  id: string;
  user_id: string;
  subject_id: string;
  score: number;
  total_questions: number;
  time_taken_seconds: number | null;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  } | null;
  subjects: {
    name: string;
  } | null;
}

export const ExamModeManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ExamSettings | null>(null);
  const [examAttempts, setExamAttempts] = useState<ExamAttemptWithProfile[]>([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("exam_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSettings(data);
        if (data.is_exam_mode) {
          fetchExamAttempts();
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load exam settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchExamAttempts = async () => {
    setAttemptsLoading(true);
    try {
      // Fetch exam attempts
      const { data: attemptsData, error: attemptsError } = await supabase
        .from("exam_attempts")
        .select("*")
        .order("created_at", { ascending: false });

      if (attemptsError) throw attemptsError;
      
      if (!attemptsData || attemptsData.length === 0) {
        setExamAttempts([]);
        return;
      }

      // Fetch profiles and subjects separately
      const userIds = [...new Set(attemptsData.map(a => a.user_id))];
      const subjectIds = [...new Set(attemptsData.map(a => a.subject_id))];
      
      const [profilesRes, subjectsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, email").in("user_id", userIds),
        supabase.from("subjects").select("id, name").in("id", subjectIds)
      ]);
      
      const profilesMap = new Map(profilesRes.data?.map(p => [p.user_id, p]));
      const subjectsMap = new Map(subjectsRes.data?.map(s => [s.id, s]));
      
      const enrichedData = attemptsData.map(attempt => ({
        ...attempt,
        profiles: profilesMap.get(attempt.user_id) || null,
        subjects: subjectsMap.get(attempt.subject_id) || null
      }));
      
      setExamAttempts(enrichedData);
    } catch (error: any) {
      console.error("Error fetching exam attempts:", error);
      toast({
        title: "Error",
        description: "Failed to load exam attempts",
        variant: "destructive",
      });
    } finally {
      setAttemptsLoading(false);
    }
  };

  const handleToggleExamMode = async (checked: boolean) => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const updateData: any = {
        is_exam_mode: checked,
      };
      
      if (checked) {
        updateData.exam_start_time = new Date().toISOString();
        updateData.exam_end_time = null;
      } else {
        updateData.exam_end_time = new Date().toISOString();
      }

      const { error } = await supabase
        .from("exam_settings")
        .update(updateData)
        .eq("id", settings.id);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, ...updateData } : null);
      
      if (checked) {
        fetchExamAttempts();
      }

      toast({
        title: checked ? "Exam Mode Activated" : "Exam Mode Deactivated",
        description: checked 
          ? "Students will now take exams with your configured time limit. Their performances will be tracked."
          : "Exam mode is now off. Students use the default 15-minute timer.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update exam mode",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDurationChange = async (value: string) => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const duration = parseInt(value);
      const { error } = await supabase
        .from("exam_settings")
        .update({ exam_duration_minutes: duration })
        .eq("id", settings.id);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, exam_duration_minutes: duration } : null);

      toast({
        title: "Duration Updated",
        description: `Exam duration set to ${duration} minutes`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update duration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getPercentage = (score: number, total: number) => {
    return Math.round((score / total) * 100);
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 70) return { grade: "A", color: "bg-green-500" };
    if (percentage >= 60) return { grade: "B", color: "bg-blue-500" };
    if (percentage >= 50) return { grade: "C", color: "bg-yellow-500" };
    if (percentage >= 40) return { grade: "D", color: "bg-orange-500" };
    return { grade: "F", color: "bg-red-500" };
  };

  const downloadSingleResult = (attempt: ExamAttemptWithProfile) => {
    const percentage = getPercentage(attempt.score, attempt.total_questions);
    const { grade } = getGrade(percentage);
    
    const content = `
GENIUSLAB EDUCATIONAL CONSULT
EXAM RESULT SLIP
================================

Student Name: ${attempt.profiles?.full_name || "Unknown"}
Email: ${attempt.profiles?.email || "N/A"}
Subject: ${attempt.subjects?.name || "Unknown"}
Date: ${new Date(attempt.created_at).toLocaleDateString()}

PERFORMANCE
-----------
Score: ${attempt.score}/${attempt.total_questions}
Percentage: ${percentage}%
Grade: ${grade}
Time Taken: ${formatTime(attempt.time_taken_seconds)}

================================
Generated by GeniusLab CBT System
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${attempt.profiles?.full_name || "Student"}_Result_${attempt.subjects?.name || "Exam"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllResults = () => {
    if (examAttempts.length === 0) return;
    
    setDownloadingPdf(true);
    
    let content = `
GENIUSLAB EDUCATIONAL CONSULT
BULK EXAM RESULTS REPORT
================================
Generated: ${new Date().toLocaleString()}
Total Students: ${examAttempts.length}
================================

`;

    examAttempts.forEach((attempt, index) => {
      const percentage = getPercentage(attempt.score, attempt.total_questions);
      const { grade } = getGrade(percentage);
      
      content += `
${index + 1}. ${attempt.profiles?.full_name || "Unknown Student"}
   Email: ${attempt.profiles?.email || "N/A"}
   Subject: ${attempt.subjects?.name || "Unknown"}
   Score: ${attempt.score}/${attempt.total_questions} (${percentage}%)
   Grade: ${grade}
   Time: ${formatTime(attempt.time_taken_seconds)}
   Date: ${new Date(attempt.created_at).toLocaleDateString()}
---
`;
    });

    content += `
================================
END OF REPORT
Generated by GeniusLab CBT System
`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GeniusLab_Exam_Results_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    setDownloadingPdf(false);
    
    toast({
      title: "Download Complete",
      description: `Downloaded results for ${examAttempts.length} students`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Exam Mode Toggle Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Exam Mode Control
          </CardTitle>
          <CardDescription>
            Toggle between General Mode (default) and Exam Mode for controlled assessments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mode Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div className="space-y-1">
              <Label htmlFor="exam-mode" className="text-base font-semibold">
                {settings?.is_exam_mode ? "Exam Mode Active" : "General Mode Active"}
              </Label>
              <p className="text-sm text-muted-foreground">
                {settings?.is_exam_mode 
                  ? "Student performances are being tracked. Custom time limit is active."
                  : "Default 15-minute timer. No special tracking enabled."}
              </p>
            </div>
            <Switch
              id="exam-mode"
              checked={settings?.is_exam_mode || false}
              onCheckedChange={handleToggleExamMode}
              disabled={saving}
            />
          </div>

          {/* Alert for exam mode */}
          {settings?.is_exam_mode && (
            <div className="flex items-start gap-3 p-4 rounded-lg border border-primary/50 bg-primary/5">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-primary">Exam Mode is Active</p>
                <p className="text-sm text-muted-foreground">
                  All student exam attempts are now being collected. You can view and download results below.
                </p>
              </div>
            </div>
          )}

          {/* Duration Selector - Only show when exam mode is active or being configured */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Exam Duration</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Set the time limit for exams when Exam Mode is active
            </p>
            <Select
              value={settings?.exam_duration_minutes?.toString() || "15"}
              onValueChange={handleDurationChange}
              disabled={saving}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="20">20 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Student Results Card - Only show when exam mode is active */}
      {settings?.is_exam_mode && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Student Performances
                </CardTitle>
                <CardDescription>
                  View and download student exam results
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchExamAttempts}
                  disabled={attemptsLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${attemptsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={downloadAllResults}
                  disabled={examAttempts.length === 0 || downloadingPdf}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download All ({examAttempts.length})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {attemptsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : examAttempts.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No exam attempts yet</p>
                <p className="text-sm text-muted-foreground">
                  Student results will appear here as they complete exams
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {examAttempts.map((attempt) => {
                      const percentage = getPercentage(attempt.score, attempt.total_questions);
                      const { grade, color } = getGrade(percentage);
                      
                      return (
                        <TableRow key={attempt.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{attempt.profiles?.full_name || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">{attempt.profiles?.email || "N/A"}</p>
                            </div>
                          </TableCell>
                          <TableCell>{attempt.subjects?.name || "Unknown"}</TableCell>
                          <TableCell>
                            <span className="font-semibold">{attempt.score}/{attempt.total_questions}</span>
                            <span className="text-muted-foreground text-sm ml-1">({percentage}%)</span>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${color} text-white`}>{grade}</Badge>
                          </TableCell>
                          <TableCell>{formatTime(attempt.time_taken_seconds)}</TableCell>
                          <TableCell className="text-sm">
                            {new Date(attempt.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadSingleResult(attempt)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
