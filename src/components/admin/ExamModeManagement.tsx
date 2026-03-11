import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, FileText, Clock, Users, Trophy, AlertCircle, RefreshCw, Trash2, Calendar, Filter, Lock, BookOpen } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import jsPDF from "jspdf";

interface ExamSettings {
  id: string;
  is_exam_mode: boolean;
  exam_duration_minutes: number;
  exam_start_time: string | null;
  exam_end_time: string | null;
  is_exams_locked: boolean;
  lock_message: string | null;
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

interface Subject {
  id: string;
  name: string;
}

export const ExamModeManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ExamSettings | null>(null);
  const [examAttempts, setExamAttempts] = useState<ExamAttemptWithProfile[]>([]);
  const [filteredAttempts, setFilteredAttempts] = useState<ExamAttemptWithProfile[]>([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [clearing, setClearing] = useState(false);
  
  // Filters
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  // Lock message state
  const [lockMessage, setLockMessage] = useState<string>("");

  useEffect(() => {
    fetchSettings();
    fetchSubjects();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [examAttempts, selectedSubject, startDate, endDate]);

  const fetchSubjects = async () => {
    const { data } = await supabase.from("subjects").select("id, name").eq("is_active", true);
    if (data) setSubjects(data);
  };

  const applyFilters = () => {
    let filtered = [...examAttempts];
    
    // Filter by subject
    if (selectedSubject !== "all") {
      filtered = filtered.filter(a => a.subject_id === selectedSubject);
    }
    
    // Filter by date range
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(a => new Date(a.created_at) >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(a => new Date(a.created_at) <= end);
    }
    
    setFilteredAttempts(filtered);
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("exam_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSettings({
          ...data,
          is_exams_locked: data.is_exams_locked || false,
          lock_message: data.lock_message || null,
        });
        setLockMessage(data.lock_message || "");
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

  const handleToggleExamLock = async (checked: boolean) => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("exam_settings")
        .update({ 
          is_exams_locked: checked,
          lock_message: lockMessage || null,
        })
        .eq("id", settings.id);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, is_exams_locked: checked } : null);

      toast({
        title: checked ? "Exams Locked" : "Exams Unlocked",
        description: checked 
          ? "All students are now blocked from accessing exams"
          : "Students can now access exams normally",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update exam lock",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLockMessage = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("exam_settings")
        .update({ lock_message: lockMessage || null })
        .eq("id", settings.id);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, lock_message: lockMessage || null } : null);

      toast({
        title: "Message Saved",
        description: "Lock message has been updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save message",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const fetchExamAttempts = async () => {
    setAttemptsLoading(true);
    try {
      const { data: attemptsData, error: attemptsError } = await supabase
        .from("exam_attempts")
        .select("*")
        .order("created_at", { ascending: false });

      if (attemptsError) throw attemptsError;
      
      if (!attemptsData || attemptsData.length === 0) {
        setExamAttempts([]);
        return;
      }

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

  const clearAllResults = async () => {
    setClearing(true);
    try {
      const { error } = await supabase.from("exam_attempts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      
      if (error) throw error;
      
      setExamAttempts([]);
      setFilteredAttempts([]);
      
      toast({
        title: "Results Cleared",
        description: "All student performances have been reset",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to clear results",
        variant: "destructive",
      });
    } finally {
      setClearing(false);
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
    if (percentage >= 70) return { grade: "A", color: "bg-green-500", remark: "Excellent" };
    if (percentage >= 60) return { grade: "B", color: "bg-blue-500", remark: "Very Good" };
    if (percentage >= 50) return { grade: "C", color: "bg-yellow-500", remark: "Good" };
    if (percentage >= 40) return { grade: "D", color: "bg-orange-500", remark: "Fair" };
    return { grade: "F", color: "bg-red-500", remark: "Needs Improvement" };
  };

  const generatePDF = (attempt: ExamAttemptWithProfile) => {
    const percentage = getPercentage(attempt.score, attempt.total_questions);
    const { grade, remark } = getGrade(percentage);
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header with branding
    doc.setFillColor(34, 197, 94); // Green color
    doc.rect(0, 0, pageWidth, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("GENIUSLAB", pageWidth / 2, 18, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("EDUCATIONAL CONSULT", pageWidth / 2, 26, { align: "center" });
    doc.text("Excellence Through Knowledge", pageWidth / 2, 34, { align: "center" });
    
    // Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("EXAMINATION RESULT SLIP", pageWidth / 2, 55, { align: "center" });
    
    // Decorative line
    doc.setDrawColor(34, 197, 94);
    doc.setLineWidth(1);
    doc.line(20, 60, pageWidth - 20, 60);
    
    // Student details section
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("STUDENT INFORMATION", 20, 75);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Full Name: ${attempt.profiles?.full_name || "Unknown Student"}`, 20, 85);
    doc.text(`Email: ${attempt.profiles?.email || "N/A"}`, 20, 93);
    doc.text(`Examination Date: ${new Date(attempt.created_at).toLocaleDateString("en-GB", { 
      weekday: "long", year: "numeric", month: "long", day: "numeric" 
    })}`, 20, 101);
    
    // Subject section
    doc.setFont("helvetica", "bold");
    doc.text("SUBJECT", 20, 118);
    doc.setFont("helvetica", "normal");
    doc.text(`${attempt.subjects?.name || "Unknown Subject"}`, 20, 128);
    
    // Performance section with box
    doc.setFillColor(245, 245, 245);
    doc.rect(20, 140, pageWidth - 40, 50, "F");
    doc.setDrawColor(34, 197, 94);
    doc.rect(20, 140, pageWidth - 40, 50, "S");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("PERFORMANCE SUMMARY", pageWidth / 2, 152, { align: "center" });
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const col1 = 35;
    const col2 = pageWidth / 2 + 10;
    
    doc.text(`Score: ${attempt.score} out of ${attempt.total_questions}`, col1, 165);
    doc.text(`Percentage: ${percentage}%`, col2, 165);
    doc.text(`Grade: ${grade}`, col1, 178);
    doc.text(`Time Taken: ${formatTime(attempt.time_taken_seconds)}`, col2, 178);
    
    // Remark
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 197, 94);
    doc.text(`Remark: ${remark}`, pageWidth / 2, 210, { align: "center" });
    
    // Signature section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    doc.line(pageWidth - 80, 250, pageWidth - 20, 250);
    doc.text("Etim Nsisong Enefiok", pageWidth - 50, 258, { align: "center" });
    doc.setFontSize(9);
    doc.text("Founder & Lead Tutor", pageWidth - 50, 265, { align: "center" });
    doc.text("GeniusLab Educational Consult", pageWidth - 50, 272, { align: "center" });
    
    // Footer
    doc.setFillColor(34, 197, 94);
    doc.rect(0, 280, pageWidth, 20, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("This is an official result slip generated by the GeniusLab CBT System", pageWidth / 2, 288, { align: "center" });
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 294, { align: "center" });
    
    // Save
    doc.save(`${attempt.profiles?.full_name || "Student"}_Result_${attempt.subjects?.name || "Exam"}.pdf`);
  };

  const generateBulkPDF = () => {
    if (filteredAttempts.length === 0) return;
    
    setDownloadingPdf(true);
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Cover page
    doc.setFillColor(34, 197, 94);
    doc.rect(0, 0, pageWidth, 50, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("GENIUSLAB", pageWidth / 2, 22, { align: "center" });
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text("EDUCATIONAL CONSULT", pageWidth / 2, 34, { align: "center" });
    doc.text("Excellence Through Knowledge", pageWidth / 2, 44, { align: "center" });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("BULK EXAMINATION RESULTS", pageWidth / 2, 75, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 90, { align: "center" });
    doc.text(`Total Students: ${filteredAttempts.length}`, pageWidth / 2, 100, { align: "center" });
    
    if (selectedSubject !== "all") {
      const subjectName = subjects.find(s => s.id === selectedSubject)?.name || "Selected Subject";
      doc.text(`Subject Filter: ${subjectName}`, pageWidth / 2, 110, { align: "center" });
    }
    
    if (startDate || endDate) {
      doc.text(`Date Range: ${startDate || "Start"} to ${endDate || "End"}`, pageWidth / 2, 120, { align: "center" });
    }
    
    // Summary statistics
    const avgScore = filteredAttempts.reduce((sum, a) => sum + getPercentage(a.score, a.total_questions), 0) / filteredAttempts.length;
    const passCount = filteredAttempts.filter(a => getPercentage(a.score, a.total_questions) >= 50).length;
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Summary Statistics", 20, 145);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Average Score: ${avgScore.toFixed(1)}%`, 20, 158);
    doc.text(`Pass Rate: ${((passCount / filteredAttempts.length) * 100).toFixed(1)}%`, 20, 168);
    doc.text(`Total Passed: ${passCount} students`, 20, 178);
    doc.text(`Total Failed: ${filteredAttempts.length - passCount} students`, 20, 188);
    
    // Results table header
    let yPos = 210;
    
    doc.setFillColor(34, 197, 94);
    doc.rect(10, yPos - 6, pageWidth - 20, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("S/N", 15, yPos);
    doc.text("Student Name", 28, yPos);
    doc.text("Subject", 85, yPos);
    doc.text("Score", 130, yPos);
    doc.text("Grade", 155, yPos);
    doc.text("Remark", 175, yPos);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    yPos += 12;
    
    filteredAttempts.forEach((attempt, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
        
        // Add header on new page
        doc.setFillColor(34, 197, 94);
        doc.rect(10, yPos - 6, pageWidth - 20, 10, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("S/N", 15, yPos);
        doc.text("Student Name", 28, yPos);
        doc.text("Subject", 85, yPos);
        doc.text("Score", 130, yPos);
        doc.text("Grade", 155, yPos);
        doc.text("Remark", 175, yPos);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        yPos += 12;
      }
      
      const percentage = getPercentage(attempt.score, attempt.total_questions);
      const { grade, remark } = getGrade(percentage);
      
      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(10, yPos - 5, pageWidth - 20, 8, "F");
      }
      
      doc.setFontSize(8);
      doc.text(`${index + 1}`, 15, yPos);
      doc.text((attempt.profiles?.full_name || "Unknown").substring(0, 25), 28, yPos);
      doc.text((attempt.subjects?.name || "N/A").substring(0, 20), 85, yPos);
      doc.text(`${attempt.score}/${attempt.total_questions} (${percentage}%)`, 130, yPos);
      doc.text(grade, 158, yPos);
      doc.text(remark.substring(0, 15), 175, yPos);
      
      yPos += 8;
    });
    
    // Final signature page
    doc.addPage();
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("This report is certified to be a true record of student performances", pageWidth / 2, 100, { align: "center" });
    doc.text("in the GeniusLab CBT Examination System.", pageWidth / 2, 110, { align: "center" });
    
    doc.line(pageWidth / 2 - 40, 150, pageWidth / 2 + 40, 150);
    doc.setFont("helvetica", "bold");
    doc.text("Etim Nsisong Enefiok", pageWidth / 2, 160, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Founder & Lead Tutor", pageWidth / 2, 168, { align: "center" });
    doc.text("GeniusLab Educational Consult", pageWidth / 2, 176, { align: "center" });
    
    // Footer on last page
    doc.setFillColor(34, 197, 94);
    doc.rect(0, 280, pageWidth, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("GeniusLab Educational Consult - Excellence Through Knowledge", pageWidth / 2, 290, { align: "center" });
    
    doc.save(`GeniusLab_Exam_Results_${new Date().toISOString().split('T')[0]}.pdf`);
    
    setDownloadingPdf(false);
    
    toast({
      title: "PDF Generated",
      description: `Downloaded results for ${filteredAttempts.length} students`,
    });
  };

  const clearFilters = () => {
    setSelectedSubject("all");
    setStartDate("");
    setEndDate("");
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
      {/* Global Exam Lock Card */}
      <Card className={settings?.is_exams_locked ? "border-destructive" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Global Exam Lock
          </CardTitle>
          <CardDescription>
            Lock the entire exam section to prevent all students from accessing exams
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div className="space-y-1">
              <Label htmlFor="exam-lock" className="text-base font-semibold">
                {settings?.is_exams_locked ? "Exams are LOCKED" : "Exams are OPEN"}
              </Label>
              <p className="text-sm text-muted-foreground">
                {settings?.is_exams_locked 
                  ? "No students can access the exam section (except admins)"
                  : "Students can access exams normally"}
              </p>
            </div>
            <Switch
              id="exam-lock"
              checked={settings?.is_exams_locked || false}
              onCheckedChange={handleToggleExamLock}
              disabled={saving}
            />
          </div>

          {settings?.is_exams_locked && (
            <div className="space-y-3">
              <Label>Lock Message (shown to students)</Label>
              <Textarea
                placeholder="Enter a message to explain why exams are locked..."
                value={lockMessage}
                onChange={(e) => setLockMessage(e.target.value)}
                rows={2}
              />
              <Button 
                onClick={handleSaveLockMessage} 
                disabled={saving}
                variant="outline"
                size="sm"
              >
                Save Message
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Semester Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Active Semester
          </CardTitle>
          <CardDescription>
            Choose which semester students can see and practice. Only subjects tagged with the active semester will be shown.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/50">
            <Label className="text-base font-semibold whitespace-nowrap">Current Semester:</Label>
            <div className="flex gap-2">
              <Button
                variant={(settings as any)?.active_semester === "first" ? "default" : "outline"}
                onClick={async () => {
                  if (!settings) return;
                  setSaving(true);
                  try {
                    const { error } = await supabase
                      .from("exam_settings")
                      .update({ active_semester: "first" } as any)
                      .eq("id", settings.id);
                    if (error) throw error;
                    setSettings(prev => prev ? { ...prev, active_semester: "first" } as any : null);
                    toast({ title: "1st Semester Activated", description: "Students will now see 1st semester subjects only" });
                  } catch {
                    toast({ title: "Error", description: "Failed to update", variant: "destructive" });
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
              >
                1st Semester
              </Button>
              <Button
                variant={(settings as any)?.active_semester === "second" ? "default" : "outline"}
                onClick={async () => {
                  if (!settings) return;
                  setSaving(true);
                  try {
                    const { error } = await supabase
                      .from("exam_settings")
                      .update({ active_semester: "second" } as any)
                      .eq("id", settings.id);
                    if (error) throw error;
                    setSettings(prev => prev ? { ...prev, active_semester: "second" } as any : null);
                    toast({ title: "2nd Semester Activated", description: "Students will now see 2nd semester subjects only" });
                  } catch {
                    toast({ title: "Error", description: "Failed to update", variant: "destructive" });
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
              >
                2nd Semester
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            💡 Students will only see subjects that match the active semester. Switch this when a new semester begins.
          </p>
        </CardContent>
      </Card>

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

          {/* Duration Selector */}
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

      {/* Student Results Card */}
      {settings?.is_exam_mode && (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Student Performances
                </CardTitle>
                <CardDescription>
                  View, filter, and download student exam results as PDF
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
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
                  onClick={generateBulkPDF}
                  disabled={filteredAttempts.length === 0 || downloadingPdf}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF ({filteredAttempts.length})
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={examAttempts.length === 0 || clearing}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear All Results?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all {examAttempts.length} student performances. This action cannot be undone. Make sure you have downloaded the results before clearing.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={clearAllResults} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Clear All Results"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Label htmlFor="subject-filter" className="text-sm whitespace-nowrap">Subject:</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="w-[180px]" id="subject-filter">
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="start-date" className="text-sm whitespace-nowrap">From:</Label>
                <Input
                  type="date"
                  id="start-date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-[150px]"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Label htmlFor="end-date" className="text-sm whitespace-nowrap">To:</Label>
                <Input
                  type="date"
                  id="end-date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-[150px]"
                />
              </div>
              
              {(selectedSubject !== "all" || startDate || endDate) && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>

            {attemptsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredAttempts.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {examAttempts.length === 0 ? "No exam attempts yet" : "No results match your filters"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {examAttempts.length === 0 
                    ? "Student results will appear here as they complete exams"
                    : "Try adjusting the filters to see more results"}
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
                      <TableHead className="text-right">PDF</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttempts.map((attempt) => {
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
                              onClick={() => generatePDF(attempt)}
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